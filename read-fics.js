'use strict'
module.exports = readFics
const fs = require('fs')
const ndjson = require('ndjson')
const fun = require('funstream')

function pump () {
  const streams = [].slice.call(arguments)
  let cur = streams.shift()
  while (streams.length) {
    const next = streams.shift()
    cur.pipe(next)
    cur.on('error', e => next.emit(e))
    cur = next
  }
  return cur
}

function readFics (filename) {
  return fun.ify(pump(fs.createReadStream(filename), ndjson.parse()))
}
