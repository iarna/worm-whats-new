'use strict'
const approx = require('approximate-number');
const moment = require('moment')

module.exports = function (makeLink) {
  const exports = {}
  exports.shortlink = shortlink
  function shortlink (link) {
    return link.replace(/[/]threads[/].*#post-(\d+)/, '/posts/$1')
               .replace(/[/]threads[/](?:[^.]+[.])?(\d+)/, '/threads/$1')
               .replace(/[/]members[/](?:[^.]+[.])?(\d+)[/]?/, '/members/$1')
               .replace(/[/]works[/](\d+)[/]chapters[/]\d+[/]?$/, '/works/$1')
               .replace(/[/]$/, '')
               .replace(/forum.question/, 'question')
               .replace(/[/]fanfiction[.]net/, '/www.fiction.net')
               .replace(/[/]s[/](\d+)([/]\d+)?(?:[/].*)?$/, '/s/$1$2')
  }
  exports.ucfirst = ucfirst
  function ucfirst (str) {
    return str.slice(0,1).toUpperCase() + str.slice(1)
  }
  exports.things = things
  function things (num, thing) {
    if (num === 1) {
      return thing
    } else {
      return thing + 's'
    }
  }
  exports.cstr = cstr
  function cstr (chapters, chapterPrefix) {
    return numof(chapters, 'chapter', 'chapters', chapterPrefix)
  }
  exports.numof = numof
  function numof (things, kind, kinds, prefix) {
    const pre = things && prefix ? `${prefix} ` : ''
    if (things === 1) {
      return `${things} ${pre}${kind}`
    } else {
      return `${things} ${pre}${kinds}`
    }
  }
  exports.strify = strify
  function strify (things, links) {
    return linkUp(things, links).join(', ')
  }
  exports.tagify = tagify
  function tagify (thing, links) {
    for (let link of Object.keys(links).sort((a, b) => b.length - a.length)) {
      const escaped = link.replace(/[^\w\s]/g, '.')
      const linkre = new RegExp('(\\b|\\W)(' + escaped + ')((?:\\b|\\W)(?:[^<]*$|[^<]*<[^/]))', 'g')
      thing = thing.replace(linkre,
        (str, m1, m2, m3) => m1 + makeLink(m2, shortlink(links[link])) + m3)
    }
    return thing
  }
  function linkUp (things, links) {
    return things.map(thing => tagify(thing, links))
  }
  exports.inRange = inRange
  function inRange (date, start, end) {
   if (date === null) return false
   return start.isSameOrBefore(date) && end.isAfter(date)
  }
  exports.chapterDate = chapterDate
  function chapterDate (chap) {
    if (!chap.modified && !chap.created) return null
    return moment(chap.modified || chap.created).utc()
  }
  function cmpDate (aa, bb) {
    return aa > bb ? 1 : aa < bb ? -1 : 0
  }
  exports.cmpChapter = cmpChapter
  function cmpChapter (aa, bb) {
    return cmpDate(chapterDate(aa), chapterDate(bb))
  }

  exports.linkSite = linkSite
  function linkSite (link) {
    let cat = 'link'
    if (/spacebattles/.test(link)) {
      cat = 'SB'
    } else if (/sufficientvelocity/.test(link)) {
      cat = 'SV'
    } else if (/questionablequesting/.test(link)) {
      cat = 'QQ'
    } else if (/archiveofourown/.test(link)) {
      cat = 'AO3'
    } else if (/fanfiction.net/.test(link)) {
      cat = 'FF'
    }
    return cat
  }
  exports.updateSummary = updateSummary
  function updateSummary (fic) {
    const newWords = fic.newChapters.map(c => c.words).reduce((a, b) => a + b, 0)
    const prefix = fic.status !== 'one-shot' ? 'new' : ''
    const ctypes = {}
    fic.newChapters.forEach(ch => {
      let type = (ch.type || 'chapter').toLowerCase()
      let plural
      switch (type) {
        case 'sidestory':
          plural = 'sidestories'
          break
        case 'extras':
          plural = type
          type = 'extra'
          break
        case 'media':
        case 'informational':
          type = type + ' post'
          plural = type + 's'
          break
        case 'apocrypha':
          plural = type
          break
        case 'staff post':
        case 'chapter':
          plural = type + 's'
          break
        default:
          plural = type + '(s)'
      }
      if (!ctypes[type]) ctypes[type] = {type, plural, chapters: 0}
      ++ctypes[type].chapters
    })
    let summary = []
    let first = true
    Object.values(ctypes).forEach(c => {
      summary.push(numof(c.chapters, c.type, c.plural, first && prefix))
      first = false
    })
    let sumstr = ''
    const last = summary.pop()
    if (summary.length == 0) {
      sumstr = last
    } else {
      sumstr = summary.join(', ') + ' and ' + last
    }

    return `${sumstr}, ${approx(newWords)} words`
  }
  return exports
}
