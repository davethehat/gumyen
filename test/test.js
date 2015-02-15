'use strict';

var fs = require('fs');
var path = require('path');
var async  = require('async');
var iconv = require('iconv-lite');

iconv.extendNodeEncodings();

var gumyen = require('../index.js');

var assert = require('assert');
var fileData = 'Shakespeare said... être ou ne pas être, c\'est le question';
var basedir = path.normalize(__dirname + '/..');

var encodings = {
  utf8 :   {path: null, xml: null, bom: []},
  utf16le: {path: null, xml: null, bom: [0xff, 0xfe]},
  utf16be: {path: null, xml: null, bom: [0xfe, 0xff]}
};

// just some nonsense xml - gumyen looks at the first 5 chars...
var xml = '<?xml encoding="UTF-WHATEVER"><doc></doc>';

run(function() {
  console.log('All OK!');
});

function run(done) {
  var tests = [
    createEncodedFiles,
    testEncoding,
    testEncodingSync,
    testReadFile,
    testReadFileSync
  ];

  async.series(tests, done);
}

function createEncodedFiles(done) {
  console.log('Creating test files...');
  var tempDir = path.join(basedir,'tmp');
  fs.mkdir(tempDir, withTmp);
  function withTmp() {
    Object.keys(encodings).forEach(writeEncodedFile);
    Object.keys(encodings).forEach(writeXMLFile);
    done();
  }

  function writeEncodedFile(encoding) {
    var output = path.join(tempDir, encoding + '.txt');
    encodings[encoding].path = output;
    var buf = iconv.encode(fileData, encoding);
    fs.writeFileSync(output, Buffer.concat([new Buffer(encodings[encoding].bom), buf]));
  }

  function writeXMLFile(encoding) {
    var output = path.join(tempDir, encoding + '.xml');
    encodings[encoding].xml = output;
    fs.writeFileSync(output, xml, {encoding: encoding});
  }
}

function testEncoding(done) {
  console.log('Test encoding...');
  async.each(Object.keys(encodings), check, done);

  function check(encoding, cb) {
    gumyen.encoding(encodings[encoding].path, function(err, enc) {
      assert.ok(!err);
      assert.equal(enc, encoding);
      cb(err);
    })
  }
}

function testEncodingSync(done) {
  console.log('Test encoding sync...');
  Object.keys(encodings).forEach(check);

  function check(encoding) {
    var enc = gumyen.encodingSync(encodings[encoding].path);
    assert.equal(enc, encoding);
    var xmlenc = gumyen.encodingSync(encodings[encoding].xml);
    assert.equal(xmlenc, encoding);
  }

  done();
}

function testReadFile(done) {
  console.log('Test read file...');
  async.each(Object.keys(encodings), check, done);

  function check(encoding, cb) {
    gumyen.readFileWithDetectedEncoding(encodings[encoding].path, function(err, data, enc) {
      assert.ok(!err);
      assert.equal(enc, encoding);
      assert.equal(data, fileData, 'Contents match for encoding ' + encoding);
      cb();
    });
  }
}

function testReadFileSync(done) {
  console.log('Test read file sync...');
  Object.keys(encodings).forEach(check);

  function check(encoding) {
    var data = gumyen.readFileWithDetectedEncodingSync(encodings[encoding].path);
    assert.equal(data, fileData, 'Contents match for encoding ' + encoding);
    var xmldata = gumyen.readFileWithDetectedEncodingSync(encodings[encoding].xml);
    assert.equal(xmldata, xml, 'Contents match for encoding ' + encoding);
  }

  done();
}