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
    <td align="center" width="20%"><a href="https://www.mixcloud.com/swedishshef/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/9/a/b/e/2272-e465-4c42-aaac-7c7d5664e722" width="120"><br>Swedishshef</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/djlittlefever/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/3/7/a/2/a181-d68a-4155-b297-ed960fadc6fb" width="120"><br>DJ Little Fever</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/MrLob/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/4/6/1/0/2ab9-8036-4bb8-9c98-7b5dc41df029" width="120"><br>Dj Mr Lob</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/djmaars/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/e/7/2/0/901f-48db-4eef-8a96-8853040550cf" width="120"><br>DJ MAARS</a></td>
    <td align="center" width="20%"><a href="https://www.mixcloud.com/TomShowtime/"><img src="https://thumbnailer.mixcloud.com/unsafe/300x300/profile/f/3/d/1/a15a-431e-4438-9333-80786b9546b3.jpg" width="120"><br>Tom Showtime</a></td>
  </tr>
</table>

- [Swedishshef](https://www.mixcloud.com/swedishshef/) - hip hop, soul, afro/deep/funky house, DnB, jungle and reggae all in one session. Long runs, no filler.
- [DJ Little Fever](https://www.mixcloud.com/djlittlefever/) - Ottawa vet, 16 years deep, chart hits to classic throwbacks. Red Bull Thre3style alum.
- [Dj Mr Lob](https://www.mixcloud.com/MrLob/) - 25 years in Melbourne: funk, soul, jazz, hip hop, reggae, afrobeat, Latin, house. Vinyl-focused, ranked #5 worldwide in funk-soul-jazz 2017.
- [DJ MAARS](https://www.mixcloud.com/djmaars/) - reggae, bass, jungle, hip hop, dub and mashups. Boomtown festival regular, co-founder of Easy Now Recordings.
- [Tom Showtime](https://www.mixcloud.com/TomShowtime/) - 45-format obsessive, be-bop to breakbeat, afrobeat and tropical funk-soul-jazz mashups. Easy Now Recordings co-founder with DJ MAARS.

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
