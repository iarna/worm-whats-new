'use strict'
module.exports = (ahref, ul, cul, li, ol, col, oli) => {
  return `Most active fics!
${ol()}
${oli()} ${ahref('https://forums.spacebattles.com/threads/ring-maker-worm-lord-of-the-rings-alt-power.517894/', 'Ring-Maker')} by ${ahref('https://forums.spacebattles.com/members/lithosmaitreya.330791/', 'LithosMaitreya')} (53 chapters, 57k words), 244 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/deputy-commander-worm-au-sequel.518383/', 'Deputy Commander')} by ${ahref('https://forums.spacebattles.com/members/reyemile.79899/', 'Reyemile')} (26 chapters, 88k words), 200 boops
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/taylor-varga-worm-luna-varga.32119/', 'Taylor Varga')} by ${ahref('https://forums.sufficientvelocity.com/members/mp3-1415player.14570/', 'mp3.1415player')} (257 chapters, 1.2m words), 182 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/well-traveled-worm-planeswalker-taylor.377626/', 'Well Traveled')} by ${ahref('https://forums.spacebattles.com/members/argentorum.313567/', 'Argentorum')} (33 chapters, 70k words), 171 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/541966', 'Oni's Endless Dance Party')} by ${ahref('https://forums.spacebattles.com/members/dingbat779.320828/', 'dingbat779')} (14 chapters, 23k words), 171 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/screw-the-rules-i-have-escalation-worm-yugioh.437215/', 'Screw the Rules, I have Escalation!')} by ${ahref('https://forums.spacebattles.com/members/stewart92.316597/', 'Stewart92')} (32 chapters, 84k words), 142 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/to-reign-in-heaven-quest-worm-30k.470213/', 'To Reign in Heaven')} by ${ahref('https://forums.spacebattles.com/members/cyrileom.317540/', 'cyrileom')} (163 chapters, 251k words), 133 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/nike-worm-altpower.448553/', 'Nike')} by ${ahref('https://forums.spacebattles.com/members/hopeful-penguin.310834/', 'Hopeful Penguin')} (57 chapters, 66k words), 126 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/reincarnation-of-an-angel-worm-quest.532675/', 'Reincarnation of an Angel')} by ${ahref('https://forums.spacebattles.com/members/crimson-square.320536/', 'Crimson Square')} (51 chapters, 147k words), 124 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/emissary-a-deputy-recursive-crossover-worm-au-canon.532150/', 'Emissary - A Deputy Recursive Crossover')} by ${ahref('https://forums.spacebattles.com/members/noelemahc.285845/', 'Noelemahc')} (31 chapters, 65k words), 123 boops
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
