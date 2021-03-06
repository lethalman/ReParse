/// json -- an example JSON parser
//
// Running this program compares parse times for the Node.JS built-in
// JSON parser, a PEG.js parser built from the PEG.js example JSON
// grammar, and ReParse.

var sys = require('sys'),
    ReParse = require('../lib/reparse').ReParse,
    peg = require('./pegjson').parser;

function parse(data) {
  return (new ReParse(data, true)).start(value);
}

function value() {
  return this.choice(literal, string, number, array, object);
}

function object() {
  return this.between(/^\{/, /^\}/, members).reduce(function(obj, pair) {
    obj[pair[1]] = pair[3];
    return obj;
  }, {});
}

function members() {
  return this.sepBy(pair, /^,/);
}

function pair() {
  return this.seq(string, /^:/, value);
}

function array() {
  return this.between(/^\[/, /^\]/, elements);
}

function elements() {
  return this.sepBy(value, /^,/);
}

var LITERAL = { 'true': true, 'false': false, 'null': null };
function literal() {
  return LITERAL[this.match(/^(true|false|null)/)];
}

var STRING = { '"': 34, '\\': 92, '/': 47, 'b': 8, 'f': 12, 'n': 10, 'r': 13, 't': 9};
function string() {
  var chars = this.match(/^"((?:\\["\\/bfnrt]|\\u[0-9a-fA-F]{4}|[^"\\])*)"/);
  return chars.replace(/\\(["\\/bfnrt])|\\u([0-9a-fA-F]{4})/g, function(_, $1, $2) {
    return String.fromCharCode($1 ? STRING[$1] : parseInt($2, 16));
  });
}

function number() {
  return parseFloat(this.match(/^\-?\d+(?:\.\d+)?(?:[eE][\+\-]?\d+)?/));
}


/// --- Aux

function capture(stream, encoding, fn) {
  var data = '';

  stream.setEncoding(encoding);

  stream.on('data', function(chunk) {
    data += chunk;
  });

  stream.on('end', function() {
    fn(data);
  });
}

function time(label, reps, fn) {
  var start = Date.now();
  for (var i = 0; i < reps; i++)
    fn();
  sys.puts(label + ': ' + (Date.now() - start));
}


/// --- Main Program

var input = '{"a": [1, "foo", [], {"foo": 1, "bar": [1, 2, 3]}] }';

time('JSON', 1000, function() {
  JSON.parse(input);
});

time('PEG.js', 1000, function() {
  peg.parse(input);;
});

time('ReParse', 1000, function() {
  parse(input);
});
