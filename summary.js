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
const fun = require('funstream')

const xoverLinks = require('./substitutions/xover.js')
const ficLinks = require('./substitutions/fics.js')
const charLinks = require('./substitutions/chars.js')
const tagLinks = require('./substitutions/tags.js')
const catLinks = require('./substitutions/cats.js')

const {
  shortlink, things, strify, tagify, cstr, inRange, chapterDate, cmpChapter,
  ucfirst, linkSite, updateSummary
} = require('./summary-lib.js')((label, href) => html`<a href="${href}">${label}</a>`)


module.exports = (pivot, week, duration, sections) => {
  if (!duration) duration = 1
  const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0})
  if (start.day() < pivot) {
    start.week(start.week()-1)
  }
  start.day(pivot)
  start.week(start.week() + week)

  const end = start.clone().add(duration, 'week')

  return fun(printSummary(start, end, sections))
}

module.exports.fromDates = (start, end, sections) => {
  return fun(printSummary(start, end, sections))
}

async function printSummary (start, end, sectionList) {
  const sections = new Set(sectionList || qw`
    new-fic completed-fic oneshot-fic revived-fic updated-fic
    new-quest completed-quest oneshot-quest revived-quest updated-quest`)
  const ourStream = fun()
  const changes = {
    fic: {
      new: [],
      revived: [],
      updated: [],
      completed: [],
      oneshot: [],
      active: [],
      stalled: [],
      singles: [],
      snips: []
    },
    quest: {
      new: [],
      revived: [],
      updated: [],
      completed: [],
      oneshot: [],
      active: [],
      stalled: [],
      singles: [],
      snips: []
    },
  }
  const isQuest = fic => fic.tags.some(t => t === 'Quest')
  const bucket = fic => changes[isQuest(fic) ? 'quest' : 'fic']
  const xmlUrl  = `https://shared.by.re-becca.org/misc/worm/this-week.xml`

  await readFics(`${__dirname}/Fanfic.json`)
    .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm'))
    .filter(fic => fic.words)
    .filter(fic => fic.modified)
    .filter(fic => fic.chapters)
    .filter(fic => fic.tags.length === 0 || !fic.tags.some(t => t === 'noindex'))
    .filter(fic => {
      fic.newChapters = fic.chapters.filter(chap => !/staff/i.test(chap.type) && inRange(chapterDate(chap), start, end))
      return fic.newChapters.length
    })
    .sort(titleSort(fic => fic.title))
    .forEach(fic => {
      fic.oldChapters = fic.chapters.filter(chap => start.isAfter(chapterDate(chap)))
      fic.newChapters.sort(cmpChapter)
      fic.oldChapters.sort(cmpChapter)
      const prevChapter = fic.oldChapters.length && chapterDate(fic.oldChapters[fic.oldChapters.length - 1])
      const newChapter = fic.newChapters.length && chapterDate(fic.newChapters[0]).clone().subtract(3, 'month')
      const latestChapter = fic.newChapters.length && chapterDate(fic.newChapters[fic.newChapters.length - 1])
      if (fic.tags.some(t => t === 'Snippets')) {
        fic.title = fic.title.replace(/^[^:]+: /i, '')
      }
      if (fic.status === 'complete') {
        bucket(fic).completed.push(fic)
        return
      } else if (fic.status === 'one-shot') {
        bucket(fic).oneshot.push(fic)
        return
      }
      if (fic.tags.some(tag => tag === 'Snippets')) {
        bucket(fic).snips.push(fic)
      } else if (end.clone().subtract(3, 'month').isSameOrBefore(latestChapter)) {
        fic.status = 'active'
        bucket(fic).active.push(fic)
      } else if (fic.chapters.length === 1) {
        fic.status = 'stalled'
        bucket(fic).singles.push(fic)
      } else {
        fic.status = 'stalled'
        bucket(fic).stalled.push(fic)
      }
      if (start.isSameOrBefore(fic.created)) {
        fic.status = 'new'
        bucket(fic).new.push(fic)
      } else if (prevChapter && newChapter && prevChapter.isBefore(newChapter)) {
        fic.status = 'revived'
        bucket(fic).revived.push(fic)
      } else {
        bucket(fic).updated.push(fic)
      }
    })
  const week = `${start.format('YYYY-MMM-DD')} to ${end.clone().subtract(1, 'days').format('MMM-DD')}`
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
    if (changes[type].new.length && sections.has(`new-${type}`)) {
      updates.push(html`<a href="#new-${type}">${writtenNumber(changes[type].new.length)} new ${things(changes[type].new.length, type)}</a>`)
    }
    if (changes[type].completed.length && sections.has(`completed-${type}`)) {
      updates.push(html`<a href="#completed-${type}">${writtenNumber(changes[type].completed.length)} completed ${things(changes[type].completed.length, type)}</a>`)
    }
    if (changes[type].oneshot.length && sections.has(`oneshot-${type}`)) {
      updates.push(html`<a href="#one-shot-${type}">${writtenNumber(changes[type].oneshot.length)} new one-shot ${things(changes[type].oneshot.length, type)}</a>`)
    }
    if (changes[type].revived.length && sections.has(`revived-${type}`)) {
      updates.push(html`<a href="#revived-${type}">${writtenNumber(changes[type].revived.length)} revived ${things(changes[type].revived.length, type)}</a>`)
    }
    if (changes[type].updated.length && sections.has(`updated-${type}`)) {
      updates.push(html`<a href="#updated-${type}">${writtenNumber(changes[type].updated.length)} updated ${things(changes[type].updated.length, type)}</a>`)
    }
    if (changes[type].snips.length && sections.has(`snips-${type}`)) {
      updates.push(html`<a href="#snips-${type}">${writtenNumber(changes[type].snips.length)} snippet ${things(changes[type].snips.length, type)}</a>`)
    }
    if (changes[type].active.length && sections.has(`active-${type}`)) {
      updates.push(html`<a href="#active-${type}">${writtenNumber(changes[type].active.length)} still actively updating ${things(changes[type].active.length, type)}</a>`)
    }
    if (changes[type].stalled.length && sections.has(`stalled-${type}`)) {
      updates.push(html`<a href="#stalled-${type}">${writtenNumber(changes[type].stalled.length)} currently stalled ${things(changes[type].stalled.length, type)}</a>`)
    }
    if (changes[type].singles.length && sections.has(`singles-${type}`)) {
      updates.push(html`<a href="#singles-${type}">${writtenNumber(changes[type].singles.length)} never continued ${things(changes[type].singles.length, type)}</a>`)
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
    if (!changes[type].new.length || !sections.has(`new-${type}`)) continue
    ourStream.write(`<h2><u><a name="new-${type}">New ${ucfirst(type)}s</u></h2>\n`)
    changes[type].new.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`New ${type}:`, changes[type].new.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].completed.length || !sections.has(`completed-${type}`)) continue
    ourStream.write(`<h2><u><a name="completed-${type}">Completed ${ucfirst(type)}s</u></h2>\n`)
    changes[type].completed.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Completed ${type}:`, changes[type].completed.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].oneshot.length || !sections.has(`oneshot-${type}`)) continue
    ourStream.write(`<h2><u><a name="one-shot-${type}">One-shot ${ucfirst(type)}s</u></h2>\n`)
    changes[type].oneshot.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`One-shot ${type}:`, changes[type].oneshot.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].revived.length || !sections.has(`revived-${type}`)) continue
    ourStream.write(`<h2><u><a name="revived-${type}">Revived ${ucfirst(type)}s</u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(last update was ≥ 3 months ago)</em></p>\n`)
    changes[type].revived.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Revived ${type}:`, changes[type].revived.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].updated.length || !sections.has(`updated-${type}`)) continue
    ourStream.write(`<h2><u><a name="updated-${type}">Updated ${ucfirst(type)}s</u></h2>\n`)
    changes[type].updated.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Updated ${type}:`, changes[type].updated.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].snips.length || !sections.has(`snips-${type}`)) continue
    ourStream.write(`<h2><u><a name="snips-${type}">Snippet ${ucfirst(type)}s</u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(fic's last update was ≥ 3 months ago)</em></p>\n`)
    changes[type].snips.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Snippet ${type}:`, changes[type].snips.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].active.length || !sections.has(`active-${type}`)) continue
    ourStream.write(`<h2><u><a name="active-${type}">Actively Updating ${ucfirst(type)}s</u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(fic's last update was < 3 months ago)</em></p>\n`)
    changes[type].active.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Actively Updating ${type}:`, changes[type].active.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].stalled.length || !sections.has(`stalled-${type}`)) continue
    ourStream.write(`<h2><u><a name="stalled-${type}">Stalled ${ucfirst(type)}s</u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(fic's last update was ≥ 3 months ago)</em></p>\n`)
    changes[type].stalled.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Now Stalled ${type}:`, changes[type].stalled.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].singles.length || !sections.has(`singles-${type}`)) continue
    ourStream.write(`<h2><u><a name="singles-${type}">Only One Chapter ${ucfirst(type)}s</u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(fic's last update was ≥ 3 months ago)</em></p>\n`)
    changes[type].singles.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Only One Chapter ${type}:`, changes[type].singles.length)
  }
  ourStream.write('</body></html>\n')
  ourStream.end()
  return ourStream
}

function printFic (ourStream, fic) {
  const chapters = fic.chapters.filter(ch => !ch.type || ch.type === 'chapter').length
  const newChapters = fic.newChapters.length
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]

  const authorurl = fic.authorurl
  const author = authorurl ? html`<a href="${shortlink(authorurl)}">${fic.author.replace(/_and_/g,'and')}</a>` : html`${fic.author}`
  ourStream.write('<hr><article>\n')
  const follows = (fic.series && fic.series !== fic.title) ? ` (follows ${tagify(fic.series, ficLinks)})` : ''
  ourStream.write(html`<b><a href="${shortlink(firstUpdate.link.trim())}" title="${firstUpdate.name}">${fic.title}</a>${[follows]}`)
  if (fic.status !== 'one-shot' && fic.status !== 'new') {
    ourStream.write(html` (${updateSummary(fic)})\n`)
  }
  ourStream.write(`<br><b>Author:</b> ${author}</b>\n`)
  ourStream.write(html`<br><b>Total length:</b> ${cstr(chapters)}, ${approx(fic.words)} words`)
  const links = {}
  fic.links.forEach(l => { if (!links[linkSite(l)]) links[linkSite(l)] = shortlink(l) })
  ourStream.write(' (' + Object.keys(links).map(ls =>html`<a href="${links[ls]}">${ls}</a>`).join(', ') + ')\n')
  
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
    .map(t => /altpower:/.test(t) ? tagify(t, Object.assign({}, xoverLinks))  : t)

  ourStream.write(html`<br><b>Updated on:</b> ${chapterDate(fic.newChapters[fic.newChapters.length -1]).format('ddd [at] h a')} UTC`)
  if (genre.length !== 0) ourStream.write(html`<br><b>Genre:</b> ${genre.join(', ')}\n`)
  if (category.length !== 0) ourStream.write(`<br><b>Category:</b> ${strify(category, catLinks)}\n`)
  if (xover.length !== 0) ourStream.write(`<br><b>Crossover:</b> ${strify(xover, xoverLinks)}\n`)
  if (fusion.length !== 0) ourStream.write(`<br><b>Fusion:</b> ${strify(fusion, xoverLinks)}\n`)
  if (meta.length !== 0) ourStream.write(`<br><b>Meta-fanfiction of:</b> ${strify(meta, ficLinks)}\n`)
  if (tags.length !== 0) ourStream.write(`<br><b>Tags:</b> ${strify(tags, Object.assign({}, tagLinks, charLinks))}\n`)
  if (fic.pov != '' && fic.pov != null) ourStream.write(`<br><b>POV:</b> ${strify(fic.pov.split(/, /), charLinks)}\n`)
  if (fic.otn.length) ourStream.write(`<br><b>Romantic pairing:</b> ${strify(fic.otn, charLinks)}\n`)
  if (fic.ftn.length) ourStream.write(`<br><b>Friendship pairing:</b> ${strify(fic.ftn, charLinks)}\n`)
  if (characters.length) ourStream.write(`<br><b>Characters:</b> ${strify(characters, charLinks)}\n`)
  if (rating.length) ourStream.write(html`<br><b>Rating:</b> ${rating}\n`)
  if (fic.rec != '' && fic.rec != null) ourStream.write(`<br><b>Summary:</b><br>${fic.rec}\n`)
  ourStream.write('</article>\n')
}
