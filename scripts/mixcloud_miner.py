#!/usr/bin/env python3
"""
Mixcloud Mix Miner
==================
Find long, continuous, no-talk DJ mixes similar to artists you already like,
using Mixcloud's free public data API (no login, no API key).

What it does:
  1. Resolves seed artists to real Mixcloud accounts.
  2. Reads every recent mix's length and tags.
  3. Aggregates a "tag cheat-sheet" so you know what to search for.
  4. Mines who your seeds follow AND whose mixes they favorite (their real
     peer network), ranks candidates by how many of your seeds overlap.
  5. Verifies each candidate: counts mixes >= your minimum length, checks tag
     fit, and screens OUT radio shows / podcasts / interviews and EDM-leaning
     accounts.
  6. Writes a clean Markdown report.

Usage:
  python mixcloud_miner.py --seeds theallergies kraftykuts djvadim \
      --min-minutes 45 --out report.md

  # taste tuning:
  python mixcloud_miner.py --seeds djlittlefever swedishshef \
      --prefer "mash ups,open format,party,funk,soul,disco" \
      --avoid "dubstep,brostep,radio show,podcast,interview" \
      --out open_format.md

Only standard library. Works anywhere with internet.
"""
import argparse, json, sys, time, urllib.parse, urllib.request
from collections import defaultdict

API = "https://api.mixcloud.com"
UA = {"User-Agent": "mixcloud-mix-miner/1.0 (+https://github.com/)"}

DEFAULT_PREFER = ["re-edit", "re edit", "rework", "edits", "bootleg", "mash up",
                  "mashup", "remix", "open format", "party", "dj edits",
                  "live dj blends", "funk", "soul", "disco", "hip hop",
                  "breaks", "reggae", "dub", "afro", "latin", "house",
                  "throwback", "workout"]
DEFAULT_AVOID = ["dubstep", "brostep", "big room", "hardstyle", "edm",
                 "trap", "glitch hop", "k-pop", "chillout", "easy listening",
                 "radio show", "podcast", "interview", "wedding"]


def api_get(path, params=None, sleep=0.12):
    url = API + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
        time.sleep(sleep)
        return data
    except Exception:
        time.sleep(sleep)
        return None


def resolve(seed):
    """Return a username for a seed given as username or display name."""
    slug = seed.strip().lstrip("@")
    # try as a direct username first
    d = api_get("/" + urllib.parse.quote(slug) + "/")
    if d and d.get("username"):
        return d["username"], d.get("name", slug)
    # fall back to search
    d = api_get("/search/", {"type": "user", "limit": 3, "q": seed})
    if d and d.get("data"):
        u = d["data"][0]
        return u["username"], u.get("name", u["username"])
    return None, None


def cloudcasts(user, limit=40):
    d = api_get("/%s/cloudcasts/" % urllib.parse.quote(user), {"limit": limit})
    out = []
    if d and d.get("data"):
        for c in d["data"]:
            out.append({
                "name": c.get("name", ""),
                "mins": round((c.get("audio_length") or 0) / 60),
                "tags": [t["name"] for t in c.get("tags", [])],
                "url": c.get("url", ""),
            })
    return out


def listing(user, kind, limit=80):
    """kind = 'following' or 'favorites'."""
    d = api_get("/%s/%s/" % (urllib.parse.quote(user), kind), {"limit": limit})
    users = []
    if d and d.get("data"):
        for item in d["data"]:
            if kind == "favorites":
                u = item.get("user") or {}
                if u.get("username"):
                    users.append((u["username"], u.get("name", u["username"])))
            else:
                if item.get("username"):
                    users.append((item["username"], item.get("name", item["username"])))
    return users


def score_tags(tags, prefer, avoid):
    t = " ".join(tags).lower()
    pref = sum(1 for p in prefer if p in t)
    av = sum(1 for a in avoid if a in t)
    return pref, av


