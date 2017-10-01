'use strict'
module.exports = readFics
const fs = require('fs')
const JSONStream = require('json-stream')
const fun = require('funstream')

function readFics (filename) {
  return fun(fs.createReadStream(filename)).pipe(JSONStream())
}
