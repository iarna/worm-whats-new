'use strict'
module.exports = (ahref, ul, cul, li, ol, col, oli) => {
  return `Shoutouts!
${ul()}
${li()} To ${ahref('https://forums.sufficientvelocity.com/posts/8725714', 'Swords and Supes')} for having the biggest revival. It's last update was in 2015!
${li()} To ${ahref('https://forums.spacebattles.com/members/324250', 'Harbin')} for having the most entries this week (five)!
${cul()}

Most active fics!
${ol()}
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/taylor-varga-worm-luna-varga.32119/', 'Taylor Varga')} (223 boops)
${oli()} ${ahref('https://forums.spacebattles.com/threads/completely-unoriginal-there-are-no-bad-premises-only-bad-executions.526825/', 'Completely Unoriginal :: There Are No Bad Premises, Only Bad Executions')} (210 boops)
${oli()} ${ahref('https://forums.spacebattles.com/threads/reincarnation-of-an-angel-worm-quest.532675/', 'Reincarnation of an Angel')} (185 boops)
${oli()} ${ahref('https://forums.spacebattles.com/threads/worm-wh40k-formerly-known-as-aquilla.521560/', 'Formerly Known as Aquilla')} (179 boops)
${oli()} ${ahref('https://forums.spacebattles.com/threads/ring-maker-worm-lord-of-the-rings-alt-power.517894/', 'Ring-Maker')} (175 boops)
${oli()} ${ahref('https://forums.spacebattles.com/threads/worm-respun-a-peggy-sue-story.523987/', 'Worm Respun: A Peggy Sue Story')} (165 boops)
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/all-things-devoured-worm-deadspace.35750/', 'All Things Devoured')} (141 boops)
${oli()} ${ahref('https://forums.sufficientvelocity.com/threads/an-essence-of-silver-and-steel-worm-fate-stay-night.39043/', 'An Essence of Silver and Steel')} (130 boops)
${oli()} ${ahref('https://forums.spacebattles.com/threads/deputy-commander-worm-au-sequel.518383/', 'Deputy Commander')} (130 boops)
${oli()} ${ahref('https://forums.spacebattles.com/threads/constellations-worm-okami.414320/', 'Constellations')} (125 boops)
${col()}

Notes and FAQ
${ul()}
${li()} What's a boop? It means the fic saw some amount of activity during one of my software's scan periods. Currently this is seven and half minutes. So one could say that the Taylor Varga thread was continuously active for one day, three hours and fifty-two minutes this week. Whew, that's a lot!
${li()} New to the fandom? "Quests" are little interactive games between the author and the readers where the readers vote on how the story progresses. While they're probably best enjoyed by participating they can often be solid stories unto themselves.
${li()} Relatedly, ${ahref(`https://www.reddit.com/r/makeyourchoice/`, `"CYOA"`)}s are little guides to setting, theme and character creation often used by folks writing SIs.
${li()} The word counts and chapter counts often (usually) include omake, so keep that in mind.
${li()} Days in the range are inclusive, so ALL of each day. Start and end of days are in UTC. So if you're posting on Friday evenings in the US you'll be in the next week's listing.
${li()} I might have missed you, especially if your fic was new or returning from a long hiatus. I mean, I really hope not? But possibly! My methods aren't perfect. If I did, please let me know and I'll make sure you get picked up in the future!
${li()} I pick up oneshots from personal oneshot/snippet threads, but not from the global one. (No threadmarks!) So if you want your oneshots included, start up your own personal thread to archive them.
${li()} I do an early draft of this over on the ${ahref(`https://www.reddit.com/r/Cauldron`, `Cauldron Discord`)} on Thursday evenings or Friday mornings (PDT). If you want to help out, joining and providing feedback then would be awesome!
${cul()}

Technical blather
${ul()}
${li()} Starting this week I've been using mostly automatic software to scan for new and updated fics. In previous weeks I watched updates by eye and ran them by hand. This week I had the machine do it.
${li()} There's an ${ahref(`https://shared.by.re-becca.org/misc/worm/this-week.xml`, `RSS`)} feed, if you're inclined that way.
${li()} If you're technically inclined, you can find the source for the generator ${ahref(`https://github.com/iarna/worm-whats-new`, `over on github`)}. I'm afraid the source is kinda garbage though. You can also find the giiiagantic JSON file I use as source material.
${cul()}
`
}
