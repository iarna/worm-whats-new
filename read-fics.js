'use strict'
module.exports = readFics
const fs = require('fs')
const ndjson = require('ndjson')
const fun = require('funstream')
const pump = require('./pump')

function readFics (filename) {
  return fun.ify(pump(fs.createReadStream(filename), ndjson.parse()))
}
