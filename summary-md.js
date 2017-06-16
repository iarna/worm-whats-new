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

const xoverLinks = require('./substitutions/xover.js')
const ficLinks = require('./substitutions/fics.js')
const charLinks = require('./substitutions/chars.js')
const tagLinks = require('./substitutions/tags.js')
const catLinks = require('./substitutions/cats.js')

const {
  shortlink, ucfirst, things, cstr, inRange, chapterDate, cmpChapter
} = require('./summary-lib.js')((label, href) => `[${label}](${href})`)

module.exports = (pivot, week) => {
  const start = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0})
  if (start.day() < pivot) {
    start.week(start.week()-1)
  }
  start.day(pivot)
  start.week(start.week() + week)

  const end = moment.utc({hour:0, minute:0, seconds:0, milliseconds:0})
  if (end.day() >= pivot) {
    end.add(end.week()+1)
  }
  end.day(pivot)
  end.week(end.week() + week + 1)

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
    .filter(fic => fic.fandom === 'Worm')
    .filter(fic => inRange(fic.meta ? fic.meta.modified : fic.updated, start, end))
    .filter(fic => fic.tags.length === 0 || !fic.tags.some(t => t === 'noindex'))
    .sort(titleSort(fic => fic.title))
    .forEach(fic => {
      fic.newChapters = fic.meta ? fic.meta.chapters.filter(chap => inRange(chapterDate(chap), start, end)) : []
      if (!fic.newChapters.length) {
        console.error('No new chapters, skipping:', fic.title)
        return
      }
      fic.oldChapters = fic.meta ? fic.meta.chapters.filter(chap => start.isAfter(chapterDate(chap))) : []
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
        bucket(fic).new.push(fic)
      } else if (prevChapter && chapterDate(prevChapter).isBefore(newChapter)) {
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
          ourStream.write(`This week we saw ${updatestr}.\n\n`)
        } else {
          ourStream.write(`We also saw ${updatestr}.\n\n`)
        }
      }
      ourStream.write(`[Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}](${htmlUrl})\n\n`)

      ourStream.write(`Notes and FAQ:\n\n`)
      ourStream.write(`* New to the fandom? "Quests" are little interactive games between the author and the readers where the readers vote on how the story progresses. While they're probably best enjoyed by participating they can often be solid stories unto themselves.\n`)
      ourStream.write(`* Relatedly, ["CYOA"](https://www.reddit.com/r/makeyourchoice/)s are little guides to setting, theme and character creation often used by folks writing SIs.\n`)
      ourStream.write(`* The word counts and chapter counts often (usually) include omake, so keep that in mind.\n`)
      ourStream.write(`* Days in the range are inclusive, so ALL of each day. Start and end of days are in UTC. So if you're posting on Friday evenings in the US you'll be in the next week's listing.\n`)
      ourStream.write(`* I might have missed you, especially if your fic was new or returning from a long hiatus. I mean, I really hope not? But possibly! My methods aren't perfect. If I did, please let me know and I'll make sure you get picked up in the future!\n`)
      ourStream.write(`* I pick up oneshots from personal oneshot/snippet threads, but not from the global one. (No threadmarks!) So if you want your oneshots included, start up your own personal thread to archive them.\n`)
      ourStream.write(`* I do an early draft of this over on the [Cauldron Discord](https://www.reddit.com/r/Cauldron) on Thursday evenings or Friday mornings (PDT). If you want to help out, joining and providing feedback then would be awesome!\n`)
      ourStream.write(`* There's an [RSS](https://shared.by.re-becca.org/misc/worm/this-week.xml) feed, if you're inclined that way.\n`)
      ourStream.write(`* If you're technically inclined, you can find the source for the generator [over on github](https://github.com/iarna/worm-whats-new). I'm afraid the source is kinda garbage though. You can also find the giiiagantic JSON file I use as source material.\n`)

      ourStream.write(`\n**Previous weeks:**\n\n`)
      ourStream.write(`* [Jun 3rd - June 9th](https://fics-for-the-fic-gods.tumblr.com/post/161640850493/new-and-updated-worm-fanfic-in-the-week-of)\n`)

      ourStream.write(`* [Jun 3rd - June 9th](https://www.reddit.com/r/WormFanfic/comments/6gcp5b/new_and_updated_fanfic_in_the_week_of_2017jun03/)\n`)
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
  const link = fic.identifiers.replace(/^ur[li]:/,'')
  const authorurl = fic.authorurl || fic.meta.authorUrl
  const newChapters = fic.newChapters.length
  const firstUpdate = fic.newChapters[0] || fic.meta.chapters[fic.meta.chapters.length - 1]
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
  ourStream.write(`* [${fic.title}](${link}) - [${firstUpdate.name}](${firstUpdate.link}) by [${fic.authors}](${authorurl}) added ${cstr(newChapters)}, ${approx(newWords)} words\n`)
}
