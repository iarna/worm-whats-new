'use strict'
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
               .replace(/[/]s[/](\d+)[/].*/, '/s/$1')
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
    const pre = chapterPrefix ? `${chapterPrefix} ` : ''
    if (chapters === 1) {
      return `${chapters} ${pre}chapter`
    } else {
      return `${chapters} ${pre}chapters`
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
      const linkre = new RegExp('(\\b|\\W)(' + escaped + ')((?:\\b|\\W)(?:[^<]*$|[^<]*<[^/]))')
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
   return start.isSameOrBefore(date) && end.isAfter(date)
  }
  exports.chapterDate = chapterDate
  function chapterDate (chap) {
    return moment(chap.modified || chap.created).utc()
  }
  function cmpDate (aa, bb) {
    return aa > bb ? 1 : aa < bb ? -1 : 0
  }
  exports.cmpChapter = cmpChapter
  function cmpChapter (aa, bb) {
    return cmpDate(chapterDate(aa), chapterDate(bb))
  }


  return exports
}
