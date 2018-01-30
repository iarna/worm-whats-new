'use strict'
const fs = require('fs')
const readFics = require('./read-fics.js')
const approx = require('approximate-number');
const moment = require('moment')

const { shortlink, chapterDate, updateSummary, tagify, linkSite } = require('./summary-lib.js')((label, href) => `[${label}](${href})`)

const ficLinks = {}

const search = new RegExp(process.argv.slice(2).join(' '), 'i')

readFics(`${__dirname}/Fanfic.json`)
  .filter(fic => fic.fandom === 'Worm' || fic.tags.some(t => t === 'xover:Worm' || t === 'fusion:Worm'))
//  .filter(fic => fic.status === 'complete')
  .filter(fic => search.test(fic.title) || fic.tags.some(t => search.test(t)))
//  .filter(fic => fic.tags.some(t => search.test(t)))
//  .filter(fic => fic.otn === 'Taylor, Lisa' || fic.otn === 'Lisa, Taylor')
//  .sort((a, b) => moment(a.updated).isAfter(b.updated) ? -1 : moment(a.updated).isBefore(b.updated) ? 1 : 0)
//  .sort((a, b) => b.words - a.words)
  .forEach(printFic).catch(console.error)

function printFic (fic) {
//  const idents = Array.isArray(fic.identifiers) ? fic.identifiers : fic.identifiers.split(',')
//  let link = idents.filter(i => /^ur[li]/.test(i)).map(_ => _.replace(/^ur[li]:/,''))[0]
//          || fic.links[0]
//  const authorurl = fic.authorurl
try {
  if (!fic.chapters) return console.log(fic)
  if (fic.tags.some(t => t === 'Snippets')) {
    fic.title = fic.title.replace(/^[^:]+: /i, '')
  }
  printLongFic(process.stdout, fic)
} catch (ex) {
  console.error(ex)
process.exit(1)
}
//  const tags = fic.tags.map(t => t.replace(/^freeform:/, ''))
//  console.log(`* [${fic.title}](${shortlink(link)}) by [${fic.author}](${shortlink(authorurl)}) (${cstr(fic.chapters.length)}, ${approx(fic.words)} words), last updated ${reldate(fic.modified)}: ${tags.join(', ')}`)
//  if (fic.comments) {
//    console.log(`  ${fic.comments}`)
//  }
}

function reldate (date) {
  if (!date) return ''
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

function printLongFic (ourStream, fic) {
  const chapters = fic.chapters.filter(ch => !ch.type || ch.type === 'chapter').length

  const author = fic.author
  ourStream.write('\n---\n\n')
  const series = fic.series || fic.tags.filter(t => /^follows:/.test(t)).map(t => t.slice(8))[0]
  const follows = (series && series !== fic.title) ? ` (follows ${tagify(series, ficLinks)})` : ''
  ourStream.write(`* **[${fic.title}](${shortlink(fic.links[0])})**${[follows]}`)
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
  const updated = chapterDate(fic.chapters[fic.chapters.length -1])
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
  if (fic.comments != '' && fic.comments != null) ourStream.write(`\n  * **Summary:**\n${fic.comments.trim().replace(/\n/g, '\n    ')}`)
  ourStream.write('\n')
}

function relativeDate (updated) {
  if (!updated) return ''
  updated = moment(updated)
  const updatedStr = updated.isSameOrAfter(moment().subtract(7, 'day'))
                   ? updated.format('ddd [at] h a [UTC]')
                   : updated.isSameOrAfter(moment().subtract(1, 'year'))
                   ? updated.format('Do MMM')
                   : updated.format('Do MMM, Y')
  return updatedStr
}
