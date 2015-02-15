'use strict';

var fs = require('fs');

module.exports = {
  encoding: encoding,
  encodingSync: encodingSync,
  readFileWithDetectedEncoding: readFileWithDetectedEncoding,
  readFileWithDetectedEncodingSync: readFileWithDetectedEncodingSync
};

function encoding(filename, cb) {
  fs.open(filename, 'r', check);

  function check(err, fd) {
    if (err) { return cb(err); }

    var encoding = _encoding(fd);
    cb(null, encoding);
  }
}

function encodingSync(filename) {
  return _encoding(fs.openSync(filename, 'r'));
}

function readFileWithDetectedEncoding(filename, cb) {
  encoding(filename, withEncoding);

  function withEncoding(err, encoding) {
    if (err) return cb(err);

    fs.readFile(filename, function(err, buffer) {
      var offset = (buffer[0] === 0xff || buffer[0] === 0xfe )? 2 : 0;
      cb(err, buffer.toString(encoding, offset), encoding);
    });
  }
}

function readFileWithDetectedEncodingSync(filename) {
  var encoding = encodingSync(filename);
  var buffer = fs.readFileSync(filename);
  var offset = (buffer[0] === 0xff || buffer[0] === 0xfe )? 2 : 0;
  return buffer.toString(encoding, offset);
}

function _encoding(fd) {
  var encoding = 'utf8';
  var buffer = new Buffer(4);
  fs.readSync(fd, buffer, 0, 4, null);
  if (buffer[0] === 0xFF) {
    encoding = buffer[1] === 0xFF ? 'utf16be' : 'utf16le';
  }
  fs.closeSync(fd);
  return encoding;
}
