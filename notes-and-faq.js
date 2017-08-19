'use strict'
module.exports = (ahref, ul, cul, li, ol, col, oli) => {
  return `
Notes and FAQ
${ul()}
${li()} New to the fandom? "Quests" are little interactive games between the author and the readers where the readers vote on how the story progresses. While they're probably best enjoyed by participating they can often be solid stories unto themselves.
${li()} Relatedly, ${ahref(`https://www.reddit.com/r/makeyourchoice/`, `"CYOA"`)}s are little guides to setting, theme and character creation often used by folks writing SIs.
${li()} Days in the range are inclusive, so ALL of each day. Start and end of days are in UTC. So if you're posting on Friday evenings in the US you'll be in the next week's listing.
${li()} I pick up oneshots from personal oneshot/snippet threads, but not from the global one. (No threadmarks!) So if you want your oneshots included, start up your own personal thread to archive them.
${cul()}

Technical blather
${ul()}
${li()} There's an ${ahref(`https://shared.by.re-becca.org/misc/worm/this-week.xml`, `RSS`)} feed, if you're inclined that way.
${li()} If you're technically inclined, you can find the source for the generator ${ahref(`https://github.com/iarna/worm-whats-new`, `over on github`)}. I'm afraid the source is kinda garbage though. You can also find the giiiagantic JSON file I use as source material.
${cul()}
`
}
