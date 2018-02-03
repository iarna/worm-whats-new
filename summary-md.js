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
} = require('./summary-lib.js')((label, href) => `[${label}](${href})`)

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
    .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm' || t === 'fusion:Worm'))
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
      updates.push(`[${writtenNumber(changes[type].new.length)} new ${things(changes[type].new.length, type)}](${htmlUrl}#new-${type})`)
    }
    if (changes[type].newNoSingles.length && sections.has(`new-no-singles-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].newNoSingles.length)} new ${things(changes[type].newNoSingles.length, type)}](${htmlUrl}#newNoSingles-${type})`)
    }
    if (changes[type].completed.length && sections.has(`completed-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].completed.length)} completed ${things(changes[type].completed.length, type)}](${htmlUrl}#completed-${type})`)
    }
    if (changes[type].oneshot.length && sections.has(`oneshot-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].oneshot.length)} new one-shot ${things(changes[type].oneshot.length, type)}](${htmlUrl}#one-shot-${type})`)
    }
    if (changes[type].revived.length && sections.has(`revived-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].revived.length)} revived ${things(changes[type].revived.length, type)}](${htmlUrl}#revived-${type})`)
    }
    if (changes[type].updated.length && sections.has(`updated-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].updated.length)} updated ${things(changes[type].updated.length, type)}](${htmlUrl}#updated-${type})`)
    }
    if (changes[type].allUpdated.length && sections.has(`all-updated-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].allUpdated.length)} updated ${things(changes[type].allUpdated.length, type)}](${htmlUrl}#allUpdated-${type})`)
    }
    if (changes[type].active.length && sections.has(`active-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].active.length)} still actively updating ${things(changes[type].active.length, type)}](${htmlUrl}#active-${type})`)
    }
    if (changes[type].stalled.length && sections.has(`stalled-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].stalled.length)} currently stalled ${things(changes[type].stalled.length, type)}](${htmlUrl}#stalled-${type})`)
    }
    if (changes[type].singles.length && sections.has(`singles-${type}`)) {
      updates.push(`[${writtenNumber(changes[type].singles.length)} never continued ${things(changes[type].singles.length, type)}](${htmlUrl}#singles-${type})`)
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
    (href, link) => `[${link}](${href})`,
    () => '', () => '', () => '*',
    () => '', () => '', () => '1.'
  ) + `\n\n`)

  ourStream.write(`# [Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}](${htmlUrl})\n\n`)

  if (sections.has('year')) {
    ourStream.write(`\n**This year's updates:**\n\n`)
  } else {
    ourStream.write(notesAndFAQ(
      (href, link) => `[${link}](${href})`,
      () => '', () => '', () => '*',
      () => '', () => '', () => '1.'
    ))

    ourStream.write(`\n**Previous weeks:**\n\n`)
  }
  
  if (sections.has('week')) {
    ourStream.write(`* [Jan 6th - Jan 12th](https://www.reddit.com/r/WormFanfic/comments/7q3tji/new_and_updated_fanfic_in_the_week_of_2018jan06/)\n`)
    ourStream.write(`* [Dec 30th - Jan 5th](https://www.reddit.com/r/WormFanfic/comments/7oirdk/new_and_updated_fanfic_in_the_week_of_2017dec30/)\n`)
    ourStream.write(`* [2017](https://www.reddit.com/r/WormFanfic/comments/7nfexz/new_and_updated_fanfic_in_the_year_of_2017/)\n`)
  } else {
    ourStream.write(`* [Dec 23rd - Dec 29th](https://www.reddit.com/r/WormFanfic/comments/7n5x8z/new_and_updated_fanfic_in_the_week_of_2017dec23/)\n`)
    ourStream.write(`* [Dec 16th - Dec 22nd](https://www.reddit.com/r/WormFanfic/comments/7lnh3l/new_and_updated_fanfic_in_the_week_of_2017dec16/)\n`)
    ourStream.write(`* [Dec 9th - Dec 15th](https://www.reddit.com/r/WormFanfic/comments/7k5kxs/new_and_updated_fanfic_in_the_week_of_2017dec09/)\n`)
    ourStream.write(`* [Dec 2nd - Dec 8th](https://www.reddit.com/r/WormFanfic/comments/7ilo83/new_and_updated_fanfic_in_the_week_of_2017dec02/)\n`)
    ourStream.write(`* [Nov 25th - Dec 1st](https://www.reddit.com/r/WormFanfic/comments/7h1nhd/new_and_updated_fanfic_in_the_week_of_2017nov25/)\n`)
    ourStream.write(`* [Nov 18th - Nov 24th](https://www.reddit.com/r/WormFanfic/comments/7fdwr7/new_and_updated_fanfic_in_the_week_of_2017nov18/)\n`)
    ourStream.write(`* [Oct 28th - Nov 17th](https://www.reddit.com/r/WormFanfic/comments/7dwedg/new_and_updated_fanfic_in_the_week_of_2017oct28/)\n`)
    ourStream.write(`* [Oct 21st - Oct 27th](https://www.reddit.com/r/WormFanfic/comments/797l5v/new_and_updated_fanfic_in_the_week_of_2017oct21/)\n`)
    ourStream.write(`* [Oct 14th - Oct 20th](https://www.reddit.com/r/WormFanfic/comments/77wyzl/new_and_updated_fanfic_in_the_week_of_2017oct14/)\n`)
    ourStream.write(`* [Oct 7th - Oct 13th](https://www.reddit.com/r/WormFanfic/comments/76anx4/new_and_updated_fanfic_in_the_week_of_2017oct07/)\n`)
    ourStream.write(`* [Sep 30th - Oct 6th](https://www.reddit.com/r/WormFanfic/comments/74tkwu/new_and_updated_fanfic_in_the_week_of_2017sep30/)\n`)
    ourStream.write(`* [Sep 23rd - Sep 29th](https://www.reddit.com/r/WormFanfic/comments/73pkvw/new_and_modified_fanfic_in_the_week_of_2017sep23/)\n`)
    ourStream.write(`* [Sep 16th - Sep 22nd](https://www.reddit.com/r/WormFanfic/comments/72048n/new_and_updated_fanfic_in_the_week_of_2017sep16/)\n`)
    ourStream.write(`* [Sep 9th - Sep 15th](https://www.reddit.com/r/WormFanfic/comments/70fgu8/new_and_updated_fanfic_in_the_week_of_2017sep09/)\n`)
    ourStream.write(`* [Sep 2nd - Sep 8th](https://www.reddit.com/r/WormFanfic/comments/6z0i8j/new_and_updated_fanfic_in_the_week_of_2017sep02/)\n`)
    ourStream.write(`* [Aug 26th - Sep 1st](https://www.reddit.com/r/WormFanfic/comments/6xketi/new_and_updated_fanfic_in_the_week_of_2017aug26/)\n`)
    ourStream.write(`* [Aug 19th - Aug 25th](https://www.reddit.com/r/WormFanfic/comments/6w4zj0/new_and_updated_fanfic_in_the_week_of_2017aug19/)\n`)
    ourStream.write(`* [Aug 11th - Aug 18th](https://www.reddit.com/r/WormFanfic/comments/6uoc4u/new_and_updated_fanfic_in_the_week_of_2017aug12/)\n`)
    ourStream.write(`* [Aug 5th - Aug 11th](https://www.reddit.com/r/WormFanfic/comments/6t6p5m/new_and_updated_fanfic_in_the_week_of_2017aug05/)\n`)
    ourStream.write(`* [July 29th - Aug 4th](https://www.reddit.com/r/WormFanfic/comments/6rq8ay/new_and_updated_fanfic_in_the_week_of_2017jul29/)\n`)
    ourStream.write(`* [July 22nd - July 28th](https://www.reddit.com/r/WormFanfic/comments/6q9g66/new_and_updated_fanfic_in_the_week_of_2017jul22/)\n`)
    ourStream.write(`* [July 15th - July 21st](https://www.reddit.com/r/WormFanfic/comments/6os9no/new_and_updated_fanfic_in_the_week_of_2017jul15/)\n`)
    ourStream.write(`* [July 8th - July 14th](https://www.reddit.com/r/WormFanfic/comments/6ne9an/new_and_updated_fanfic_in_the_week_of_2017jul08/)\n`)
    ourStream.write(`* [July 1st - July 7th](https://www.reddit.com/r/WormFanfic/comments/6lyrxl/new_and_updated_fanfic_in_the_week_of_2017jul01/)\n`)
    ourStream.write(`* [June 24th - June 30th](https://www.reddit.com/r/WormFanfic/comments/6klh09/new_and_updated_fanfic_in_the_week_of_2017jun24/)\n`)
    ourStream.write(`* [June 17th - June 23rd](https://www.reddit.com/r/WormFanfic/comments/6j5ua9/new_and_updated_fanfic_in_the_week_of_2017jun17/)\n`)
    ourStream.write(`* [June 10th - June 16th](https://www.reddit.com/r/WormFanfic/comments/6hr7ch/new_and_updated_fanfic_in_the_week_of_2017jun10/)\n`)
    ourStream.write(`* [June 3rd - June 9th](https://www.reddit.com/r/WormFanfic/comments/6gcp5b/new_and_updated_fanfic_in_the_week_of_2017jun03/)\n`)
    ourStream.write(`* [May 27th - June 2nd](https://www.reddit.com/r/WormFanfic/comments/6eyhv4/new_and_updated_fanfic_for_may_27th_to_june_2nd/)\n`)
    ourStream.write(`* [May 21st - May 26th](https://www.reddit.com/r/WormFanfic/comments/6dl1t5/fanfic_updates_for_may_21st_to_may_26th/)\n`)
    ourStream.write(`* [May 14th - May 21st](https://www.reddit.com/r/WormFanfic/comments/6c5ywx/new_stories_for_the_week_of_may_14th_2017/)\n`)
    ourStream.write(`* [May 7th - May 14th](https://www.reddit.com/r/WormFanfic/comments/6ascfv/new_stories_and_updates_for_the_week_of_may_7th/)\n`)
  }

  if (sections.has('week')) {
    ourStream.write(`\n**Concise list of updated fics:**\n\n`)
    ourStream.write(`For a more complete (and dare I say pretty) version visit the main page: [Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}](${htmlUrl})\n\n`)
  }

  if (sections.has('toptens')) {
    ourStream.write(`**The Ten Oldest Fic Updated in ${year}**\n\n`)
    toptens.oldest.forEach(fic => printLongFic(ourStream, fic))
    ourStream.write(`\n\n`)
    ourStream.write(`**Annoyed the mods the most in ${year}**\n\n`)
    toptens.infracts.forEach(fic => printLongFic(ourStream, fic))
    ourStream.write(`\n\n`)
    ourStream.write(`**The Ten Wordiest Fic of ${year}**\n\n`)
    toptens.wordiest.forEach(fic => printLongFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  if (ward && sections.has('ward')) {
    ourStream.write(`**Ward Updates**\n`)
    ourStream.write(`_(Parahumans 2 - The rules have changed)_\n\n`)
    printFic(ourStream, ward)
    ourStream.write(`\n\n`)
  }
  if (worm && sections.has('worm')) {
    ourStream.write(`**Worm Updates**\n`)
    printFic(ourStream, worm)
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].new.length || !sections.has(`new-${type}`)) continue
    ourStream.write(`**New ${ucfirst(type)}s**\n\n`)
    changes[type].new.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].newNoSingles.length || !sections.has(`new-no-singles${type}`)) continue
    ourStream.write(`**New ${ucfirst(type)}s**\n\n`)
    changes[type].newNoSingles.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].completed.length || !sections.has(`completed-${type}`)) continue
    ourStream.write(`**Completed ${ucfirst(type)}s**\n\n`)
    changes[type].completed.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].oneshot.length || !sections.has(`oneshot-${type}`)) continue
    ourStream.write(`**One-shot ${ucfirst(type)}s**\n\n`)
    changes[type].oneshot.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].revived.length || !sections.has(`revived-${type}`)) continue
    ourStream.write(`**Revived ${ucfirst(type)}s**\n`)
    ourStream.write(`_(last update was ≥ 3 months ago)_\n\n`)
    changes[type].revived.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].updated.length || !sections.has(`updated-${type}`)) continue
    ourStream.write(`**Updated ${ucfirst(type)}s**\n\n`)
    changes[type].updated.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].allUpdated.length || !sections.has(`allUpdated-${type}`)) continue
    ourStream.write(`**Updated ${ucfirst(type)}s**\n\n`)
    changes[type].allUpdated.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].active.length || !sections.has(`active-${type}`)) continue
    ourStream.write(`**Actively Updating ${ucfirst(type)}s**\n\n`)
    changes[type].active.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].stalled.length || !sections.has(`stalled-${type}`)) continue
    ourStream.write(`**Stalled ${ucfirst(type)}s**\n\n`)
    changes[type].stalled.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
  for (let type of qw`fic quest`) {
    if (!changes[type].singles.length || !sections.has(`singles-${type}`)) continue
    ourStream.write(`**Never continued ${ucfirst(type)}s**\n\n`)
    changes[type].singles.forEach(fic => printFic(ourStream, fic))
    ourStream.write(`\n\n`)
  }
}

