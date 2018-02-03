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
const writtenNumber = require('written-number')
const qw = require('qw')
const titleSort = require('./title-sort.js')
const fun = require('funstream')
const marky = require("marky-markdown")
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

  return fun.with(ourStream => printSummary(start, end, sections, ourStream))
}
module.exports.fromDates = (start, end, sections) => {
  return fun.with(ourStream => printSummary(start, end, sections, ourStream))
}

function notCanon (fic) {
  return fic.title !== 'Worm' && fic.title !== 'Ward'
}

async function printSummary (start, end, sectionList, ourStream) {
  const sections = new Set(sectionList || qw`
    week
    ward
    new-fic completed-fic oneshot-fic revived-fic updated-fic
    new-quest completed-quest oneshot-quest revived-quest updated-quest`)
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
      newNoSingles: [],
      allUpdated: []
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
      newNoSingles: [],
      allUpdated: []
    }
  }
  const isQuest = fic => fic.tags.some(t => t === 'Quest')
  const bucket = fic => changes[isQuest(fic) ? 'quest' : 'fic']
  const xmlUrl  = `https://shared.by.re-becca.org/misc/worm/this-week.xml`
  let ward
  let worm

console.log('reading')
  let all = await readFics(`${__dirname}/Fanfic.json`)
    .filter(fic => fic.title !== 'Worm (annotate)' && fic.title !== 'Worm (Comments)')
    .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm' || t === 'fusion:Worm'))
    .filter(fic => fic.words)
    .filter(fic => fic.modified)
    .filter(fic => fic.chapters)
    .filter(fic => fic.tags.length === 0 || !fic.tags.some(t => t === 'noindex' || t === 'NSFW'))
    .filter(fic => {
      fic.newChapters = fic.chapters.filter(chap => !/staff/i.test(chap.type) && inRange(chapterDate(chap), start, end))
      fic.newestChapter = fic.chapters.filter(chap => !/staff/i.test(chap.type) && start.isBefore(chapterDate(chap)))[0]
      return fic.newChapters.length
    })
    .list()
console.log('filter complete')
  all.sort(titleSort(fic => fic.title))
