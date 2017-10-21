'use strict'
/***
 This JS is terrible and bullshit, you probably want look away.
 <3 iarna
 ***/
const fs = require('fs')
const readFics = require('./read-fics.js')
const approx = require('approximate-number');
const moment = require('moment')
const MiniPass = require('minipass')
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
  shortlink, ucfirst, things, inRange, chapterDate, cmpChapter, linkSite, updateSummary
} = require('./summary-lib.js')((label, href) => `[${label}](${href})`)

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
  const htmlUrl = `https://shared.by.re-becca.org/misc/worm/${start.format('YYYY-MM-DD')}.html`

  return readFics(`${__dirname}/Fanfic.json`)
    .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm'))
    .filter(fic => fic.chapters)
    .filter(fic => fic.tags.length === 0 || !fic.tags.some(t => t === 'noindex'))
    .filter(fic => {
      fic.newChapters = fic.chapters.filter(chap => !/staff/i.test(chap.type) && inRange(chapterDate(chap), start, end))
      return fic.newChapters.length
    })
    .sort(titleSort(fic => fic.title))
    .forEach(fic => {
      fic.oldChapters = fic.chapters ? fic.chapters.filter(chap => start.isAfter(chapterDate(chap))) : []
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
      } else if (start.isSameOrBefore(fic.created)) {
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
      ourStream.write(`New and updated fanfic in the week of ${week}\n\n`)
      for (let type of qw`fic quest`) {
        const updates = []
        if (changes[type].new.length) {
          updates.push(`[${writtenNumber(changes[type].new.length)} new ${things(changes[type].new.length, type)}](${htmlUrl}#new-${type})`)
        }
        if (changes[type].completed.length) {
          updates.push(`[${writtenNumber(changes[type].completed.length)} completed ${things(changes[type].completed.length, type)}](${htmlUrl}#completed-${type})`)
        }
        if (changes[type].oneshot.length) {
          updates.push(`[${writtenNumber(changes[type].oneshot.length)} new one-shot ${things(changes[type].oneshot.length, type)}](${htmlUrl}#one-shot-${type})`)
        }
        if (changes[type].revived.length) {
          updates.push(`[${writtenNumber(changes[type].revived.length)} revived ${things(changes[type].revived.length, type)}](${htmlUrl}#revived-${type})`)
        }
        if (changes[type].updated.length) {
          updates.push(`[${writtenNumber(changes[type].updated.length)} updated ${things(changes[type].updated.length, type)}](${htmlUrl}#updated-${type})`)
        }
        const last = updates.pop()
        const updatestr = updates.length ? updates.join(', ') + `, and ${last}` : last
        if (type === 'fic') {
          ourStream.write(`This week we saw ${updatestr}.`)
        } else {
          ourStream.write(` We also saw ${updatestr}.`)
        }
      }
      ourStream.write(`\n\n`)

      ourStream.write(comments(
        (href, link) => `[${link}](${href})`,
        () => '', () => '', () => '*',
        () => '', () => '', () => '1.'
      ))

      ourStream.write(`# [Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}](${htmlUrl})\n\n`)

      ourStream.write(notesAndFAQ(
        (href, link) => `[${link}](${href})`,
        () => '', () => '', () => '*',
        () => '', () => '', () => '1.'
      ))

      ourStream.write(`\n**Previous weeks:**\n\n`)

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
      ourStream.write(`* [May 14th - May 21st 2017](https://www.reddit.com/r/WormFanfic/comments/6c5ywx/new_stories_for_the_week_of_may_14th_2017/)\n`)
      ourStream.write(`* [May 7th - May 14th 2017](https://www.reddit.com/r/WormFanfic/comments/6ascfv/new_stories_and_updates_for_the_week_of_may_7th/)\n`)
      ourStream.write(`\n**Concise list of updated fics:**\n\n`)
      ourStream.write(`For a more complete (and dare I say pretty) version visit the main page: [Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}](${htmlUrl})\n\n`)

      for (let type of qw`fic quest`) {
        if (!changes[type].new.length) continue
        ourStream.write(`**New ${ucfirst(type)}s**\n\n`)
        changes[type].new.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].completed.length) continue
        ourStream.write(`**Completed ${ucfirst(type)}s**\n\n`)
        changes[type].completed.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].oneshot.length) continue
        ourStream.write(`**One-shot ${ucfirst(type)}s**\n\n`)
        changes[type].oneshot.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].revived.length) continue
        ourStream.write(`**Revived ${ucfirst(type)}s**\n`)
        ourStream.write(`_(last update was ≥ 3 months ago)_\n\n`)
        changes[type].revived.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].updated.length) continue
        ourStream.write(`**Updated ${ucfirst(type)}s**\n\n`)
        changes[type].updated.forEach(fic => printFic(ourStream, fic))
        ourStream.write(`\n\n`)
      }
      ourStream.end()
    })
}

function printFic (ourStream, fic) {
  const link = fic.links[0]
  const authorurl = fic.authorurl
  const newChapters = fic.newChapters.length
  const firstUpdate = fic.newChapters[0] || fic.chapters[fic.chapters.length - 1]
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)

  if (fic.oldChapters.length) {
    ourStream.write(`* ${fic.title}`)
    ourStream.write(` - [${firstUpdate.name}](${firstUpdate.link})`)
  } else {
    ourStream.write(`* [${fic.title}](${link})`)
  }
  ourStream.write(` by ${fic.author}`)
  ourStream.write(' (' + fic.links.map(l =>`[${linkSite(l)}](${shortlink(l)})`).join(' ') + ')\n')
  if (fic.status !== 'one-shot' && fic.status !== 'new') {
    ourStream.write(` added ${updateSummary(fic)}`)
  }
  ourStream.write(`\n`)
}
