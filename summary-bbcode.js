'use strict'
/***
 This JS is terrible and bullshit, you probably want look away.
 <3 iarna
 ***/
const fs = require('fs')
const readFics = require('./read-fics.js')
const approx = require('approximate-number');
const moment = require('moment')
const fun = require('funstream')
const writtenNumber = require('written-number')
const qw = require('qw')
const titleSort = require('./title-sort.js')
const comments = require('./comments.js')
const notesAndFAQ = require('./notes-and-faq.js')

const xoverLinks = require('./substitutions/xover.js')
const ficLinks = require('./substitutions/fics.js')
const charLinks = require('./substitutions/chars.js')
const tagLinks = require('./substitutions/tags.js')
const catLinks = require('./substitutions/cats.js')

const {
  shortlink, ucfirst, things, inRange, chapterDate, cmpChapter, linkSite, updateSummary, cstr, tagify, strify
} = require('./summary-lib.js')((label, href) => `[url="${href}"]${label}[/url]`)

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
    },
  }
  const isQuest = fic => fic.tags.some(t => t === 'Quest')
  const bucket = fic => changes[isQuest(fic) ? 'quest' : 'fic']
  const xmlUrl  = `https://shared.by.re-becca.org/misc/worm/this-week.xml`
  const htmlUrl = `https://shared.by.re-becca.org/misc/worm/${start.format('YYYY-MM-DD')}.html`
  let ward
  let worm

  let all = await readFics(`${__dirname}/Fanfic.json`)
    .filter(fic => fic.title !== 'Worm (annotate)' && fic.title !== 'Worm (Comments)')
    .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm'))
    .filter(fic => fic.words)
    .filter(fic => fic.modified)
    .filter(fic => fic.chapters)
    .filter(fic => fic.tags.length === 0 || !fic.tags.some(t => t === 'noindex'))
    .filter(fic => {
      fic.newChapters = fic.chapters.filter(chap => !/staff/i.test(chap.type) && inRange(chapterDate(chap), start, end))
      fic.newestChapter = fic.chapters.filter(chap => !/staff/i.test(chap.type) && start.isBefore(chapterDate(chap)))[0]
      return fic.newChapters.length
    })
    .list()
  all.sort(titleSort(fic => fic.title))
  all.forEach(fic => {
    if (fic.created) fic.created = moment(fic.created)
    fic.newChapCount = fic.newChapters.filter(chap => !chap.type || chap.type === 'chapter').length
    fic.newWords = fic.newChapters.filter(chap => !chap.type || chap.type === 'chapter').map(c => c.words).reduce((a, b) => a + b, 0)
    if (sections.has('toptens')) {
      fic.newInfracts = fic.chapters.filter(chap => /staff/i.test(chap.type) && inRange(chapterDate(chap), start, end)).length
    }
    fic.oldChapters = fic.chapters ? fic.chapters.filter(chap => start.isAfter(chapterDate(chap))) : []
    fic.newChapters.sort(cmpChapter)
    fic.oldChapters.sort(cmpChapter)
    if (fic.title === 'Ward') {
      ward = fic
      return
    } else if (fic.title === 'Worm') {
      worm = fic
      return
    }
    const prevChapter = fic.oldChapters.length && fic.oldChapters[fic.oldChapters.length - 1]
    const newChapter = fic.newChapters.length && chapterDate(fic.newChapters[0]).subtract(3, 'month')
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
      if (fic.chapters.length !== 1) bucket(fic).newNoSingles.push(fic)
      bucket(fic).new.push(fic)
    } else if (prevChapter && chapterDate(prevChapter).isBefore(newChapter)) {
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
    totals.none = Object.keys(doy).slice(1).filter(d => d[doy] === 0).map(d => start.clone().dayOfYear(d))
  }

  const week = `${start.format('YYYY-MMM-DD')} to ${end.subtract(1, 'days').format('MMM-DD')}`
  const year = start.format('YYYY')
  if (sections.has('week')) {
    ourStream.write(`New and updated fanfic in the week of ${week}\n\n`)
  } else if (sections.has('year')) {
    ourStream.write(`New and updated fanfic in the year of ${year}\n\n`)
  }
  if (sections.has('totals')) {
    ourStream.write(`You all updated ${approx(totals.fics)} fic last year, having ${approx(totals.words)} `
      + `words in them spread across ${approx(totals.chapters)} chapters! `
      + `That's ${approx(totals.words / 525600)} words a minute! `
      + `\n\n`
      + `Of those ${approx(totals.xovers)} were definitely crossovers or… uh, well, more likely altpowers borrowed from other sources. `
      + `Another ${approx(totals.altpowers)} were definitely altpowers. `
      + `The most popular crossover source was Magic: The Gathering, but at only 21 fic that's barely a drop in the bucket. `
      + `As many as ${approx(totals.vanilla)} fic may have been free of altpowers and crossovers, but I’m dubious. I suspect `
      + `there are a bunch of untagged altpowers lurking amongst them.`
      + `\n\n`
      + `The ${relativeDate(totals.biggestDate)} saw the most new fic, with a total of ${totals.biggestAmt} started that day! `)
    if (totals.none.length) {
      ourStream.write(`Meanwhile, the only days without new fic were ${totals.none.map(relativeDate).join(', ')}. `)
    } else {
      ourStream.write(`Every day this year saw a new fic started! `)
    }
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    const updates = []
    if (changes[type].new.length && sections.has(`new-${type}`)) {
      updates.push(`[url="${htmlUrl}#new-${type}"]${writtenNumber(changes[type].new.length)} new ${things(changes[type].new.length, type)}[/url]`)
    }
    if (changes[type].newNoSingles.length && sections.has(`new-no-singles-${type}`)) {
      updates.push(`[url="${htmlUrl}#newNoSingles-${type}"]${writtenNumber(changes[type].newNoSingles.length)} new ${things(changes[type].newNoSingles.length, type)}[/url]`)
    }
    if (changes[type].completed.length && sections.has(`completed-${type}`)) {
      updates.push(`[url="${htmlUrl}#completed-${type}"]${writtenNumber(changes[type].completed.length)} completed ${things(changes[type].completed.length, type)}[/url]`)
    }
    if (changes[type].oneshot.length && sections.has(`oneshot-${type}`)) {
      updates.push(`[url="${htmlUrl}#one-shot-${type}"]${writtenNumber(changes[type].oneshot.length)} new one-shot ${things(changes[type].oneshot.length, type)}[/url]`)
    }
    if (changes[type].revived.length && sections.has(`revived-${type}`)) {
      updates.push(`[url="${htmlUrl}#revived-${type}"]${writtenNumber(changes[type].revived.length)} revived ${things(changes[type].revived.length, type)}[/url]`)
    }
    if (changes[type].updated.length && sections.has(`updated-${type}`)) {
      updates.push(`[url="${htmlUrl}#updated-${type}"]${writtenNumber(changes[type].updated.length)} updated ${things(changes[type].updated.length, type)}[/url]`)
    }
    if (changes[type].allUpdated.length && sections.has(`all-updated-${type}`)) {
      updates.push(`[url="${htmlUrl}#allUpdated-${type}"]${writtenNumber(changes[type].allUpdated.length)} updated ${things(changes[type].allUpdated.length, type)}[/url]`)
    }
    if (changes[type].active.length && sections.has(`active-${type}`)) {
      updates.push(`[url="#active-${type}"]${writtenNumber(changes[type].active.length)} still actively updating ${things(changes[type].active.length, type)}[/url]`)
    }
    if (changes[type].stalled.length && sections.has(`stalled-${type}`)) {
      updates.push(`[url="#stalled-${type}"]${writtenNumber(changes[type].stalled.length)} currently stalled ${things(changes[type].stalled.length, type)}[/url]`)
    }
    if (changes[type].singles.length && sections.has(`singles-${type}`)) {
      updates.push(`[url="#singles-${type}"]${writtenNumber(changes[type].singles.length)} never continued ${things(changes[type].singles.length, type)}[/url]`)
    }
    const last = updates.pop()
    const updatestr = updates.length ? updates.join(', ') + `, and ${last}` : last
    if (type === 'fic') {
      ourStream.write(`This ${sections.has('week') ? 'week' : 'year'} we saw ${updatestr}.`)
    } else {
      ourStream.write(` We also saw ${updatestr}.`)
    }
  }
  ourStream.write(`\n\n`)

  ourStream.write(comments(
    (href, link) => `[url=${href}]${link}[/url]`,
    () => '[list]', () => '[/list]', () => '[*]',
    () => '[list=1]', () => '[/list]', () => '[*]'
  ) + '\n\n')

  ourStream.write(`[size=7][url=${htmlUrl}]Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}[/url][/size]\n\n`)
/*
  ourStream.write(notesAndFAQ(
    (href, link) => `[url=${href}]${link}[/url]`,
    () => '[list]', () => '[/list]', () => '[*]',
    () => '[list=1]', () => '[/list]', () => '[*]'
  ))
*/
  ourStream.write(`\n[spoiler="Concise list of updated fics:"]\n`)
  if (sections.has('week')) {
    ourStream.write(`For a more complete (and dare I say pretty) version visit the main page: [url=${htmlUrl}]Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}[/url]\n\n`)
  }
  if (sections.has('toptens')) {
    ourStream.write(`[size=6][b]The Ten Oldest Fic Updated in ${year}[/b][/size]\n\n`)
    toptens.oldest.forEach(fic => printLongFic(ourStream, fic))
    ourStream.write(`\n\n`)
    ourStream.write(`[size=6][b]Annoyed the mods the most in ${year}[/b][/size]\n\n`)
    toptens.infracts.forEach(fic => printLongFic(ourStream, fic))
    ourStream.write(`\n\n`)
    ourStream.write(`[size=6][b]The Ten Wordiest Fic of ${year}[/b][/size]\n\n`)
    toptens.wordiest.forEach(fic => printLongFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  if (ward && sections.has('ward')) {
    ourStream.write(`[b][u]Ward Updates[/u][/b]\n`)
    ourStream.write(`[size=3][i](Parahumans 2 - The rules have changed)[/i][/size]\n`)
    ourStream.write(`[list]`)
    printFic(ourStream, ward)
    ourStream.write(`[/list]\n\n`)
  }
  if (worm && sections.has('worm')) {
    ourStream.write(`[b][u]Worm Updates[/u][/b]\n`)
    ourStream.write(`[list]`)
    printFic(ourStream, worm)
    ourStream.write(`[/list]\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].new.length || !sections.has(`new-${type}`)) continue
    ourStream.write(`[b][u]New ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].new.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].newNoSingles.length || !sections.has(`new-no-singles-${type}`)) continue
    ourStream.write(`[b][u]New ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].newNoSingles.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].completed.length || !sections.has(`completed-${type}`)) continue
    ourStream.write(`[b][u]Completed ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].completed.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].oneshot.length || !sections.has(`oneshot-${type}`)) continue
    ourStream.write(`[b][u]One-shot ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].oneshot.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].revived.length || !sections.has(`revived-${type}`)) continue
    ourStream.write(`[b][u]Revived ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write(`[size=3][i](last update was ≥ 3 months ago)[/i][/size]\n`)
    ourStream.write('[list]')
    changes[type].revived.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].updated.length || !sections.has(`updated-${type}`)) continue
    ourStream.write(`[b][u]Updated ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].updated.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].allUpdated.length || !sections.has(`allUpdated-${type}`)) continue
    ourStream.write(`[b][u]Updated ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].allUpdated.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].active.length || !sections.has(`active-${type}`)) continue
    ourStream.write(`[b][u]Actively Updating ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].active.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].stalled.length || !sections.has(`stalled-${type}`)) continue
    ourStream.write(`[b][u]Stalled ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].stalled.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].singles.length || !sections.has(`singles-${type}`)) continue
    ourStream.write(`[b][u]Never continued ${ucfirst(type)}s[/u][/b]\n`)
    ourStream.write('[list]')
    changes[type].singles.forEach(fic => printFic(ourStream, fic))
    ourStream.write('[/list]')
    ourStream.write(`\n\n`)
  }
  ourStream.write('[/spoiler]\n')
}

