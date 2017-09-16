'use strict'
/***
 This JS is terrible and bullshit, you probably want look away.
 <3 iarna
 ***/
const fs = require('fs')
const readFics = require('./read-fics.js')
const html = require('./html-template-tag')
const approx = require('approximate-number');
const moment = require('moment')
const MiniPass = require('minipass')
const writtenNumber = require('written-number')
const qw = require('qw')
const titleSort = require('./title-sort.js')

const xoverLinks = require('./substitutions/xover.js')
const ficLinks = require('./substitutions/fics.js')
const charLinks = require('./substitutions/chars.js')
const tagLinks = require('./substitutions/tags.js')
const catLinks = require('./substitutions/cats.js')

const {
  shortlink, things, strify, tagify, cstr, inRange, chapterDate, cmpChapter, ucfirst
} = require('./summary-lib.js')((label, href) => html`<a href="${href}">${label}</a>`)


module.exports = (pivot, week) => {
  const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0})
  if (start.day() < pivot) {
    start.week(start.week()-1)
  }
  start.day(pivot)
  start.week(start.week() + week)

  const end = start.clone().add(1, 'week')

  const ourStream = new MiniPass()

  printSummary(start, end, ourStream).catch(err => ourStream.emit('error', err))
  return ourStream
}

module.exports.fromDates = (start, end) => {
  const ourStream = new MiniPass()

  printSummary(start, end, ourStream)
  return ourStream
}