def main():
    ap = argparse.ArgumentParser(description="Mine Mixcloud for long no-talk mixes like your favorites.")
    ap.add_argument("--seeds", nargs="+", required=True, help="Mixcloud usernames or display names you like.")
    ap.add_argument("--min-minutes", type=int, default=45, help="Minimum mix length to count (default 45).")
    ap.add_argument("--prefer", default=",".join(DEFAULT_PREFER), help="Comma list of preferred tag keywords.")
    ap.add_argument("--avoid", default=",".join(DEFAULT_AVOID), help="Comma list of tag keywords to screen out.")
    ap.add_argument("--max-candidates", type=int, default=30, help="How many peer candidates to verify.")
    ap.add_argument("--out", default="mixcloud_report.md", help="Output Markdown path.")
    ap.add_argument("--emit-builder", default=None, metavar="PATH",
                    help="Also write a CONFIG snippet (FOLLOWS + ARTIST_PLAYLISTS) for the playlist-builder userscript.")
    args = ap.parse_args()

    prefer = [s.strip().lower() for s in args.prefer.split(",") if s.strip()]
    avoid = [s.strip().lower() for s in args.avoid.split(",") if s.strip()]
    minm = args.min_minutes

    print("Resolving %d seeds..." % len(args.seeds), file=sys.stderr)
    seeds = {}
    for s in args.seeds:
        u, name = resolve(s)
        if u:
            seeds[u] = name
            print("  %s -> %s" % (s, u), file=sys.stderr)
        else:
            print("  %s -> NOT FOUND" % s, file=sys.stderr)
    if not seeds:
        print("No seeds resolved. Exiting.", file=sys.stderr)
        sys.exit(1)

    seed_lc = {u.lower() for u in seeds}
    tag_count = defaultdict(int)
    peer = defaultdict(int)
    combo_count = defaultdict(int)  # contradictory-genre tag combos

    import re as _re
    BUCKETS = {
        "reggae/dub": _re.compile(r'reggae|dub\b|dancehall|ragga|ska', _re.I),
        "afro/latin/global": _re.compile(r'afro|latin|ethio|exotic|world|tropical|cumbia|brazil|orient|balkan', _re.I),
        "electro/house/techno": _re.compile(r'electro|house|techno|acid|disco|italo|cosmic|nu-?disco', _re.I),
        "hiphop/breaks": _re.compile(r'hip ?hop|hip-hop|\brap\b|boom ?bap|breaks|turntab', _re.I),
        "rock/pop/indie": _re.compile(r'\brock\b|indie|\bpop\b|punk|new wave|wave\b', _re.I),
        "soul/funk/jazz": _re.compile(r'soul|funk|jazz|boogie|rare groove|motown|stax', _re.I),
    }

    def mix_buckets(tags, title=""):
        s = " ".join(tags) + " " + title
        return [k for k, rgx in BUCKETS.items() if rgx.search(s)]

    print("Reading seed mixes + networks...", file=sys.stderr)
    for u in seeds:
        for m in cloudcasts(u, 40):
            if m["mins"] >= minm:
                for t in m["tags"]:
                    tag_count[t] += 1
                b = mix_buckets(m["tags"], m["name"])
                if len(b) >= 2:
                    combo_count[" + ".join(sorted(b))] += 1
        # the favorites method first (your favorite DJs' favorites are gold),
        # then who they follow.
        for cu, _ in listing(u, "favorites", 60) + listing(u, "following", 80):
            if cu.lower() not in seed_lc:
                peer[cu] += 1

    candidates = sorted([(u, c) for u, c in peer.items() if c >= 2],
                        key=lambda x: -x[1])[:args.max_candidates]

    print("Verifying %d candidates..." % len(candidates), file=sys.stderr)
    recs = []
    for u, overlap in candidates:
        mixes = cloudcasts(u, 15)
        if not mixes:
            continue
        longm = [m for m in mixes if m["mins"] >= minm]
        if not longm:
            continue
        bag = []
        for m in mixes:
            bag += m["tags"]
        pref, av = score_tags(bag, prefer, avoid)
        avg = round(sum(m["mins"] for m in longm) / len(longm))
        recs.append({
            "user": u, "overlap": overlap, "long": len(longm), "avg": avg,
            "pref": pref, "avoid": av,
            "tags": sorted(set(bag), key=lambda t: -bag.count(t))[:6],
            "sample": longm[0]["name"] if longm else "",
        })

    # rank: screened-out last; then reward fit, overlap and long-mix count
    recs.sort(key=lambda r: (r["avoid"] > 0, -(r["pref"] * 2 + r["overlap"] + min(r["long"], 10))))

    top_tags = sorted(tag_count.items(), key=lambda x: -x[1])[:40]

    lines = []
    lines.append("# Mixcloud Mix Miner report")
    lines.append("")
    lines.append("Seeds: " + ", ".join("%s (%s)" % (n, u) for u, n in seeds.items()))
    lines.append("")
    lines.append("Minimum length: %d minutes. Preferred tags: %s. Screened out: %s."
                 % (minm, ", ".join(prefer), ", ".join(avoid)))
    lines.append("")
    lines.append("## Recommended artists (verified, ranked)")
    lines.append("")
    for r in recs:
        flag = "  [screen: contains avoided tags]" if r["avoid"] else ""
        lines.append("- **%s** - https://www.mixcloud.com/%s/ - %d long mixes, avg %d min, fit %d, shared by %d of your seeds. Tags: %s.%s"
                     % (r["user"], r["user"], r["long"], r["avg"], r["pref"], r["overlap"], ", ".join(r["tags"]), flag))
        if r["sample"]:
            lines.append("  - e.g. %s" % r["sample"])
    lines.append("")
    lines.append("## Tag cheat-sheet (from your seeds' long mixes)")
    lines.append("")
    for t, c in top_tags:
        lines.append("- %s (%d)" % (t, c))
    lines.append("")
    lines.append("Search any tag at https://www.mixcloud.com/discover/<tag>/ (lowercase, hyphenated).")
    lines.append("Length filter trick: open https://api.mixcloud.com/<username>/cloudcasts/ and read audio_length in seconds (2700 = 45 min).")
    lines.append("")
    lines.append("## Contradictory-genre tag combos (your sweet spot)")
    lines.append("")
    lines.append("Mixes that span opposite genres at once. The weirder the pairing, the more likely it's your thing. Search these combinations:")
    for c, n in sorted(combo_count.items(), key=lambda x: -x[1])[:12]:
        lines.append("- %s (%d mixes)" % (c, n))

    with open(args.out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("Wrote %s (%d recommendations)." % (args.out, len(recs)), file=sys.stderr)

    if args.emit_builder:
        raw_follows = list(seeds.keys()) + [r["user"] for r in recs if not r["avoid"]]
        seen = set()
        follows = []
        for x in raw_follows:
            if x.lower() not in seen:
                seen.add(x.lower())
                follows.append(x)
        artist_pls = [{"name": "%s - Best Of" % seeds[u], "user": u, "count": 8, "minMinutes": minm}
                      for u in seeds]
        snippet = (
            "// Paste these into mixcloud_playlist_builder.user.js CONFIG\n"
            "const FOLLOWS = " + json.dumps(follows, indent=2) + ";\n\n"
            "const ARTIST_PLAYLISTS = " + json.dumps(artist_pls, indent=2) + ";\n"
        )
        with open(args.emit_builder, "w", encoding="utf-8") as f:
            f.write(snippet)
        print("Wrote builder config to %s" % args.emit_builder, file=sys.stderr)


if __name__ == "__main__":
    main()
