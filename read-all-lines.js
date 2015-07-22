'use strict';

var fs = require('fs');
var E = require('linq');

//
// Read all lines of a file to an array.
//
module.exports = function (filePath) {
	var lines = fs.readFileSync(filePath)
		.toString()
		.split("\n");
	return E.from(lines)
		.select(function (line) {
			return line.trim();
		})
		.toArray();
};
