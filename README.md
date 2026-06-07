# Mixcloud Mix Miner

Find long, continuous, no-talk DJ mixes like the artists you already love, using
Mixcloud's free public API. No login, no API key. It mines tags and the real peer
network (who your favorite DJs follow and favorite), screens out radio shows and
EDM, and ranks verified recommendations. Bundled with a bulk-unfavorite tool and a
45-minute filter for the Mixcloud web app.

Built for crate-diggers, open-format heads, and anyone tired of wading through radio
shows to find a proper continuous mix.

## What's inside

```
mixcloud-mix-miner/
  .claude-plugin/plugin.json          Claude Code / Cowork plugin manifest
  skills/mixcloud-mix-miner/SKILL.md  Skill instructions (auto-loads in Claude)
  scripts/mixcloud_miner.py           Standalone recommender (Python 3, stdlib only)
  assets/bulk_unfavorite.user.js      Tampermonkey userscript: wipe all favorites
  assets/length_filter_bookmarklet.js Bookmarklet: list a profile's 45m+ mixes
  README.md, LICENSE
```

## Quick start (recommender, no Claude required)

Requires Python 3 and an internet connection.

```bash
python scripts/mixcloud_miner.py \
  --seeds djlittlefever swedishshef cosmobaker \
  --min-minutes 45 \
  --prefer "mash ups,open format,party,funk,soul,disco,hip hop,throwback" \
  --avoid "dubstep,brostep,radio show,podcast,interview" \
  --out report.md
```

You get a Markdown report with:
- Ranked, verified artist recommendations (length floor, tag fit, overlap, sample mix).
- A tag cheat-sheet from your seeds, so you know exactly what to search next.

Seeds can be usernames or display names. Tune `--prefer` and `--avoid` to your taste.

## How it works

1. Resolve each seed to a real account.
2. Read every recent mix's `audio_length` and `tags`.
3. Aggregate the tags your seeds actually use.
4. Mine each seed's `following` and `favorites` to build the peer network; rank
   candidates by how many seeds overlap.
5. Verify each candidate: count mixes over the length floor, score tag fit, screen
   out the avoid-list.

The API cannot hear a mix, so "no talking" is inferred from tags and titles. Always
spot-check the first minute.

## Browser tools

Bulk Playlist Builder (recommended, fast): `assets/mixcloud_bulk_playlist.js`. Mixcloud has
no public write API and its on-page menu can't be scripted reliably, but its internal
GraphQL endpoint accepts your logged-in session. Create an empty playlist with your chosen
name, paste this console script (with a track list and/or an ARTISTS auto-pull block), and
it adds ~100 mixes in under a minute via the addPlaylistItem mutation. Playlists you build
show up on Sonos under the Mixcloud service. Adding is non-destructive.

Playlist Builder userscript (UI-driven, fallback): `assets/mixcloud_playlist_builder.user.js`
clicks the site UI to follow artists and build playlists. Slower and click-flaky; prefer the
bulk script above for adds, and use the userscript mainly for following.

Bulk unfavorite: install `assets/bulk_unfavorite.user.js` in Tampermonkey, open your
favorites page, click "Clear favorites." It removes the loaded batch, reloads to fetch
the next, and repeats until empty (Mixcloud's infinite scroll stalls once you strip the
loaded items, so the reload loop is required). A one-shot console version is in the file
header. Removing favorites is irreversible.

45-minute filter: see `assets/length_filter_bookmarklet.js`. Paste the one-liner as a
bookmark, open any profile, click it, and get only that artist's mixes at or above your
threshold, with likely radio/talk uploads flagged.

## Use it as a concierge

The whole idea: stop building queues track by track. Tell it a vibe or name a few DJs and
get long, continuous, no-talk mixes you can just press play on.

- "Play me sunny afro-funk re-edits, 90 minutes plus."
- "Something for a workout, 2000s pop-punk mashups."
- "More like DJ Matman and Paulo Futura."

Claude maps the request to seeds and tags, runs the miner, and hands back direct playable
links plus a tag map, then offers to build a Mixcloud playlist (which shows up on Sonos).

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

The script self-throttles between calls. Don't hammer the API. This project is not
affiliated with Mixcloud and only uses documented public read endpoints.

## License

MIT. See LICENSE.
