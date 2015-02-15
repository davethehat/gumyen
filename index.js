'use strict';

var fs = require('fs');

module.exports = {
  encoding: encoding,
  encodingSync: encodingSync,
  readFileWithDetectedEncoding: readFileWithDetectedEncoding,
  readFileWithDetectedEncodingSync: readFileWithDetectedEncodingSync
};


var XML_PFX   = '<?xml';
var UTF_16_LE = 'utf16le';
var UTF_16_BE = 'utf16be';
var UTF_8     = 'utf8';
var UNKNOWN   = 'unknown';
var DEFAULT   = UTF_8;

var ENCODING_MAP = {
  'fffe'   : UTF_16_LE,
  'feff'   : UTF_16_BE,
  'efbb'   : checkUTF8,
  '3c3f'   : checkUTF8XML,
  '3c00'   : checkUTF16leXML,
  '003c'   : checkUTF16beXML
};

function checkUTF8(buffer) {
  if (buffer[3] === 0xbf) return UTF_8;
  return UNKNOWN;
}

function checkUTF8XML(buffer) {
  var s = buffer.toString(UTF_8,0,5);
  return s === XML_PFX ? UTF_8: UNKNOWN;
}

function checkUTF16leXML(buffer) {
  var s = buffer.toString(UTF_16_LE,0,10);
  return s === XML_PFX ? UTF_16_LE: UNKNOWN;
}

function checkUTF16beXML(buffer) {
  var s = buffer.toString(UTF_16_BE,0,10);
  return s === XML_PFX ? UTF_16_BE: UNKNOWN;
}

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
  var buffer = new Buffer(10);
  fs.readSync(fd, buffer, 0, 10, null);
  fs.closeSync(fd);
  var key = pad(buffer[0]) + pad(buffer[1]);
  var xxx = ENCODING_MAP[key];
  return !xxx ? DEFAULT
    : typeof xxx === 'function' ? xxx(buffer)
    : xxx;

  function pad(n) {
    return ('0' + n.toString(16)).slice(-2);
  }
}