function printFic (ourStream, fic) {
  const link = fic.links[0]
  const authorurl = fic.authorurl
  const newChapters = fic.newChapters.length
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)

  if (fic.oldChapters && fic.oldChapters.length) {
    ourStream.write(`* ${fic.title}`)
    ourStream.write(` - [${firstUpdate.name}](${firstUpdate.link})`)
  } else {
    ourStream.write(`* [${fic.title}](${link})`)
  }
  ourStream.write(` by ${fic.author}`)
  const links = {}
  fic.links.forEach(l => { if (!links[linkSite(l)]) links[linkSite(l)] = shortlink(l) })
  ourStream.write(' (' + Object.keys(links).map(ls =>`[${ls}](${links[ls]})`).join(', ') + ')\n')
  if (fic.status !== 'new' || fic.status !== 'one-shot' || (fic.status === 'one-shot' && newChapters !== fic.chapters.length)) {
    ourStream.write(` added ${updateSummary(fic)}`)
  }
  ourStream.write(`\n`)
}

function printLongFic (ourStream, fic) {
  const chapters = fic.chapters.filter(ch => !ch.type || ch.type === 'chapter').length
  const newChapters = fic.newChapters.length
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]

  const author = fic.author
  ourStream.write('\n---\n\n')
  const series = fic.series || fic.tags.filter(t => /^follows:/.test(t)).map(t => t.slice(8))[0]
  const follows = (series && series !== fic.title) ? ` (follows ${tagify(series, ficLinks)})` : ''
  ourStream.write(`* **[${fic.title}](${shortlink(firstUpdate.link.trim())})**${[follows]}`)
  if ((fic.status !== 'new' && fic.status !== 'one-shot') || (fic.status === 'one-shot' && newChapters !== fic.chapters.length)) {
    ourStream.write(` (${updateSummary(fic)})`)
  }
  ourStream.write(`\n  * **Author:** ${author}\n`)
  ourStream.write(`  * **Total length:** ${cstr(chapters)}, ${approx(fic.words)} words`)
  const links = {}
  fic.links.forEach(l => { if (!links[linkSite(l)]) links[linkSite(l)] = shortlink(l) })
  ourStream.write(' (' + Object.keys(links).map(ls =>`[${ls}](${links[ls]})`).join(', ') + ')')

  if (fic.newInfracts) {
    ourStream.write(`\n  * **Forum moderation actions:** ${approx(fic.newInfracts)}`)
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
  const tags = fic.tags.filter(t => !/^(?:follows|genre|xover|fusion|meta|rating|rated|character|category|language):|^(?:NSFW|Quest|Snippets)$/i.test(t))
    .map(t => t.replace(/^freeform:/, ''))

  if (fic.created) ourStream.write(`\n  * **Created on:** ${relativeDate(fic.created)}`)
  const updated = chapterDate(fic.newChapters[fic.newChapters.length -1])
  ourStream.write(`\n  * **Updated on:** ${relativeDate(updated)}`)
  if (genre.length !== 0) ourStream.write(`\n  * **Genre:** ${genre.join(', ')}`)
  if (category.length !== 0) ourStream.write(`\n  * **Category:** ${category.join(', ')}`)
  if (xover.length !== 0) ourStream.write(`\n  * **Crossover:** ${xover.join(', ')}`)
  if (fusion.length !== 0) ourStream.write(`\n  * **Fusion:** ${fusion.join(', ')}`)
  if (meta.length !== 0) ourStream.write(`\n  * **Meta-fanfiction of:** ${strify(meta, ficLinks)}`)
//  if (tags.length !== 0) ourStream.write(`\n  * **Tags:** ${tags.join(', ')}`)
  if (fic.pov != '' && fic.pov != null) ourStream.write(`\n  * **POV:** ${fic.pov.trim()}`)
  if (fic.otn.length) ourStream.write(`\n  * **Romantic pairing:** ${fic.otn.join(', ')}`)
  if (fic.ftn.length) ourStream.write(`\n  * **Friendship pairing:** ${fic.ftn.join(', ')}`)
  if (characters.length) ourStream.write(`\n  * **Characters:** ${characters.join(', ')}`)
  if (rating.length) ourStream.write(`\n  * **Rating:** ${rating}`)
  if (fic.rec != '' && fic.rec != null) ourStream.write(`\n  * **Summary:**\n${fic.rec.trim().replace(/\n/g, '\n    ')}`)
  ourStream.write('\n')
}

function relativeDate (updated) {
  const updatedStr = updated.isSameOrAfter(moment().subtract(7, 'day'))
                   ? updated.format('ddd [at] h a [UTC]')
                   : updated.isSameOrAfter(moment().subtract(1, 'year'))
                   ? updated.format('Do MMM')
                   : updated.format('Do MMM, Y')
  return updatedStr
}
