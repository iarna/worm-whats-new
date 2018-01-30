'use strict'
const summary = require('./summary.js')
const DateTime = require('luxon').DateTime
const fs = require('fs')
const qw = require('qw')

const filename = 'all-time.html'
/*
const sections = qw`
    completed-fic oneshot-fic active-fic stalled-fic
    completed-quest oneshot-quest active-quest stalled-quest`*/
const sections = qw`active-fic stalled-fic active-quest stalled-quest`

summary.fromDates(DateTime.fromISO('2011-01-01'), DateTime.utc(), sections)
       .pipe(fs.createWriteStream(filename))
       .then(() => console.log(filename))