function printFic (ourStream, fic) {
  const link = fic.links[0]
  const authorurl = fic.authorurl
  const newChapters = fic.newChapters.length
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)

  ourStream.write(`[*] [url="${shortlink(link)}"]${fic.title}[/url]`)
  if (fic.oldChapters.length) {
    ourStream.write(` - [url="${shortlink(firstUpdate.link)}"]${firstUpdate.name}[/url]`)
  }
  ourStream.write(` by ${fic.author}`)
  const links = {}
  fic.links.forEach(l => { if (!links[linkSite(l)]) links[linkSite(l)] = shortlink(l) })
  ourStream.write(' (' + Object.keys(links).map(ls =>`[url="${links[ls]}"]${ls}[/url]`).join(', ') + ')\n')
  if (fic.status !== 'new' || newChapters !== fic.chapters.length ) {
    ourStream.write(` added ${updateSummary(fic)}`)
  }
  ourStream.write(`\n`)
}

function relativeDate (updated) {
  const updatedStr = updated.isSameOrAfter(moment().subtract(7, 'day'))
                   ? updated.format('ddd [at] h a [UTC]')
                   : updated.isSameOrAfter(moment().subtract(1, 'year'))
                   ? updated.format('Do MMM')
                   : updated.format('Do MMM, Y')
  return updatedStr
}

