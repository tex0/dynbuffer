'user strict'
const buffer = require('buffer');
const Buffer = buffer.Buffer;

const deafaultPageSize = 1024;

/**
 * 
 * @param {Number} pageSize
 */
function DynBuffer(pageSize) {
	if (pageSize && !Number.isInteger(pageSize)) throw new Error('Page size parameter is invalid.');
	if (!pageSize) pageSize = deafaultPageSize;
	const pageSize_ = pageSize;
	const pages_ = [Buffer.alloc(pageSize_)];
	let totalSize_ = 0;
		
	this.__recalculateGlobalSize = function() {
		totalSize_ = pageSize_ * pages_.length;
	}
		
	this.__getPageSize = function() {
		return pageSize_;
	}
	
	this.__getPages = function() {
		return pages_;
	}
	
	this.__getTotalSize = function() {
		return totalSize_;
	}
	
	this.__recalculateGlobalSize();
}
DynBuffer.prototype = {
	get Pages() {
		return this.__getPages();
	},
	get PageSize() {
		return this.__getPageSize();
	},
	get TotalSize() {
		return this.__getTotalSize();
	}
}
/**
 * 
 * @param {Number} length
 * @param {Number} offset
 * @return {Uint8Array}
 */
DynBuffer.prototype.readBlock = function(length, offset) {
	if (offset && !Number.isInteger(offset)) throw new Error('Offset parameter is invalid.');
	if (length && !Number.isInteger(length)) throw new Error('Length parameter is invalid.');

	if (!length) length = this.TotalSize;
	if (!offset) offset = 0;

	if (length > buffer.kMaxLength) throw new Error("Required block length is too large");
	if ((offset + length) > this.TotalSize) throw new Error('Reauired block to read out of range');

	let currentPagePtr = Math.trunc(offset / this.PageSize);
	let currentPageNumber = offset < this.PageSize ? currentPagePtr : currentPagePtr + 1;
	let requiredPagesCount = Math.trunc(length / this.PageSize);
	if ((requiredPagesCount * this.PageSize) < length)
		requiredPagesCount++;
	let currentPageOffset = offset < this.PageSize ? offset : offset - (currentPagePtr * this.PageSize);

	const outputBlock = Buffer.alloc(length);
	let outputBlockOffset = 0;
	let readedLength = 0;

	for (let i = currentPagePtr; i < currentPageNumber + requiredPagesCount; i++) {
		let currentPage = this.Pages[i];
		let readedEndIndex = (length - readedLength + currentPageOffset) >= this.PageSize ? this.PageSize : length - readedLength + offset;
		currentPage.copy(outputBlock, readedLength, currentPageOffset, readedEndIndex);
		readedLength += readedEndIndex - currentPageOffset;
		currentPageOffset = 0;
	}

	return outputBlock;
}
/**
 * 
 * @param {Uint8Array} source
 * @param {Number} targetOffset
 * @param {Number} sourceOffset
 * @param {Number} sourceWrittenLength
 */
DynBuffer.prototype.writeBlock = function (source, targetOffset, sourceOffset, sourceWrittenLength) {
	if (!source) throw new Error('Source is invalid');
	if (source.length == 0) throw new Error('Source length can not be zero');
	if (targetOffset && !Number.isInteger(targetOffset)) throw new Error('Target offset parameter is invalid.');
	if (sourceOffset && !Number.isInteger(sourceOffset)) throw new Error('Source offset parameter is invalid.');
	if (sourceWrittenLength && !Number.isInteger(sourceWrittenLength)) throw new Error('Source written length parameter is invalid.');

	if (!targetOffset) targetOffset = 0;
	if (!sourceOffset) sourceOffset = 0;
	if (!sourceWrittenLength) sourceWrittenLength = source.length - sourceOffset;

	if (sourceWrittenLength > source.length - sourceOffset) throw new Error('Required source writing length is out of range');

	let requiredOverflow = targetOffset - this.TotalSize;
	let targetOffsetIsOutOfRange = requiredOverflow > 0;

	if (targetOffsetIsOutOfRange) { 
		let requiredOverflowPagesCount = Math.trunc(requiredOverflow / this.PageSize);
		if ((requiredOverflowPagesCount * this.PageSize) <= requiredOverflow)
			requiredOverflowPagesCount++;
		for (let i = 0; i < requiredOverflowPagesCount; i++) {
			this.Pages.push(Buffer.alloc(this.PageSize));
		}
		this.__recalculateGlobalSize();
		this.writeBlock(source, targetOffset, sourceOffset, sourceWrittenLength);
	}
	else {
		let currentPagePtr = Math.trunc(targetOffset / this.PageSize);
		let currentPageOffset = (targetOffset - (currentPagePtr * this.PageSize));
		let writtenCount = sourceWrittenLength - sourceOffset;
		let pagesForWrittenCount = Math.trunc(writtenCount / this.PageSize);
		if ((pagesForWrittenCount * this.PageSize) < writtenCount)
			pagesForWrittenCount++;

		for (let i = currentPagePtr; i < currentPagePtr + pagesForWrittenCount; i++) {
			if (i >= this.Pages.length)
				this.Pages.push(Buffer.alloc(this.PageSize));
			let currentPage = this.Pages[i];
			let sourceEndCopyIndex = sourceOffset + this.PageSize - currentPageOffset;
			source.copy(currentPage, currentPageOffset, sourceOffset, sourceEndCopyIndex);
			sourceOffset = sourceEndCopyIndex;
			currentPageOffset = 0;
		}
	}
	this.__recalculateGlobalSize();
}
/**
 * /
 * @param {Number} length
 * @param {Number} offset
 * @param {String} encoding
 * @return {String}
 */
DynBuffer.prototype.getString = function (length, offset, encoding) {
	if (!encoding) encoding = 'utf8';
	let readedBlock = this.readBlock(length, offset);
	if (readedBlock)
		return readedBlock.toString(encoding);
	return null;
}
/**
 * / 
 */
DynBuffer.prototype.reset = function() {
	let pagesLen = this.Pages.length;
	for (let i = 0; i < pagesLen; i++) {
		this.Pages.pop();
	}
	this.Pages.push(Buffer.alloc(this.PageSize));
	this.__recalculateGlobalSize();
}

module.exports = DynBuffer;

