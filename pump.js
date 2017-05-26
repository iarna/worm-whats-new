'use strict'
module.exports = pump

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
