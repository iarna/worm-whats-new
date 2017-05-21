# What Happened This Week in Worm Fanfic

This is the source for producing the external links in the [What Happened
This Week in Worm
Fanfic](https://forums.sufficientvelocity.com/threads/wormverse-ideas-recs-and-fic-discussion-thread-1.190/page-2760#post-8554383) that
I've been putting together.

## Helping update linking and substitutions

There are a bunch of files in `substitutions/` that are lists of names of
things and associated URLs.  Each file has descriptions of what sort of
thing they are.

Feel free to PR, and/or poke me on Cauldron and I'll add you to the repo.

## Building this yourself

To build this yourself it helps to be comfortable with a commandline.

To get started you'll need [Node.js](https://nodejs.org/en/).  Once you have
that you can run:

```console
$ git clone git://github.com/iarna/worm-whats-new
$ cd worm-whats-new
$ npm install
```

Once you've done that, you can build this week's list with:

```
$ npm run build
```

Or next week's list:

```
$ npm run build-next
```

These will produce files with dates as filenames, like `2017-05-21.html`.

I personally publish these by pushing them out to a webserver of mine using [Resilio Sync](https://www.resilio.com).

So there's one bit that's a liiiitle bit of a lie here.  The source data for
all of this is `Fanfic.json`.  That file, I produce behind the scenes.  It's
a combination of a CSV export from Calibre and metadata from my archive of
[fetch-fic](https://github.com/iarna/fetch-fic) sources.  I'll update it
occasionally, but at least twice a week (after 00:00UTC on Friday, and after
00:00UTC on Saturday).
