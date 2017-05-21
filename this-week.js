'use strict'
const summary = require('./summary.js')
const pivot = 6 // 5 friday, 0 for sunday
const week = 0; // 0 for the current week, -7 for the previous (add 7 if pivot is sunday)
const moment = require('moment')
const fs = require('fs')

//const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0}).day((pivot - 7) + week)
const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0, month:4, day:21})
const filename = start.format('YYYY-MM-DD[.html]')
const end   = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0, month:4, day:27})

//const html = summary(pivot, week)
const html = summary.fromDates(start, end)
html.pipe(fs.createWriteStream(filename)).on('finish', () => console.log(filename))
