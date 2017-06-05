'use strict'
const summary = require('./summary-bbcode.js')
const moment = require('moment')
const fs = require('fs')
const pivot = 6
const week = 0

const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0})
if (start.day() < pivot) {
  start.week(start.week()-1)
}
start.day(pivot)
const filename = start.format('YYYY-MM-DD[.bbcode]')
summary(pivot, week).pipe(fs.createWriteStream(filename)).on('finish', () => console.log(filename))
