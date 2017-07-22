'use strict'
module.exports = (ahref, ul, cul, li, ol, col, oli) => {
  return `
One more week or two with the old most-active list.  I'm not sure if I'll be
able to do this next week as I'll be out-of-town for a wedding (we arrive on
Friday sooo). If I do a update, it'll likely be a bit later than usual.

New section: Iarna's rec of the… every so often?  Week?  Maybe?  Whenever I manage to catch
one of the new or updated worm fics myself anyway…
${ul()}
${li()} ${ahref('https://forums.sufficientvelocity.com/threads/39611', 'Wolf Spider')} by ${ahref('https://forums.sufficientvelocity.com/members/5133', 'The Laurent')} (9 chapters, 43k words), last updated Jul 16th, (tags: dogs, spiders).  Wolf Spider is The Laurent's latest fic where canon-power Taylor runs into Rachel early on and befriends her before doing much else as a cape.  Very much focused on character interactions over action, though that can and does drive the drama.  TBH, I was basically sold at "The Laurent" as I like pretty much everything they've written.  But Taylor/Rachel or Taylor & Rachel is unusual and touching.  It's excellent, do check it out.
${cul()}

Most active fics!
${ol()}
${oli()} ${ahref('https://forums.spacebattles.com/threads/ring-maker-worm-lord-of-the-rings-alt-power.517894/', 'Ring-Maker')} by ${ahref('https://forums.spacebattles.com/members/lithosmaitreya.330791/', 'LithosMaitreya')} (62 chapters, 67k words), 288 boops
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/magical-girl-escalation-taylor-worm-nanoha.28074/', 'Magical Girl Escalation Taylor')} by ${ahref('https://forums.sufficientvelocity.com/members/silently-watches.7954/', 'Silently Watches')} (89 chapters, 177k words), 257 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/well-traveled-worm-planeswalker-taylor.377626/', 'Well Traveled')} by ${ahref('https://forums.spacebattles.com/members/argentorum.313567/', 'Argentorum')} (35 chapters, 75k words), 256 boops
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/taylor-varga-worm-luna-varga.32119/', 'Taylor Varga')} by ${ahref('https://forums.sufficientvelocity.com/members/mp3-1415player.14570/', 'mp3.1415player')} (260 chapters, 1.2m words), 208 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/screw-the-rules-i-have-escalation-worm-yugioh.437215/', 'Screw the Rules, I have Escalation!')} by ${ahref('https://forums.spacebattles.com/members/stewart92.316597/', 'Stewart92')} (35 chapters, 93k words), 206 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/crouching-tiger-goes-to-prison-worm-au-of-an-au.480139/', 'Crouching Tiger Goes to Prison')} by ${ahref('https://forums.spacebattles.com/members/somewhat-disinterested.320877/', 'Somewhat Disinterested')} (55 chapters, 80k words), 198 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/526825/', 'Completely Unoriginal')} by ${ahref('https://forums.spacebattles.com/members/themanwhowas.315311/', 'themanwhowas')} (88 chapters, 101k words), 198 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/541966', "Oni's Endless Dance Party")} by ${ahref('https://forums.spacebattles.com/members/dingbat779.320828/', 'dingbat779')} (21 chapters, 35k words), 198 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/537310', 'Fear')} by ${ahref('https://forums.spacebattles.com/members/ryuugi.32789/', 'Ryuugi')} (9 chapters, 21k words), 167 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/to-reign-in-heaven-quest-worm-30k.470213/', 'To Reign in Heaven')} by ${ahref('https://forums.spacebattles.com/members/cyrileom.317540/', 'cyrileom')} (176 chapters, 283k words), 135 boops
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
