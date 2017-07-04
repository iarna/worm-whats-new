'use strict'
module.exports = (ahref, ul, cul, li, ol, col, oli) => {
  return `Most active fics!
${ol()}
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/32119', 'Taylor Varga')} by ${ahref('https://forums.spacebattles.com/members/322925', 'mp3.1415player')} (246 chapters, 1.2m words), 428 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/532675', 'Reincarnation of an Angel')} by ${ahref('https://forums.spacebattles.com/members/320536', 'Crimson Square')} (39 chapters, 81k words), 234 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/517894', 'Ring-Maker')} by ${ahref('https://forums.spacebattles.com/members/330791', 'LithosMaitreya')} (45 chapters, 52k words), 232 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/521560', 'Formerly Known as Aquilla')} by ${ahref('https://forums.spacebattles.com/members/345592', 'Wafflethorpe')} (29 chapters, 71k words), 211 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/524197', 'Fools rush in where angels fear to tread')} by ${ahref('https://forums.spacebattles.com/members/318959', 'Sculptor')} (23 chapters, 60k words), 192 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/537310', 'Fear')} by ${ahref('https://forums.spacebattles.com/members/32789', 'Ryuugi')} (5 chapters, 10k words), 189 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/538282', 'A Parahuman in the Real World')} by ${ahref('https://forums.spacebattles.com/members/341275', 'BreezyWheeze')} (11 chapters, 17k words), 180 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/459689', 'Stacked Deck (Or, Colin Wallis vs. Single Parenting)')} by ${ahref('https://forums.spacebattles.com/members/311050', 'UnwelcomeStorm')} (10 chapters, 22k words), 161 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/523987', 'Worm Respun: A Peggy Sue Story')} by ${ahref('https://forums.spacebattles.com/members/316216', 'Aetheron')} (13 chapters, 25k words), 147 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/377626', 'Well Traveled')} by ${ahref('https://forums.spacebattles.com/members/313567', 'Argentorum')} (26 chapters, 56k words), 145 boops
${col()}

Notes and FAQ
${ul()}
${li()} "What's a boop?" It means the fic saw some amount of activity during one of my software's scan periods. Currently this is seven and half minutes. So one could say that the Taylor Varga thread was continuously active for one day, three hours and fifty-two minutes this week. Whew, that's a lot!
${li()} "But that one has too many boops! It couldn't have been that active!" Well, keep in mind, these numbers are aggregated across all of the sources I scan: SB, SV, QQ, AO3 and FFNET.
${li()} "But they have too few boops! I know it was more active than that!" Hah, well, mostly my software scans ever seven and half minutes. Except it's still running on my laptop, so not when I'm commuting or a handful of other occasions.
${li()} New to the fandom? "Quests" are little interactive games between the author and the readers where the readers vote on how the story progresses. While they're probably best enjoyed by participating they can often be solid stories unto themselves.
${li()} Relatedly, ${ahref(`https://www.reddit.com/r/makeyourchoice/`, `"CYOA"`)}s are little guides to setting, theme and character creation often used by folks writing SIs.
${li()} The total word counts and chapter counts NO LONGER (usually) include omake, so they should feel more accurate. They are included in the "added in this update" section.
${li()} Days in the range are inclusive, so ALL of each day. Start and end of days are in UTC. So if you're posting on Friday evenings in the US you'll be in the next week's listing.
${li()} I might have missed you, especially if your fic was new or returning from a long hiatus. I mean, I really hope not? But possibly! My methods aren't perfect. If I did, please let me know and I'll make sure you get picked up in the future!
${li()} I pick up oneshots from personal oneshot/snippet threads, but not from the global one. (No threadmarks!) So if you want your oneshots included, start up your own personal thread to archive them.
${cul()}

Technical blather
${ul()}
${li()} There's an ${ahref(`https://shared.by.re-becca.org/misc/worm/this-week.xml`, `RSS`)} feed, if you're inclined that way.
${li()} If you're technically inclined, you can find the source for the generator ${ahref(`https://github.com/iarna/worm-whats-new`, `over on github`)}. I'm afraid the source is kinda garbage though. You can also find the giiiagantic JSON file I use as source material.
${cul()}
`
}
