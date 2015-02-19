# gumyen
Guess My Encoding. Small module that scratches a personal itch around opening files which may be utf8/16

## caveats
Currently this is optimised for the (rather specific) case of determining the encoding of XML and JSON files
which may be any of UTF8/16-LE/16-BE. Gumyen works by reading the first 10 octets of a file and then
(a) checking for a byte order mark, then if not found (b) checking for '{' encoded in utf16le or be as the first
character of the file, and then (c) the string <?xml in each of the three encodings utf8, utf16le, utf16be.

## usage

```javascript
var gumyen = require('gumyen')

gumyen.encoding(filename, function(err, encoding) {
  // encoding is 'utf8', 'utf16le', 'utf16be'
});

var encoding = encodingSync(filename);
// sync version of above

gumyen.readFileWithDetectedEncoding(filename, function(err, data, encoding) {
  // encoding is 'utf8', 'utf16le', 'utf16be'
  // data ios string contents of file
});

var data = gumyen.readFileWithDetectedEncodingSync(filename);
// sync version of above
```

## dependencies
if you're wanting to work with utf16be, you'll need a module such as [iconv-lite](https://github.com/ashtuchkin/iconv-lite "iconv-lite")

## install
npm install gumyen

## test
npm test
