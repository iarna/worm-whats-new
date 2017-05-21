'use strict'
const moment = require('moment')
const fs = require('fs')
const summary = require('./summary.js')
const pivot = 0 // 5 friday, 0 for sunday
const week = 0; // 7 for the current week, 0 for the previous

const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0}).day((pivot - 7) + week)
const filename = start.format('YYYY-MM-DD[.html]')
summary(pivot, week).pipe(fs.createWriteStream(filename)).on('finish', () => console.log(filename))
