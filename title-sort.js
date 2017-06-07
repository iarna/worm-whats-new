'use strict'
module.exports = titleSort

function titleSort (xform) {
  return (a, b) => removeLeadingStopwords(xform(a)).localeCompare(removeLeadingStopwords(xform(b)))
}

function removeLeadingStopwords(str) {
  str = str.trim()
  let original = str
  let re = /^(The\s|A\s|An\s|[^a-zA-Z\d])/i
  while (str.match(re)) {
    str = str.replace(re, "")
  }

  return str.length > 0 ? str : original
}
