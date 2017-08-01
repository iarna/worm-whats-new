'use strict'
module.exports = (ahref, ul, cul, li, ol, col, oli) => {
  return `
One more week or two with the old most-active list.  (This week's numbers are slightly low across the board due to a travel related blip Friday morning.  But *waves* hi from lovely Port Townsend, WA, where I'll be for the next… um, day.)

This week's shout out is ${ahref('https://forums.spacebattles.com/posts/37392131', "Audacity; Damsel's Quest of Distress")} by ${ahref('https://forums.spacebattles.com/members/349360', 'frustratedFreeboota')} who patiently waited through me missing updates to their quest on the first pass three weeks running. So check out this Quest centered on everyone's favorite least effective villianess.

Most active fics!
${ol()}
${oli()} ${ahref('https://forums.spacebattles.com/threads/526825/', 'Completely Unoriginal')} by ${ahref('https://forums.spacebattles.com/members/themanwhowas.315311/', 'themanwhowas')} (103 chapters, 113k words), 268 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/ring-maker-worm-lord-of-the-rings-alt-power.517894/', 'Ring-Maker')} by ${ahref('https://forums.spacebattles.com/members/lithosmaitreya.330791/', 'LithosMaitreya')} (65 chapters, 73k words), 262 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/stacked-deck-or-colin-wallis-vs-single-parenting-worm-persona.459689/', 'Stacked Deck (Or, Colin Wallis vs. Single Parenting)')} by ${ahref('https://forums.spacebattles.com/members/unwelcomestorm.311050/', 'UnwelcomeStorm')} (15 chapters, 35k words), 245 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/the-mage-in-the-bay-worm-dc-oc.547835/', 'The Mage in the Bay  OC')} by ${ahref('https://forums.spacebattles.com/members/stewart92.316597/', 'Stewart92')} (11 chapters, 23k words), 242 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/537310', 'Fear')} by ${ahref('https://forums.spacebattles.com/members/ryuugi.32789/', 'Ryuugi')} (23 chapters, 27k words), 206 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/alchemical-solutions-worm-exalted-story-only-thread.283060/', 'Alchemical Solutions')} by ${ahref('https://forums.spacebattles.com/members/gromweld.294183/', 'Gromweld')} (303 chapters, 675k words), 186 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/queen-of-blood-worm-castlevania.363842/', 'Queen of Blood')} by ${ahref('https://forums.spacebattles.com/members/sirwill.8092/', 'SirWill')} (104 chapters, 324k words), 184 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/537487', 'Average Joe: New Game Plus')} by ${ahref('https://forums.spacebattles.com/members/horizonthetransient.318806/', 'HorizonTheTransient')} (20 chapters, 28k words), 146 boops
${oli()} ${ahref('https://forums.spacebattles.com/threads/emissary-a-deputy-recursive-crossover-worm-au-canon.532150/', 'Emissary - A Deputy Recursive Crossover')} by ${ahref('https://forums.spacebattles.com/members/noelemahc.285845/', 'Noelemahc')} (36 chapters, 81k words), 142 boops
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/taylor-varga-worm-luna-varga.32119/', 'Taylor Varga')} by ${ahref('https://forums.sufficientvelocity.com/members/mp3-1415player.14570/', 'mp3.1415player')} (263 chapters, 1.2m words), 141 boops
${col()}

Notes and FAQ
${ul()}
${li()} "What's a boop?" It means the fic saw some amount of activity during one of my software's scan periods. Currently this is seven and half minutes.
${li()} "But that one has too many boops! It couldn't have been that active!" Well, keep in mind, these numbers are aggregated across all of the sources I scan: SB, SV, QQ, AO3 and FFNET.
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
