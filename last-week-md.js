'use strict'
require('@iarna/cli')(main)
const summary = require('./summary-md.js')
const moment = require('moment')
const fs = require('fs')
const pivot = 6
const week = -1

async function main () {
  const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0})
  if (start.day() < pivot) {
    start.week(start.week()-1)
  }
  start.day(pivot)
  start.week(start.week() + week)
  const filename = start.format('YYYY-MM-DD[.md]')
  await summary(pivot, week, week * -1).pipe(fs.createWriteStream(filename))
  console.log(filename)
}
