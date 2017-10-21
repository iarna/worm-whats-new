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

const xoverLinks = require('./substitutions/xover.js')
const ficLinks = require('./substitutions/fics.js')
const charLinks = require('./substitutions/chars.js')
const tagLinks = require('./substitutions/tags.js')
const catLinks = require('./substitutions/cats.js')

const {
  shortlink, things, strify, tagify, cstr, inRange, chapterDate, linkSite,
  updateSummary
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

  printSummary(start, end, ourStream).catch(err => ourStream.emit('error', err))
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

  const xml  = `https://shared.by.re-becca.org/misc/worm/this-week.xml`
  const html = `https://shared.by.re-becca.org/misc/worm/this-week.html`
  ourStream.write('<?xml version="1.0" encoding="UTF-8"?>\n')
  ourStream.write('<feed xml:lang="en-US" xmlns="http://www.w3.org/2005/Atom">\n')
  ourStream.write(`  <id>${xml}</id>\n`)
  ourStream.write(`  <link rel="alternate" type="text/html" href="${html}"/>\n`)
  ourStream.write(`  <link rel="self" type="application/atom+xml" href="${xml}"/>\n`)
  ourStream.write(`  <title>This week's Worm fanfic updates</title>\n`)
  ourStream.write(`  <modified>${new Date().toISOString()}</modified>\n`)

  return readFics(`${__dirname}/Fanfic.json`)
    .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm'))
    .filter(fic => fic.chapters)
    .filter(fic => {
      fic.newChapters = fic.chapters.filter(chap => !/staff/i.test(chap.type) && inRange(chapterDate(chap), start, end))
      if (fic.newChapters.length) fic.modified = chapterDate(fic.newChapters[fic.newChapters.length - 1])
      return fic.newChapters.length
    })
    .filter(fic => fic.tags.length === 0 || !fic.tags.some(t => t === 'noindex'))
    .sort((a, b) => moment(a.modified).isAfter(b.modified) ? 1 : moment(a.modified).isBefore(b.modified) ? -1 : 0)
    .forEach(fic => {
      fic.newChapters = fic.chapters ? fic.chapters.filter(chap => !/staff/i.test(chap.type) && inRange(chapterDate(chap), start, end)) : []
      if (!fic.newChapters.length) {
//        console.error('No new chapters, skipping:', fic.title)
        return
      }
      fic.oldChapters = fic.chapters ? fic.chapters.filter(chap => start.isAfter(chapterDate(chap))) : []
      const prevChapter = fic.oldChapters.length && fic.oldChapters[fic.oldChapters.length - 1]
      const newChapter = fic.newChapters.length && chapterDate(fic.newChapters[0]).subtract(3, 'month')
      if (fic.tags.some(t => t === 'Snippets')) {
        fic.title = fic.title.replace(/^[^:]+: /i, '')
      }
      if (fic.status === 'complete' || fic.status === 'one-shot') {
        // nothing
      } else if (start.isSameOrBefore(fic.created)) {
        fic.status = 'new'
      } else if (prevChapter && chapterDate(prevChapter).isBefore(newChapter)) {
        fic.status = 'revived'
      } else {
        fic.status = 'updated'
      }
      printFic(ourStream, fic)
    }).then(() => {
      ourStream.write('</feed>\n')
      ourStream.end()
    })
}

function printFic (ourStream, fic) {
  const link = fic.links[0]
  const chapters = fic.chapters.length
  const newChapters = fic.newChapters.length
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
  const authorurl = fic.authorurl
  let summary = []
  if (fic.series && fic.series !== fic.title) {
    summary.push(`<b>Follows:</b> ${tagify(fic.series, ficLinks)}`)
  }
  summary.push(html`<b>Status:</b> ${fic.status}`)
  summary.push(html`<b>Added:</b> ${updateSummary(fic)}`)
  ourStream.write(html`<b>Total length:</b> ${cstr(chapters)}, ${approx(fic.words)} words` +
    ' (' + fic.links.map(l =>html`<a href="${shortlink(l)}">${linkSite(l)}</a>`).join(', ') + ')\n')
  
  const genre = fic.tags.filter(t => /^genre:/.test(t)).map(t => t.slice(6))
  let xover = fic.tags.filter(t => /^xover:/.test(t)).map(t => t.slice(6)).filter(t => t !== 'Worm')
  const fandom = fic.fandom
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
    .map(t => /altpower:/.test(t) ? tagify(t, Object.assign({}, charLinks, xoverLinks))  : t)
  summary.push(html`<b>Updated on:</b> ${chapterDate(fic.newChapters[fic.newChapters.length -1]).format('ddd [at] h a')} UTC`)
  if (genre.length !== 0) summary.push(html`<b>Genre:</b> ${genre.join(', ')}\n`)
  if (category.length !== 0) summary.push(`<b>Category:</b> ${strify(category, catLinks)}\n`)
  if (xover.length !== 0) summary.push(`<b>Crossover:</b> ${strify(xover, xoverLinks)}\n`)
  if (fusion.length !== 0) summary.push(`<b>Fusion:</b> ${strify(fusion, xoverLinks)}\n`)
  if (meta.length !== 0) summary.push(`<b>Meta-fanfiction of:</b> ${strify(meta, ficLinks)}\n`)
  if (tags.length !== 0) summary.push(`<b>Tags:</b> ${strify(tags, tagLinks)}\n`)
  if (fic.pov != '' && fic.pov != null) summary.push(`<b>POV:</b> ${strify(fic.pov.split(/, /), charLinks)}\n`)
  if (fic.otn.length) summary.push(`<b>Romantic pairing:</b> ${strify(fic.otn, charLinks)}\n`)
  if (fic.ftn.length) summary.push(`<b>Friendship pairing:</b> ${strify(fic.ftn, charLinks)}\n`)
  if (characters.length) summary.push(`<b>Characters:</b> ${strify(characters, charLinks)}\n`)
  if (rating.length) summary.push(html`<b>Rating:</b> ${rating}\n`)
  if (fic.rec != '' && fic.rec != null) summary.push(`<b>Summary:</b><br>${fic.rec}\n`)

  ourStream.write(html`  <entry>
    <id>${shortlink(link)}#${fic.chapters.length}</id>
    <published>${moment(fic.created).toISOString()}</published>
    <modified>${moment(fic.modified).toISOString()}</modified>
    <link href="${shortlink(firstUpdate.link)}"/>
    <title>${fic.title} - ${firstUpdate.name}</title>
    <summary type="html">${summary.join('<br>\n')}</summary>
    <author>
      <name>${fic.author}</name>
      ${authorurl ? '<uri>' + shortlink(authorurl) + '</uri>' : ''}
    </author>
  </entry>\n`)
}
