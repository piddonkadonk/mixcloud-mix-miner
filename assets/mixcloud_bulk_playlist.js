/*
 Mixcloud Bulk Playlist Builder (console script) — the FAST way
 =============================================================
 Mixcloud has no public write API and its on-page "Add to playlist" menu can't be
 scripted reliably. But the site's own internal GraphQL endpoint accepts your
 logged-in session cookie, so you can add dozens of mixes to a playlist in seconds.

 This script:
   1. Looks up your playlist by name (it must already exist — create an empty one
      once via the site if needed).
   2. Builds a track list two ways: an explicit list, and/or auto-pulled from
      artists (their longest mixes over a minute threshold, from the public API).
   3. Resolves each mix to its internal ID and adds it via the addPlaylistItem
      mutation. ~100 tracks in well under a minute.

 HOW TO USE:
   1. Log into mixcloud.com in your browser. Open any page on www.mixcloud.com.
   2. Open DevTools console (Option+Cmd+J on Mac). If warned, type: allow pasting
   3. Edit the CONFIG block below, paste the whole file, press Enter.
   4. Watch the console log. Refresh your playlist page when it says done.

 Notes: continuous DJ-mix discovery pairs well with scripts/mixcloud_miner.py,
 which can print an artist list for the ARTISTS block. Adding is not destructive
 (worst case a duplicate). Be polite; the script self-throttles.
*/

(async () => {
  // ====================== CONFIG ======================
  const PLAYLIST_NAME = "Re-Edit Mayhem"; // must already exist on your account

  // Explicit mixes to add: { username, slug } (slug is the last part of the URL)
  const TRACKS = [
    // { username: "djmatman", slug: "the-hotline-mix" },
  ];

  // Auto-pull the longest mixes from these artists (public API):
  const ARTISTS = [
    { username: "paulofutura", count: 12, minMinutes: 60 },
    { username: "djmatman", count: 10, minMinutes: 45 },
    { username: "SpecialEd", count: 10, minMinutes: 45 },
    { username: "obliveus", count: 9, minMinutes: 45 },
    { username: "lebrosk", count: 9, minMinutes: 45 },
    { username: "dj-gehoervoyeur", count: 9, minMinutes: 45 },
    { username: "francoponticelli", count: 8, minMinutes: 45 },
    { username: "djwonder", count: 7, minMinutes: 45 },
    { username: "MrLob", count: 8, minMinutes: 45 },
    { username: "djlittlefever", count: 8, minMinutes: 45 }
  ];

  // Screen these out by tag/title (keeps the no-talk, no-EDM rule):
  const AVOID = /dubstep|brostep|big room|hardstyle|\bedm\b|trap|glitch hop|k-?pop|chillout|easy listening|radio show|podcast|interview|wedding|tropical house/i;
  const MIN_DEFAULT = 45; // minutes floor for explicit TRACKS check is skipped
  // ====================================================

  const PUBLIC = "https://api.mixcloud.com";
  const GQL = "https://app.mixcloud.com/graphql";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const gql = async (query, variables) => {
    const r = await fetch(GQL, { method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables }) });
    return r.json();
  };

  // 1) find playlist id by name
  const meQ = `query { viewer { me { username playlists(first: 100) { edges { node { id name } } } } } }`;
  const me = await gql(meQ, {});
  const edges = me?.data?.viewer?.me?.playlists?.edges || [];
  const match = edges.find((e) => (e.node.name || "").toLowerCase() === PLAYLIST_NAME.toLowerCase());
  if (!match) {
    console.error('Playlist "' + PLAYLIST_NAME + '" not found. Create an empty playlist with that exact name first (one track via the site), then re-run.');
    console.log("Your playlists:", edges.map((e) => e.node.name));
    return;
  }
  const playlistId = match.node.id;
  console.log('Target playlist:', PLAYLIST_NAME);

  // 2) build target list
  const targets = [];
  for (const t of TRACKS) if (t.username && t.slug) targets.push({ u: t.username, slug: t.slug });
  for (const a of ARTISTS) {
    try {
      const cc = await fetch(PUBLIC + "/" + a.username + "/cloudcasts/?limit=60").then((r) => r.json());
      (cc.data || [])
        .map((c) => ({ u: a.username, slug: c.slug, mins: Math.round((c.audio_length || 0) / 60), t: c.name, tags: (c.tags || []).map((x) => x.name).join(" ") }))
        .filter((x) => x.slug && x.mins >= (a.minMinutes || MIN_DEFAULT) && !AVOID.test(x.t + " " + x.tags))
        .sort((x, y) => y.mins - x.mins)
        .slice(0, a.count || 8)
        .forEach((x) => targets.push({ u: x.u, slug: x.slug }));
    } catch (e) {}
    await sleep(100);
  }
  // dedupe
  const seen = new Set();
  const final = targets.filter((t) => { const k = t.u + "/" + t.slug; if (seen.has(k)) return false; seen.add(k); return true; });
  console.log("Adding " + final.length + " mixes...");

  // 3) resolve + add
  const slugQ = `query($username:String!,$slug:String!){ cloudcast: cloudcastLookup(lookup:{username:$username,slug:$slug}){ id } }`;
  const addM = `mutation($input: AddPlaylistItemMutationInput!, $cloudcastId: ID!){ addPlaylistItem(input:$input){ __typename } }`;
  let added = 0, failed = 0;
  for (const t of final) {
    try {
      const d = await gql(slugQ, { username: t.u, slug: t.slug });
      const id = d?.data?.cloudcast?.id;
      if (!id) { failed++; continue; }
      const m = await gql(addM, { cloudcastId: id, input: { cloudcastId: id, playlistId } });
      if (m.errors) failed++; else { added++; if (added % 10 === 0) console.log("...added " + added); }
    } catch (e) { failed++; }
    await sleep(120);
  }
  console.log("DONE. Added " + added + ", failed " + failed + ". Refresh your playlist page.");
})();