console.log('sort complete')
  all.forEach(fic => {
    if (fic.created) fic.created = moment(fic.created)
    fic.newChapCount = fic.newChapters.filter(chap => !chap.type || chap.type === 'chapter').length
    fic.newWords = fic.newChapters.filter(chap => !chap.type || chap.type === 'chapter').map(c => c.words).reduce((a, b) => a + b, 0)
    if (sections.has('toptens')) {
      fic.newInfracts = fic.chapters.filter(chap => /staff/i.test(chap.type) && inRange(chapterDate(chap), start, end)).length
    }
    fic.oldChapters = fic.chapters.filter(chap => start.isAfter(chapterDate(chap)))
    fic.newChapters.sort(cmpChapter)
    fic.oldChapters.sort(cmpChapter)
    if (fic.title === 'Ward') {
      ward = fic
      return
    } else if (fic.title === 'Worm') {
      worm = fic
      return
    }
    const prevChapter = fic.oldChapters.length && chapterDate(fic.oldChapters[fic.oldChapters.length - 1])
    const newChapter = fic.newChapters.length && chapterDate(fic.newChapters[0]).clone().subtract(3, 'month')
    const latestChapter = fic.newChapters.length && chapterDate(fic.newChapters[fic.newChapters.length - 1])
    if (fic.tags.some(t => t === 'Snippets')) {
      fic.title = fic.title.replace(/^[^:]+: /i, '')
    }
    if (fic.status === 'complete' && inRange(chapterDate(fic.newestChapter), start, end)) {
      bucket(fic).completed.push(fic)
      return
    } else if (fic.status === 'one-shot') {
      bucket(fic).oneshot.push(fic)
      return
    }
    if (end.clone().subtract(3, 'month').isSameOrBefore(latestChapter)) {
      fic.status = 'active'
      bucket(fic).active.push(fic)
    } else if (fic.chapters.length === 1) {
      fic.status = 'singles'
      bucket(fic).singles.push(fic)
    } else {
      fic.status = 'stalled'
      bucket(fic).stalled.push(fic)
    }
    if (start.isSameOrBefore(fic.created)) {
      fic.status = 'new'
      bucket(fic).new.push(fic)
      if (fic.chapters.length !== 1) bucket(fic).newNoSingles.push(fic)
    } else if (prevChapter && newChapter && prevChapter.isBefore(newChapter)) {
      fic.status = 'revived'
      bucket(fic).revived.push(fic)
      bucket(fic).allUpdated.push(fic)
    } else {
      bucket(fic).updated.push(fic)
      bucket(fic).allUpdated.push(fic)
    }
  })

  function dateCompare (a, b) {
   if (a.created.isBefore(b.created)) return -1
   if (b.created.isBefore(a.created)) return 1
   return 0
  }

  all = all.filter(fic => fic.title !== 'Worm' && fic.title !== 'Ward')
  console.log('initial loading complete')
  let toptens = {}
  let totals = {}
  if (sections.has('toptens')) {
    toptens.wordiest = all.sort((a, b) => b.newWords - a.newWords).slice(0,10)
    toptens.oldest = all.filter(fic => fic.created).sort(dateCompare).slice(0, 10)
    toptens.infracts = all.sort((a, b) => b.newInfracts - a.newInfracts).slice(0,10)
  }
  if (sections.has('totals')) {
    totals.fics = all.length
    totals.words = all.reduce((acc, fic) => acc + fic.newWords, 0)
    totals.chapters = all.reduce((acc, fic) => acc + fic.newChapCount, 0)
    totals.xovers = all.filter(fic => fic.fandom !== 'Worm' || fic.tags.some(t => /^xover:|^Multicross/.test(t))).length
    totals.altpowers = all.filter(fic => fic.tags.some(t => /^altpower:/.test(t))).length
    totals.vanilla = all.filter(fic => fic.fandom === 'Worm' && !fic.tags.some(t => /^altpower:|^xover:|^Multicross/.test(t))).length
    const doy = new Array(367)
    for (let ii=0; ii<367; ++ii) doy[ii] = 0
    all.forEach(fic => ++ doy[fic.created.dayOfYear()])
    const biggest = Object.keys(doy).sort((a, b) => doy[b] - doy[a]).slice(0, 1)[0]
    totals.biggestDate = start.clone().dayOfYear(biggest)
    totals.biggestAmt = doy[biggest]
    totals.none = Object.keys(doy).slice(1).filter(d => doy[d] === 0).map(d => start.clone().dayOfYear(d))
  }