function printSummary (start, end, ourStream) {
  const changes = {
    fic: {
      new: [],
      revived: [],
      updated: [],
      completed: [],
      oneshot: [],
    },
    quest: {
      new: [],
      revived: [],
      updated: [],
      completed: [],
      oneshot: [],
    },
  }
  const isQuest = fic => fic.tags.some(t => t === 'Quest')
  const bucket = fic => changes[isQuest(fic) ? 'quest' : 'fic']
  const xmlUrl  = `https://shared.by.re-becca.org/misc/worm/this-week.xml`

  return readFics(`${__dirname}/Fanfic.json`)
    .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm'))
    .filter(fic => (fic.meta && fic.meta.modified) || fic.updated)
    .filter(fic => fic.meta && fic.meta.chapters)
    .filter(fic => fic.tags.length === 0 || !fic.tags.some(t => t === 'noindex'))
    .filter(fic => {
      fic.newChapters = fic.meta.chapters.filter(chap => !/staff/i.test(chap.type) && inRange(chapterDate(chap), start, end))
      return fic.newChapters.length
    })
    .sort(titleSort(fic => fic.title))
    .forEach(fic => {
      fic.oldChapters = fic.meta.chapters.filter(chap => start.isAfter(chapterDate(chap)))
      fic.newChapters.sort(cmpChapter)
      fic.oldChapters.sort(cmpChapter)
      const prevChapter = fic.oldChapters.length && fic.oldChapters[fic.oldChapters.length - 1]
      const newChapter = fic.newChapters.length && chapterDate(fic.newChapters[0]).subtract(3, 'month')
      if (fic.tags.some(t => t === 'Snippets')) {
        fic.title = fic.title.replace(/^[^:]+: /i, '')
      }
      if (fic.status === 'complete') {
        bucket(fic).completed.push(fic)
      } else if (fic.status === 'one-shot') {
        bucket(fic).oneshot.push(fic)
      } else if (start.isSameOrBefore(fic.pubdate)) {
        fic.status = 'new'
        bucket(fic).new.push(fic)
      } else if (prevChapter && chapterDate(prevChapter).isBefore(newChapter)) {
        fic.status = 'revived'
        bucket(fic).revived.push(fic)
      } else {
        bucket(fic).updated.push(fic)
      }
    }).then(() => {
      const week = `${start.format('YYYY-MMM-DD')} to ${end.subtract(1, 'days').format('MMM-DD')}`
      ourStream.write('<!DOCTYPE html>\n')
      ourStream.write('<html>\n')
      ourStream.write('<head>\n')
      ourStream.write('<meta charset="utf-8">\n')
      ourStream.write(html`<title>New and updated Worm fanfic in the week of ${week}</title>\n`)
      ourStream.write(html`<link rel="alternate" type="application/atom+xml" title="Atom feed" href="${xmlUrl}">`)
      ourStream.write(html`<style>
  body {
    margin-left: auto;
    margin-right: auto;
    margin-top: 3em;
    padding-left: 1em;
    padding-right: 1em;
    max-width: 800px;
  }
  .week {
    white-space: nowrap;
  }
  a[href] { text-decoration: none; color: ForestGreen; }
  </style>\n`)
      ourStream.write('</head>\n')
      ourStream.write('<body>\n')
      ourStream.write(`<h2>New and updated Worm fanfic in the week of <span class="week">${week}</span></h2>\n`)
      for (let type of qw`fic quest`) {
        const updates = []
        if (changes[type].new.length) {
          updates.push(html`<a href="#new-${type}">${writtenNumber(changes[type].new.length)} new ${things(changes[type].new.length, type)}</a>`)
        }
        if (changes[type].completed.length) {
          updates.push(html`<a href="#completed-${type}">${writtenNumber(changes[type].completed.length)} completed ${things(changes[type].completed.length, type)}</a>`)
        }
        if (changes[type].oneshot.length) {
          updates.push(html`<a href="#one-shot-${type}">${writtenNumber(changes[type].oneshot.length)} new one-shot ${things(changes[type].oneshot.length, type)}</a>`)
        }
        if (changes[type].revived.length) {
          updates.push(html`<a href="#revived-${type}">${writtenNumber(changes[type].revived.length)} revived ${things(changes[type].revived.length, type)}</a>`)
        }
        if (changes[type].updated.length) {
          updates.push(html`<a href="#updated-${type}">${writtenNumber(changes[type].updated.length)} updated ${things(changes[type].updated.length, type)}</a>`)
        }
        const last = updates.pop()
        const updatestr = updates.length ? updates.join(', ') + `, and ${last}` : last
        if (type === 'fic') {
          ourStream.write(`There were ${updatestr}.<br>\n`)
        } else {
          ourStream.write(`There were also ${updatestr}.<br>\n`)
        }
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].new.length) continue
        ourStream.write(`<h2><u><a name="new-${type}">New ${ucfirst(type)}s</u></h2>\n`)
        changes[type].new.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`<br><br>\n`)
        console.error(`New ${type}:`, changes[type].new.length)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].completed.length) continue
        ourStream.write(`<h2><u><a name="completed-${type}">Completed ${ucfirst(type)}s</u></h2>\n`)
        changes[type].completed.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`<br><br>\n`)
        console.error(`Completed ${type}:`, changes[type].completed.length)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].oneshot.length) continue
        ourStream.write(`<h2><u><a name="one-shot-${type}">One-shot ${ucfirst(type)}s</u></h2>\n`)
        changes[type].oneshot.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`<br><br>\n`)
        console.error(`One-shot ${type}:`, changes[type].oneshot.length)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].revived.length) continue
        ourStream.write(`<h2><u><a name="revived-${type}">Revived ${ucfirst(type)}s</u></h2>\n`)
        ourStream.write(`<p style="margin-top: -1em;"><em>(last update was ≥ 3 months ago)</em></p>\n`)
        changes[type].revived.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`<br><br>\n`)
        console.error(`Revived ${type}:`, changes[type].revived.length)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].updated.length) continue
        ourStream.write(`<h2><u><a name="updated-${type}">Updated ${ucfirst(type)}s</u></h2>\n`)
        changes[type].updated.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`<br><br>\n`)
        console.error(`Updated ${type}:`, changes[type].updated.length)
      }
      ourStream.write('</body></html>\n')
      ourStream.end()
    })
}

