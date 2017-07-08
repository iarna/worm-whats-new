'use strict'
module.exports = (ahref, ul, cul, li, ol, col, oli) => {
  return `Most active fics!
${ol()}
${oli()} ${ahref('https://forums.spacebattles.com/threads/ring-maker-worm-lord-of-the-rings-alt-power.517894/', 'Ring-Maker')} by ${ahref('https://forums.spacebattles.com/members/lithosmaitreya.330791/', 'LithosMaitreya')} (53 chapters, 57k words), 441 boops
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/taylor-varga-worm-luna-varga.32119/', 'Taylor Varga')} by ${ahref('https://forums.sufficientvelocity.com/members/mp3-1415player.14570/', 'mp3.1415player')} (251 chapters, 1.2m words), 337 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/emissary-a-deputy-recursive-crossover-worm-au-canon.532150/', 'Emissary - A Deputy Recursive Crossover')} by ${ahref('https://forums.spacebattles.com/members/noelemahc.285845/', 'Noelemahc')} (25 chapters, 54k words), 303 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/well-traveled-worm-planeswalker-taylor.377626/', 'Well Traveled')} by ${ahref('https://forums.spacebattles.com/members/argentorum.313567/', 'Argentorum')} (29 chapters, 64k words), 286 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/537310', 'Fear')} by ${ahref('https://forums.spacebattles.com/members/ryuugi.32789/', 'Ryuugi')} (7 chapters, 14k words), 223 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/constellations-worm-okami.414320/', 'Constellations')} by ${ahref('https://forums.spacebattles.com/members/unwelcomestorm.311050/', 'UnwelcomeStorm')} (46 chapters, 141k words), 180 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/540244', 'Auf Wiedersehen')} by ${ahref('https://forums.spacebattles.com/members/nocton.349894/', 'Nocton')} (22 chapters, 19k words), 175 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/reincarnation-of-an-angel-worm-quest.532675/', 'Reincarnation of an Angel')} by ${ahref('https://forums.spacebattles.com/members/crimson-square.320536/', 'Crimson Square')} (43 chapters, 97k words), 154 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/526825/', 'Completely Unoriginal')} by ${ahref('https://forums.spacebattles.com/members/themanwhowas.315311/', 'themanwhowas')} (73 chapters, 87k words), 148 boops
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/magical-girl-escalation-taylor-worm-nanoha.28074/', 'Magical Girl Escalation Taylor')} by ${ahref('https://forums.sufficientvelocity.com/members/silently-watches.7954/', 'Silently Watches')} (85 chapters, 173k words), 144 boops
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