function printLongFic (ourStream, fic) {
  const chapters = fic.chapters.filter(ch => !ch.type || ch.type === 'chapter').length
  const newChapters = fic.newChapters.length
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]

  const authorurl = fic.authorurl
  const author = authorurl ? `[url="${shortlink(authorurl)}"]${fic.author.replace(/_and_/g,'and')}[/url]` : `${fic.author}`
  ourStream.write('[hr][/hr]\n')
  const series = fic.series || fic.tags.filter(t => /^follows:/.test(t)).map(t => t.slice(8))[0]
  const follows = (series && series !== fic.title) ? ` (follows ${tagify(series, ficLinks)})` : ''
  ourStream.write(`[b][url="${shortlink(firstUpdate.link.trim())}"]${fic.title}[/url][/b]${[follows]}`)
  if ((fic.status !== 'new' && fic.status !== 'one-shot') || (fic.status === 'one-shot' && newChapters !== fic.chapters.length)) {
    ourStream.write(` (${updateSummary(fic)})`)
  }
  ourStream.write(`\n[b]Author:[/b] ${author}`)
  ourStream.write(`\n[b]Total length:[/b] ${cstr(chapters)}, ${approx(fic.words)} words`)
  const links = {}
  fic.links.forEach(l => { if (!links[linkSite(l)]) links[linkSite(l)] = shortlink(l) })
  ourStream.write(' (' + Object.keys(links).map(ls =>`[url="${links[ls]}"]${ls}[/url]`).join(', ') + ')')

  if (fic.newInfracts) {
    ourStream.write(`\n[b]Forum moderation actions:[/b] ${approx(fic.newInfracts)}`)
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
    .map(t => t.replace(/:/, '‐'))
    .map(t => /altpower:/.test(t) ? tagify(t, Object.assign({}, xoverLinks))  : t)

  if (fic.created) ourStream.write(`\n[b]Created on:[/b] ${relativeDate(fic.created)}`)
  const updated = chapterDate(fic.newChapters[fic.newChapters.length -1])
  ourStream.write(`\n[b]Updated on:[/b] ${relativeDate(updated)}`)
  if (genre.length !== 0) ourStream.write(`\n[b]Genre:[/b] ${genre.join(', ')}`)
  if (category.length !== 0) ourStream.write(`\n[b]Category:[/b] ${strify(category, catLinks)}`)
  if (xover.length !== 0) ourStream.write(`\n[b]Crossover:[/b] ${strify(xover, xoverLinks)}`)
  if (fusion.length !== 0) ourStream.write(`\n[b]Fusion:[/b] ${strify(fusion, xoverLinks)}`)
  if (meta.length !== 0) ourStream.write(`\n[b]Meta-fanfiction of:[/b] ${strify(meta, ficLinks)}`)
  if (tags.length !== 0) ourStream.write(`\n[b]Tags:[/b] ${strify(tags, Object.assign({}, tagLinks, charLinks))}`)
  if (fic.pov != '' && fic.pov != null) ourStream.write(`\n[b]POV:[/b] ${strify(fic.pov.split(/, /), charLinks).trim()}`)
  if (fic.otn.length) ourStream.write(`\n[b]Romantic pairing:[/b] ${strify(fic.otn, charLinks)}`)
  if (fic.ftn.length) ourStream.write(`\n[b]Friendship pairing:[/b] ${strify(fic.ftn, charLinks)}`)
  if (characters.length) ourStream.write(`\n[b]Characters:[/b] ${strify(characters, charLinks)}`)
  if (rating.length) ourStream.write(`\n[b]Rating:[/b] ${rating}`)
  if (fic.comments != '' && fic.comments != null) ourStream.write(`\n[b]Summary:[/b]\n${fic.comments.trim()}`)
  ourStream.write('\n')
}
