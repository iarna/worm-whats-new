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
const notesAndFAQ = require('./notes-and-faq.js')

const xoverLinks = require('./substitutions/xover.js')
const ficLinks = require('./substitutions/fics.js')
const charLinks = require('./substitutions/chars.js')
const tagLinks = require('./substitutions/tags.js')
const catLinks = require('./substitutions/cats.js')

const {
  shortlink, ucfirst, things, cstr, inRange, chapterDate, cmpChapter
} = require('./summary-lib.js')((label, href) => `[url=${href}]${label}[/url]`)


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
          updates.push(`[url="${htmlUrl}#new-${type}">${writtenNumber(changes[type].new.length)} new ${things(changes[type].new.length, type)}[/url]`)
        }
        if (changes[type].completed.length) {
          updates.push(`[url="${htmlUrl}#completed-${type}"]${writtenNumber(changes[type].completed.length)} completed ${things(changes[type].completed.length, type)}[/url]`)
        }
        if (changes[type].oneshot.length) {
          updates.push(`[url="${htmlUrl}#one-shot-${type}"]${writtenNumber(changes[type].oneshot.length)} new one-shot ${things(changes[type].oneshot.length, type)}[/url]`)
        }
        if (changes[type].revived.length) {
          updates.push(`[url="${htmlUrl}#revived-${type}"]${writtenNumber(changes[type].revived.length)} revived ${things(changes[type].revived.length, type)}[/url]`)
        }
        if (changes[type].updated.length) {
          updates.push(`[url="${htmlUrl}#updated-${type}"]${writtenNumber(changes[type].updated.length)} updated ${things(changes[type].updated.length, type)}[/url]`)
        }
        const last = updates.pop()
        const updatestr = updates.length ? updates.join(', ') + `, and ${last}` : last
        if (type === 'fic') {
          ourStream.write(`This week we saw ${updatestr}.\n\n`)
        } else {
          ourStream.write(`We also saw ${updatestr}.\n\n`)
        }
      }
      ourStream.write(`[size=7][url=${htmlUrl}]Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}[/url][/size]\n\n`)

      ourStream.write(notesAndFAQ(
        (href, link) => `[url=${href}]${link}[/url]`,
        () => '[list]', () => '[/list]', () => '[*]',
        () => '[list=1]', () => '[/list]', () => '[*]'
      ))

      ourStream.write(`\nPrevious weeks:\n\n`)
      ourStream.write(`[LIST]\n`)
      ourStream.write(`[*][URL='https://forums.sufficientvelocity.com/posts/8639589/']May 27th - June 2nd[/URL]\n`)
      ourStream.write(`[*][URL='https://forums.sufficientvelocity.com/posts/8595644/']May 21st - May 26th[/URL]\n`)
      ourStream.write(`[*][URL='https://forums.sufficientvelocity.com/posts/8554383/']May 14th - May 21st 2017[/URL]\n`)
      ourStream.write(`[*][URL='https://forums.sufficientvelocity.com/posts/8513563/']May 7th - May 14th 2017[/URL]\n`)
      ourStream.write(`[*][URL='https://forums.spacebattles.com/posts/35648194/']May 27th - June 2nd[/URL]\n`)
      ourStream.write(`[*][URL='https://forums.spacebattles.com/posts/35405947/']May 21st - May 26th[/URL]\n`)
      ourStream.write(`[*][URL='https://forums.spacebattles.com/posts/35203834/']May 14th - May 21st 2017[/URL]\n`)
      ourStream.write(`[*][URL='https://forums.spacebattles.com/posts/35001643/']May 7th - May 14th 2017[/URL]\n`)
      ourStream.write(`[/LIST]`)
      ourStream.write(`\n[spoiler="Concise list of updated fics:"]\n`)
      ourStream.write(`For a more complete (and dare I say pretty) version visit the main page: [url=${htmlUrl}]Fanfic updates for ${start.format('MMM Do')} to ${end.format('MMM Do')}[/url]\n\n`)
      for (let type of qw`fic quest`) {
        if (!changes[type].new.length) continue
        ourStream.write(`[b][u]New ${ucfirst(type)}s[/u][/b]\n`)
        ourStream.write('[list]')
        changes[type].new.forEach(fic => printFic(ourStream, fic))
        ourStream.write('[/list]')
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].completed.length) continue
        ourStream.write(`[b][u]Completed ${ucfirst(type)}s[/u][/b]\n`)
        ourStream.write('[list]')
        changes[type].completed.forEach(fic => printFic(ourStream, fic))
        ourStream.write('[/list]')
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].oneshot.length) continue
        ourStream.write(`[b][u]One-shot ${ucfirst(type)}s[/u][/b]\n`)
        ourStream.write('[list]')
        changes[type].oneshot.forEach(fic => printFic(ourStream, fic))
        ourStream.write('[/list]')
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].revived.length) continue
        ourStream.write(`[b][u]Revived ${ucfirst(type)}s[/u][/b]\n`)
        ourStream.write(`[size=3][i](last update was ≥ 3 months ago)[/i][/size]\n`)
        ourStream.write('[list]')
        changes[type].revived.forEach(fic => printFic(ourStream, fic))
        ourStream.write('[/list]')
        ourStream.write(`\n\n`)
      }
      for (let type of qw`fic quest`) {
        if (!changes[type].updated.length) continue
        ourStream.write(`[b][u]Updated ${ucfirst(type)}s[/u][/b]\n`)
        ourStream.write('[list]')
        changes[type].updated.forEach(fic => printFic(ourStream, fic))
        ourStream.write('[/list]')
        ourStream.write(`\n\n`)
      }
      ourStream.write('[/spoiler]\n')
      ourStream.end()
    })
}

function printFic (ourStream, fic) {
  const link = fic.identifiers.replace(/^ur[li]:/,'')
  const authorurl = fic.authorurl || fic.meta.authorUrl
  const newChapters = fic.newChapters.length
  const firstUpdate = fic.newChapters[0] || fic.meta.chapters[fic.meta.chapters.length - 1]
  const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)

  ourStream.write(`[*] [url="${shortlink(link)}"]${fic.title}[/url]`)
  if (fic.oldChapters.length) {
    ourStream.write(` - [url="${shortlink(firstUpdate.link)}"]${firstUpdate.name}[/url]`)
  }
  ourStream.write(` by ${fic.authors}`)
  if (fic.status !== 'one-shot' && fic.status !== 'new') {
    ourStream.write(` added ${cstr(newChapters)}, ${approx(newWords)} words`)
  }
  ourStream.write(`\n`)
}
