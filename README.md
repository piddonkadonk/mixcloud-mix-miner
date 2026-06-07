# Mixcloud Mix Miner

Find long, funky, nonstop DJ mixes like the artists you already love, build them into
playlists in seconds, and stop thinking about what to play.

This is for the times you want to press play once and ride for hours: jamming with friends
when nobody wants to babysit a queue, locking into flow state for deep work, or just moving
around the house knocking out the dishes and laundry with a proper continuous mix in the air.
No track-by-track decisions, no host yelling over the music, no radio-show gaps.

It runs on Mixcloud's free public API (no login, no key). Tell it a vibe or name a few DJs,
and it finds real, verified, 45-minute-plus continuous mixes, reports the tags to search
next, and can bulk-build a Mixcloud playlist (which shows up on Sonos).

## It is not just re-edits

Re-edits are great, but this digs across the whole crate. A few of the lanes it pulls from:

- Funk, soul, boogie, rare groove, disco and nu-disco
- Hip hop (golden era to now), boom bap, turntablism, breaks
- Re-edits, reworks, bootlegs and genre-collision mashups
- Reggae, dub, dancehall, roots and lovers rock
- Afrobeat, afro house, Latin, samba and global grooves
- House, deep house, and the soulful / Balearic end of things
- Open-format party sets that touch all of the above in one go

And yes, electronic too. Not into cheesy, drop-chasing festival EDM (the cheese-dick stuff)?
Neither are we, so the defaults screen it out. But the same machine will happily surface
quality house, techno, electro, or even big-room EDM if that is what you want. It is all in
the `--prefer` / `--avoid` lists, so tune it to taste.

## 5 artists found through it

A quick taste of the range, all long-form and music-forward:

<table>
  <tr>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/paulofutura/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/7/3/f/6/7ca6-f08a-4d37-be11-840a6f228aa3" width="120"><br>Paulo Futura</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/djmatman/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/c/3/5/f/583e-0cbc-4813-b3f1-05ba47b60733.jpg" width="120"><br>DJ Matman</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/dj-gehoervoyeur/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/f/3/f/2/1a29-1148-4099-a3f3-dda89f806594.png" width="120"><br>Gehörvoyeur</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/theheatwave/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/8/f/8/2/9918-b43c-423a-8955-281d2243eaab" width="120"><br>The Heatwave</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/cosmobaker/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/e/d/b/4/ec87-376b-4de6-a333-34cba4f67c9b" width="120"><br>Cosmo Baker</a></td>
  </tr>
</table>

- [Paulo Futura](https://www.mixcloud.com/paulofutura/) - afro-funk, samba, soul and global grooves stitched into 3 to 9 hour marathons. Pure flow-state fuel.
- [DJ Matman](https://www.mixcloud.com/djmatman/) - re-edits and 90s R&B remixes, 7-inch funk and hip hop. Even posts "no chat" versions.
- [Gehörvoyeur](https://www.mixcloud.com/dj-gehoervoyeur/) - German "Bar Mucke" eclectic: afro and Latin house, funk, and techno edits that hang together.
- [The Heatwave](https://www.mixcloud.com/theheatwave/) - reggae, dancehall, bashment, soca and afrobeats. Windows-down, friends-over energy.
- [Cosmo Baker](https://www.mixcloud.com/cosmobaker/) - disco, funk, hip hop and 70s R&B from a true open-format party legend.

## Quick start (the recommender)

Requires Python 3 and an internet connection. No API key.

```bash
python scripts/mixcloud_miner.py \
  --seeds paulofutura djmatman theheatwave \
  --min-minutes 45 \
  --out report.md --emit-builder builder_config.js
```

You get a Markdown report with ranked, verified artist recommendations (length, tag fit,
how many of your seeds overlap, a sample mix), a tag cheat-sheet so you know what to search
next, and the contradictory-genre tag combos that tend to mark the good stuff. Seeds can be
usernames or display names. Tune `--prefer` and `--avoid` to your taste.

How it works: resolve seeds, read each mix's length and tags, aggregate the tags your seeds
use, mine each seed's favorites and following (the favorites are the strongest signal), rank
candidates by overlap, then verify each one and screen out the avoid-list. The API cannot
hear a mix, so "no talking" is inferred from tags and titles - spot-check the first minute.

## Build a big playlist in seconds (the fast way)

Mixcloud has no public write API and its on-page "Add to playlist" menu cannot be scripted
reliably. But its internal GraphQL endpoint accepts your logged-in session, so you can add
~100 mixes in under a minute. See `assets/mixcloud_bulk_playlist.js`: create an empty
playlist with your chosen name, paste the console script (with a track list and/or an
ARTISTS auto-pull block), and it resolves each mix and calls the `addPlaylistItem` mutation.
Playlists you build show up on Sonos under the Mixcloud service. Adding is non-destructive.

## Browser tools (assets/)

- `mixcloud_bulk_playlist.js` - the fast bulk playlist builder described above (recommended).
- `mixcloud_playlist_builder.user.js` - userscript that drives the UI to follow artists and
  build playlists; slower and click-flaky, best for the auto-follow part.
- `length_filter_bookmarklet.js` - on any profile, lists only that artist's mixes at or above
  a minute threshold, with links, and flags likely radio/talk uploads.
- `bulk_unfavorite.user.js` - clears all of your favorites (reload-resilient). Irreversible.
- `my-config.example.js` - a full real-world config (open-format / re-edit taste) you can
  drop into the builder.

## Use it as a concierge

Stop building queues. Tell it a vibe or name a few DJs and get long, nonstop, no-talk mixes:

- "Play me sunny afro-funk re-edits, 90 minutes plus."
- "Reggae and dancehall for a backyard hang."
- "Deep, hypnotic house for focus, two hours, no vocals."
- "Something for a workout, 2000s pop-punk mashups."
- "More like Paulo Futura and DJ Matman."

Claude maps the request to seeds and tags, runs the miner, and hands back direct playable
links plus a tag map, then offers to build a Mixcloud playlist.

## Install as a Claude plugin (marketplace)

This repo is also a plugin marketplace. In Claude Code or Cowork:

```
/plugin marketplace add piddonkadonk/mixcloud-mix-miner
/plugin install mixcloud-mix-miner@mix-machine
```

Or drop the folder into your plugins directly. The skill in `skills/mixcloud-mix-miner/`
auto-loads when you ask for Mixcloud recommendations, length filtering, playlist building,
or a favorites cleanup.

## API etiquette

The tools self-throttle. Don't hammer the API. This project is not affiliated with Mixcloud
and only uses documented public read endpoints (plus your own session for your own writes).

## License

MIT. See LICENSE.
