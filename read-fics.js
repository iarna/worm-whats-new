'use strict'
module.exports = readFics
const fs = require('fs')
const ndjson = require('ndjson')
const fun = require('funstream')

function readFics (filename) {
  return fun(fs.createReadStream(filename)).pipe(ndjson.parse())
}