function printFic (ourStream, fic) {
  const chapters = fic.meta.chapters.filter(ch => !ch.type || ch.type === 'chapter').length
  const newChapters = fic.newChapters.length
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
  const firstUpdate = fic.newChapters[0] || fic.meta.chapters[fic.meta.chapters.length - 1]

  const authorurl = fic.authorurl || fic.meta.authorUrl
  const author = authorurl ? html`<a href="${shortlink(authorurl)}">${fic.authors.replace(/_and_/g,'and')}</a>` : html`${fic.authors}`
  ourStream.write('<hr><article>\n')
  const follows = (fic.series && fic.series !== fic.title) ? ` (follows ${tagify(fic.series, ficLinks)})` : ''
  ourStream.write(html`<b><a href="${shortlink(firstUpdate.link.trim())}" title="${firstUpdate.name}">${fic.title}</a>${[follows]}`)
  if (fic.status !== 'one-shot' && fic.status !== 'new') {
    ourStream.write(html` (${cstr(newChapters, fic.status !== 'one-shot' && 'new')}, ${approx(newWords)} words)\n`)
  }
  ourStream.write(`<br><b>Author:</b> ${author}</b>\n`)
  const sites = Object.keys(fic.meta.links)
  ourStream.write(html`<br><b>Total length:</b> ${cstr(chapters)}, ${approx(fic.words)} words`)
  ourStream.write(' (' + sites.map(s =>html`<a href="${shortlink(fic.meta.links[s])}">${s}</a>`).join(', ') + ')\n')
  
  const genre = fic.tags.filter(t => /^genre:/.test(t)).map(t => t.slice(6))
  let xover = fic.tags.filter(t => /^xover:/.test(t)).map(t => t.slice(6))
  const fandom = fic.fandom || fic.meta.fandom
  if (fandom !== 'Worm') xover = [fandom].concat(xover)
  const fusion = fic.tags.filter(t => /^fusion:/.test(t)).map(t => t.slice(7))
  const meta = fic.tags.filter(t => /^meta:/.test(t)).map(t => t.slice(5))
  const language = fic.tags.filter(t => /^language:/.test(t)).map(t => t.slice(9))
  let rating = fic.tags.filter(t => /^rating:/.test(t)).map(t => t.slice(7))
  rating = rating.concat(fic.tags.filter(t => /^rated:/.test(t)).map(t => t.slice(6)))
  const category = fic.tags.filter(t => /^category:/.test(t)).map(t => t.slice(9))
  const characters = fic.tags.filter(t => /^character:/.test(t))
       .map(t => t.slice(10).replace(/ \(Worm\)/, '').replace(/ - Character/i, ''))
       .map(t => tagify(t, tagLinks))
  const tags = fic.tags.filter(t => !/^(?:genre|xover|fusion|meta|rating|rated|character|category|language):|^(?:NSFW|Quest|Snippets)$/i.test(t))
    .map(t => t.replace(/^freeform:/, ''))
    .map(t => /altpower:/.test(t) ? tagify(t, Object.assign({}, xoverLinks))  : t)

  ourStream.write(html`<br><b>Updated on:</b> ${chapterDate(fic.newChapters[fic.newChapters.length -1]).format('ddd [at] h a')} UTC`)
  if (genre.length !== 0) ourStream.write(html`<br><b>Genre:</b> ${genre.join(', ')}\n`)
  if (category.length !== 0) ourStream.write(`<br><b>Category:</b> ${strify(category, catLinks)}\n`)
  if (xover.length !== 0) ourStream.write(`<br><b>Crossover:</b> ${strify(xover, xoverLinks)}\n`)
  if (fusion.length !== 0) ourStream.write(`<br><b>Fusion:</b> ${strify(fusion, xoverLinks)}\n`)
  if (meta.length !== 0) ourStream.write(`<br><b>Meta-fanfiction of:</b> ${strify(meta, ficLinks)}\n`)
  if (tags.length !== 0) ourStream.write(`<br><b>Tags:</b> ${strify(tags, Object.assign({}, tagLinks, charLinks))}\n`)
  if (fic.pov != '' && fic.pov != null) ourStream.write(`<br><b>POV:</b> ${strify(fic.pov.split(/, /), charLinks)}\n`)
  if (fic.otn != '' && fic.otn != null) ourStream.write(`<br><b>Romantic pairing:</b> ${strify(fic.otn.split(', '), charLinks)}\n`)
  if (fic.ftn != '' && fic.ftn != null) ourStream.write(`<br><b>Friendship pairing:</b> ${strify(fic.ftn.split(', '), charLinks)}\n`)
  if (characters.length) ourStream.write(`<br><b>Characters:</b> ${strify(characters, charLinks)}\n`)
  if (rating.length) ourStream.write(html`<br><b>Rating:</b> ${rating}\n`)
  if (fic.rec != '' && fic.rec != null) ourStream.write(`<br><b>Summary:</b><br>${fic.rec}\n`)
  ourStream.write('</article>\n')
}
