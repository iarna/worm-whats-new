'use strict'
const fs = require('fs')
const readFics = require('./read-fics.js')
const approx = require('approximate-number');
const moment = require('moment')

const { shortlink } = require('./summary-lib.js')((label, href) => `[${label}](${href})`)

const search = new RegExp(process.argv.slice(2).join(' '), 'i')

readFics(`${__dirname}/Fanfic.json`)
  .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm' || t === 'fusion:Worm'))
  .filter(fic => search.test(fic.title) || fic.tags.some(t => search.test(t)))
  .sort((a, b) => moment(a.updated).isAfter(b.updated) ? -1 : moment(a.updated).isBefore(b.updated) ? 1 : 0)
//  .sort((a, b) => b.words - a.words)
  .forEach(printFic)

function printFic (fic) {
  const link = fic.identifiers.split(',').filter(i => /^ur[li]/.test(i))[0].replace(/^ur[li]:/,'')
  if (!fic.meta) console.log(fic)
  const authorurl = fic.authorurl || fic.meta.authorUrl
  if (!fic.meta.chapters) return console.log(fic)
  if (fic.tags.some(t => t === 'Snippets')) {
    fic.title = fic.title.replace(/^[^:]+: /i, '')
  }
  console.log(`* [${fic.title}](${shortlink(link)}) by [${fic.authors}](${shortlink(authorurl)}) (${cstr(fic.meta.chapters.length)}, ${approx(fic.words)} words), last updated ${reldate(fic.updated)}: ${fic.tags.join(', ')}`)
}

function reldate (date) {
  const m = moment(date)
  if (m.year() != moment().year()) {
    return m.format('MMM YYYY')
  } else {
    return m.format('MMM Do')
  }
}

function cstr (chapters, chapterPrefix) {
  const pre = chapterPrefix ? `${chapterPrefix} ` : ''
  if (chapters === 1) {
    return `${chapters} ${pre}chapter`
  } else {
    return `${chapters} ${pre}chapters`
  }
}