console.log('reporting')
  const week = `${start.format('YYYY-MMM-DD')} to ${end.clone().subtract(1, 'days').format('MMM-DD')}`
  const year = start.format('YYYY')
  ourStream.write('<!DOCTYPE html>\n')
  ourStream.write('<html>\n')
  ourStream.write('<head>\n')
  ourStream.write('<meta charset="utf-8">\n')
  if (sections.has('week')) {
    ourStream.write(html`<title>New and updated Worm fanfic in the week of ${week}</title>\n`)
  } else if (sections.has('year')) {
    ourStream.write(html`<title>New and updated Worm fanfic in the year of ${year}</title>\n`)
  }
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
  article.cover {
    min-height: 170px;
  }
  img {
    display: inline-block;
    float: right;
    max-width:120px;
    max-height:160px;
    width: auto;
    height: auto;
  }
  a[href] { text-decoration: none; color: ForestGreen; }
  p { margin-top: 0; }
  </style>\n`)
  ourStream.write('</head>\n')
  ourStream.write('<body>\n')
  if (sections.has('week')) {
    ourStream.write(`<h2>New and updated Worm fanfic in the week of <span class="week">${week}</span></h2>\n`)
  } else if (sections.has('year')) {
    ourStream.write(`<h2>New and updated Worm fanfic in the year of <span class="week">${year}</span></h2>\n`)
  }
  if (sections.has('totals')) {
    ourStream.write(`You all updated ${approx(totals.fics)} fic in ${year}, having ${approx(totals.words)} `
      + `words in them spread across ${approx(totals.chapters)} chapters! `
      + `That's ${approx(totals.words / 525600)} words a minute! `
      + `<br><br>\n`
      + `Of those ${approx(totals.xovers)} were definitely crossovers or… uh, well, more likely altpowers borrowed from other sources. `
      + `Another ${approx(totals.altpowers)} were definitely altpowers. `
      + `As many as ${approx(totals.vanilla)} fic may have been free of altpowers and crossovers, but I’m dubious. I suspect `
      + `there are a bunch of untagged altpowers lurking amongst them.`
      + `<br><br>\n`
      + `The ${relativeDate(totals.biggestDate)} saw the most new fic, with a total of ${totals.biggestAmt} started that day! `)
    if (totals.none.length) {
      ourStream.write(`Meanwhile, there were ${totals.none.length} days without new fic`)
      if (totals.none.length < 5) {
        ourStream.write(`: ${totals.none.map(relativeDate).join(', ')}. `)
      } else {
        ourStream.write(`.`)
      }
    } else {
      ourStream.write(`Every day this year saw a new fic started! `)
    }
    ourStream.write(`<br><br>\n`)
  }
  for (let type of qw`fic quest`) {
    const updates = []
    if (changes[type].new.length && sections.has(`new-${type}`)) {
      updates.push(html`<a href="#new-${type}">${writtenNumber(changes[type].new.length)} new ${things(changes[type].new.length, type)}</a>`)
    }
    if (changes[type].newNoSingles.length && sections.has(`new-no-singles-${type}`)) {
      updates.push(html`<a href="#newNoSingles-${type}">${writtenNumber(changes[type].newNoSingles.length)} new ${things(changes[type].newNoSingles.length, type)}</a>`)
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
    if (changes[type].allUpdated.length && sections.has(`all-updated-${type}`)) {
      updates.push(html`<a href="#allUpdated-${type}">${writtenNumber(changes[type].allUpdated.length)} updated ${things(changes[type].active.length, type)}</a>`)
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
      ourStream.write(`<br>There were also ${updatestr}.<br>\n`)
    }
  }
  if (sections.has('toptens')) {
    ourStream.write(`<h2><u>The Ten Oldest Fic Updated in ${year}</u></h2>\n`)
    toptens.oldest.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    if (toptens.infracts.length && toptens.infracts[0].newInfracts > 0) {
      ourStream.write(`<h2><u>Annoyed the mods the most in ${year}</u></h2>\n`)
      toptens.infracts.forEach(fic => printFic(ourStream, fic))
      ourStream.write(`<br><br>\n`)
    }
    ourStream.write(`<h2><u>The Ten Wordiest Fic of ${year}</u></h2>\n`)
    toptens.wordiest.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
  }
  if (ward && sections.has('ward')) {
    ourStream.write(`<h2><u>Ward Updates</u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(Parahumans 2 - The rules have changed)</em></p>\n`)
    printFic(ourStream, ward)
    ourStream.write(`<br><br>\n`)
  }
  if (worm && sections.has('worm')) {
    ourStream.write(`<h2><u>Worm Updates</u></h2>\n`)
    printFic(ourStream, worm)
    ourStream.write(`<br><br>\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].new.length || !sections.has(`new-${type}`)) continue
    ourStream.write(`<h2><u><a name="new-${type}">New ${ucfirst(type)}s</a></u></h2>\n`)
    changes[type].new.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`New ${type}:`, changes[type].new.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].newNoSingles.length || !sections.has(`new-no-singles-${type}`)) continue
    ourStream.write(`<h2><u><a name="newNoSingles-${type}">New ${ucfirst(type)}s</a></u></h2>\n`)
    changes[type].newNoSingles.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`New ${type}:`, changes[type].newNoSingles.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].completed.length || !sections.has(`completed-${type}`)) continue
    ourStream.write(`<h2><u><a name="completed-${type}">Completed ${ucfirst(type)}s</a></u></h2>\n`)
    changes[type].completed.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Completed ${type}:`, changes[type].completed.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].oneshot.length || !sections.has(`oneshot-${type}`)) continue
    ourStream.write(`<h2><u><a name="one-shot-${type}">One-shot ${ucfirst(type)}s</a></u></h2>\n`)
    changes[type].oneshot.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`One-shot ${type}:`, changes[type].oneshot.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].revived.length || !sections.has(`revived-${type}`)) continue
    ourStream.write(`<h2><u><a name="revived-${type}">Revived ${ucfirst(type)}s</a></u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(last update was ≥ 3 months ago)</em></p>\n`)
    changes[type].revived.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Revived ${type}:`, changes[type].revived.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].updated.length || !sections.has(`updated-${type}`)) continue
    ourStream.write(`<h2><u><a name="updated-${type}">Updated ${ucfirst(type)}s</a></u></h2>\n`)
    changes[type].updated.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Updated ${type}:`, changes[type].updated.length)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].allUpdated.length || !sections.has(`allUpdated-${type}`)) continue
    ourStream.write(`<h2><u><a name="allUpdated-${type}">Updated ${ucfirst(type)}s</a></u></h2>\n`)
    changes[type].allUpdated.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Updated ${type}:`, changes[type].allUpdated.length)
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
    ourStream.write(`<h2><u><a name="singles-${type}">Never continued ${ucfirst(type)}s</u></h2>\n`)
    ourStream.write(`<p style="margin-top: -1em;"><em>(fic only got one chapter)</em></p>\n`)
    changes[type].singles.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`<br><br>\n`)
    console.error(`Only One Chapter ${type}:`, changes[type].singles.length)
  }
  ourStream.write('</body></html>\n')
}

function relativeDate (updated) {
  const updatedStr = updated.isSameOrAfter(moment().subtract(7, 'day'))
                   ? updated.format('ddd [at] h a [UTC]')
                   : updated.isSameOrAfter(moment().subtract(1, 'year'))
                   ? updated.format('Do MMM')
                   : updated.format('Do MMM, Y')
  return updatedStr
}
function printFic (ourStream, fic) {
  const chapters = fic.chapters.filter(ch => !ch.type || ch.type === 'chapter').length
  const newChapters = fic.newChapters.length
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]

  const authorurl = fic.authorurl
  const author = authorurl ? html`<a href="${shortlink(authorurl)}">${fic.author.replace(/_and_/g,'and')}</a>` : html`${fic.author}`
  if (fic.cover && !/fictionpressllc/.test(fic.cover)) {
    ourStream.write('<hr><article class="cover">\n')
    ourStream.write(`<img src="${fic.cover}">`)
  } else {
    ourStream.write('<hr><article>\n')
  }
  const series = fic.series || fic.tags.filter(t => /^follows:/.test(t)).map(t => t.slice(8))[0]
  const follows = (series && series !== fic.title) ? ` (follows ${tagify(series, ficLinks)})` : ''
  ourStream.write(html`<b><a href="${shortlink(firstUpdate.link.trim())}" title="${firstUpdate.name}">${fic.title}</a></b>${[follows]}`)
  if ((fic.status !== 'new' && fic.status !== 'one-shot') || (fic.status === 'one-shot' && newChapters !== fic.chapters.length)) {
    ourStream.write(html` (${updateSummary(fic)})\n`)
  }
  ourStream.write(`<br><b>Author:</b> ${author}\n`)
  ourStream.write(html`<br><b>Total length:</b> ${cstr(chapters)}, ${approx(fic.words)} words`)
  const links = {}
  fic.links.forEach(l => { if (!links[linkSite(l)]) links[linkSite(l)] = shortlink(l) })
  ourStream.write(' (' + Object.keys(links).map(ls =>html`<a href="${links[ls]}">${ls}</a>`).join(', ') + ')\n')

  if (fic.newInfracts) {
    ourStream.write(html`<br><b>Forum moderation actions:</b> ${approx(fic.newInfracts)}`)
  }
  
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
  const tags = fic.tags.filter(t => !/^(?:follows|genre|xover|fusion|meta|rating|rated|character|category|language):|^(?:NSFW|Quest|Snippets)$/i.test(t))
    .map(t => t.replace(/^freeform:/, ''))
    .map(t => /altpower:/.test(t) ? tagify(t, Object.assign({}, xoverLinks))  : t)

  if (fic.created) ourStream.write(html`<br><b>Created on:</b> ${relativeDate(fic.created)}`)
  const updated = chapterDate(fic.newChapters[fic.newChapters.length -1])
  ourStream.write(html`<br><b>Updated on:</b> ${relativeDate(updated)}`)
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
  if (fic.comments != '' && typeof fic.comments === 'string') ourStream.write(`<br><b>Summary:</b><br>${marky(fic.comments)}\n`)
  ourStream.write('</article>\n')
}
