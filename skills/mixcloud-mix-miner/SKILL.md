---
name: mixcloud-mix-miner
description: A continuous-mix concierge for Mixcloud. Use when someone wants long, nonstop, no-talk DJ mixes - either by describing a vibe ("play me sunny afro-funk re-edits", "something for a workout", "deep house for focus") or by naming artists they like ("more like DJ X"). Finds and verifies real mixes via Mixcloud's public API, returns direct playable links, reports a tag map, and can build Mixcloud playlists (which appear on Sonos). Also handles "filter Mixcloud by length", "screen out radio shows", and "bulk-remove my favorites".
---

# Mixcloud Mix Miner - the continuous-mix concierge

The point: kill decision fatigue. Instead of building a queue track by track like on
Spotify, the user says a vibe or names a few DJs, and you hand back long, continuous,
human-mixed sets they can press play on and ride for hours. No talking, no radio shows.

## Two ways in
1. By vibe - "I want X." Translate the request into: genres, energy (is it a workout?),
   era, a length floor (default 45 min), and the no-talk default. Map the vibe to 2-4 seed
   artists and/or tags, then run the engine below.
2. By artists - "more like A, B, C." Use those directly as seeds.

## The engine
Run the bundled analyzer (Python 3, internet, no API key):

```bash
python scripts/mixcloud_miner.py --seeds <artists or display names> \
  --min-minutes 45 \
  --prefer "re-edit,rework,edits,mashup,open format,party,funk,soul,disco,hip hop,reggae,afro,house,workout" \
  --avoid  "dubstep,trap,glitch hop,k-pop,chillout,easy listening,radio show,podcast,interview,wedding" \
  --out report.md --emit-builder builder_config.js
```

It resolves seeds, reads each mix's length and tags, aggregates a tag cheat-sheet, mines
each seed's FAVORITES first then their following (the favorites are the strongest signal),
ranks candidates by overlap, verifies each (length floor, tag fit, avoid-screen), and
reports the top contradictory-genre tag combos. `--emit-builder` writes a paste-ready
config for the playlist builder.

## What to hand back (output contract)
- A ranked list of DIRECT, playable mix links (https://www.mixcloud.com/<user>/<slug>/),
  each with length and a one-line why. These are the deliverable - the user can play them
  anywhere, including Sonos via the Mixcloud service.
- A short tag cheat-sheet and the contradictory-genre combos to search next.
- An offer to build a Mixcloud playlist from the picks (see builder below).

## Taste signals to score
- Re-edits, reworks, bootlegs, mashups are positives, not noise.
- Contradictory-genre tags on one mix (reggae + electro + re-edit; hip hop + rock + pop)
  are a strong "good" signal. The miner surfaces these.
- Workout mashup mixes are often wins - don't auto-screen them.
- Screen OUT by default: wedding / live-with-host sets, radio shows, podcasts, interviews,
  trap, dubstep, glitch hop, K-pop, chillout, easy listening.
- The API can't hear a mix, so "no talk" is inferred from tags/titles. Spot-check minute one.

## Artist pre-screening (run before featuring or recommending any artist)

Before showcasing or recommending any artist, run all four checks. If an artist is on the
trusted whitelist below, skip to the whitelist rule - no other checks needed.

### 1. Tag screening
Pull the artist's recent uploads via `GET /{user}/cloudcasts/?limit=20` and scan the
`tags[]` array on each mix. Flag the artist as a likely show host if more than 2 of their
last 10 uploads carry any of these tags:

  radio show, podcast, interview, radio, talk

Flagged artists need a web research check before featuring.

### 2. Title pattern matching
Scan the `name` field on recent uploads. Flag if any of these patterns appear in a title:

  show, episode, radio, podcast, interview, with guest, ft., this week

Two or more flagged titles across recent uploads means the artist needs closer review.
A single flagged title is a yellow flag - continue to step 3 and web research before deciding.

### 3. Description scan
Check the description / subtitle field on recent uploads. Flag any of these phrases:

  this week, joining me, my guest, coming up

A flagged description combined with a flagged title is enough to hold off featuring the
artist until web research confirms their format.

### 4. Web research step
Before adding any new artist to a showcase or recommendation list, run a web search for
`"{artist name}" mixcloud` or `"{artist name}" DJ mix`. Check whether results describe them
as a mix series, a radio show, or a podcast. If the top results call it a show or podcast
with guests, treat the artist as a show host, not a mix DJ, and do not feature them.

Do NOT rely on upload pattern analysis or duration outlier checks - those signals are too
unreliable on Mixcloud to use as screening criteria.

### Trusted whitelist
The following artists have been manually verified as music-forward, no-chat DJs. They skip
all four checks above:

- swedishshef
- djlittlefever
- MrLob
- djmaars
- TomShowtime

Add to the whitelist only after personal verification by the user. Never auto-populate
it from engine recommendations.

### User input required - mandatory rule
Never auto-select or auto-feature artists as showcase examples without asking the user
first. The skill may surface candidates and describe what it found, but the user decides
who gets featured. Always ask before committing any artist to a showcase list, README,
or recommendation output.

## Building playlists (the fast way)
Mixcloud has no public write API and its on-page "Add to playlist" menu can't be scripted
reliably. BUT the site's internal GraphQL endpoint (`https://app.mixcloud.com/graphql`)
accepts the logged-in session cookie, so you can bulk-add ~100 mixes in under a minute:
- `assets/mixcloud_bulk_playlist.js` - paste-in console script. Set a playlist name (must
  already exist) and either an explicit `{username, slug}` list or an `ARTISTS` block that
  auto-pulls each artist's longest 45m+ mixes. It resolves each via `cloudcastLookup` then
  calls the `addPlaylistItem` mutation. This is the recommended builder.
- Mechanics if doing it programmatically: lookup id with
  `query{ cloudcastLookup(lookup:{username,slug}){ id } }`, then
  `mutation($input:AddPlaylistItemMutationInput!){ addPlaylistItem(input:$input) }` with
  `input:{ cloudcastId, playlistId }`. Find playlistId via `viewer.me.playlists`.

## Browser tools (assets/)
- `mixcloud_playlist_builder.user.js` - userscript that clicks the UI to follow artists and
  build playlists. Slower and click-flaky; use `mixcloud_bulk_playlist.js` above for adds.
- `length_filter_bookmarklet.js` - on any profile, lists only that artist's mixes >= a
  minute threshold, with links.
- `bulk_unfavorite.user.js` - clears all favorites (reload-resilient). Irreversible.

## Manual API building blocks
Profile `GET /{user}/`; mixes `GET /{user}/cloudcasts/?limit=40` (read `audio_length`
seconds, `tags[]`); peers `GET /{user}/favorites/` and `/{user}/following/`; search
`GET /search/?type=user|cloudcast&q=...`. Tag pages: mixcloud.com/discover/<tag>/.

## Etiquette
Self-throttle. Public read endpoints only. Confirm before any write (follow / playlist /
unfavorite). Don't link impostor accounts - if an artist has no real Mixcloud, say so.
