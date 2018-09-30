const dynBuffer = require('../entry');
const buffer = require('buffer');
const Buffer = require('buffer').Buffer;

try {
	let bb = new dynBuffer(512);

	let inputBuffer = Buffer.from('This section describes the various association types in sequelize. When calling a method such as User.hasOne(Project), we say that the User model (the model that the function is being invoked on) is the source and the Project model (the model being passed as an argument) is the target.');

	bb.writeBlock(inputBuffer, 4, 1);
	console.log(bb.getString());
	let readedBlock = bb.readBlock(77, 4);
	console.log(readedBlock.toString());
	console.log();

	bb.writeBlock(inputBuffer, 50, 16, 128);
	console.log(bb.getString());
	readedBlock = bb.readBlock(77, 4);
	console.log(readedBlock.toString());
	console.log();

	bb.writeBlock(inputBuffer);
	console.log(bb.getString());
	readedBlock = bb.readBlock(77, 4);
	console.log(readedBlock.toString());
	console.log();

	console.log(bb.getString(4, 4));
	console.log(bb.getString(4, 0));
	console.log(bb.getString(4));
	console.log();

	console.log(bb.Pages.length);
	console.log(bb.TotalSize);
	console.log();

	bb.reset();
	console.log(bb.TotalSize);
	console.log();

	/* test ZERO buffer */
	let zeroBuffer = Buffer.alloc(0);
	bb.writeBlock(zeroBuffer);
	/**----------------**/
}
catch (err) {
	console.log(err);
}