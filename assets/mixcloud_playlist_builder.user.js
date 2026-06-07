// ==UserScript==
// @name         Mixcloud Playlist Builder + Auto-Follow
// @namespace    https://github.com/piddonkadonk/mixcloud-mix-miner
// @version      1.0.0
// @description  Follow a list of artists and build named playlists from a list of mix URLs, automatically, in your own browser. Reload-resilient.
// @match        https://www.mixcloud.com/*
// @grant        none
// ==/UserScript==
//
// WHY THIS EXISTS: Mixcloud has no open write API, and its React UI only reacts
// to real clicks in the page. A userscript runs in that context, so it can drive
// "Follow" and "Add to playlist" reliably where injected automation cannot.
//
// HOW TO USE:
//   1. Install Tampermonkey, add this script.
//   2. Edit the CONFIG block below (it's pre-filled with your curated lists).
//   3. Go to mixcloud.com (logged in). A panel appears bottom-right.
//   4. Click "Test (first 2)" to dry-run a tiny batch and confirm follows +
//      playlist adds work. If good, click "Run all". Click "Stop" anytime.
//   5. It navigates itself through every artist and mix, so let it drive. Your
//      new playlists appear under your profile and on Sonos (Mixcloud service).
//
// SAFE: it never deletes anything. Following and adding are the only writes.

(function () {
  "use strict";

  // ====================== CONFIG ======================
  // Replace these neutral starters with your own. A full working example (open-format /
  // re-edit taste) ships alongside this file as `my-config.example.js`, and the
  // mixcloud_miner.py `--emit-builder` flag generates FOLLOWS + ARTIST_PLAYLISTS for you.

  // Artists to follow (Mixcloud usernames):
  const FOLLOWS = [
    "TheAllergies", "Mr_Scruff"
  ];

  // Static playlists: name -> array of mix URLs.
  const PLAYLISTS = {
    "My First Playlist": [
      "https://www.mixcloud.com/TheAllergies/hang-loose-june-26/"
    ]
  };

  // Per-artist "Best Of" playlists. The script fetches each artist's mixes from the
  // public API at run time and uses their longest `count` mixes >= minMinutes. Always fresh.
  const ARTIST_PLAYLISTS = [
    { name: "The Allergies - Best Of", user: "TheAllergies", count: 8, minMinutes: 45 }
  ];
  // ==================================================

  const KEY = "mcm_builder_state";
  const API = "https://api.mixcloud.com";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (u) => decodeURIComponent(u).replace(/\/+$/, "/").toLowerCase();

  async function artistTopUrls(user, count, minMinutes) {
    try {
      const d = await fetch(API + "/" + user + "/cloudcasts/?limit=50").then((r) => r.json());
      return (d.data || [])
        .map((c) => ({ url: c.url, m: Math.round((c.audio_length || 0) / 60) }))
        .filter((x) => x.m >= minMinutes)
        .sort((a, b) => b.m - a.m)
        .slice(0, count)
        .map((x) => x.url);
    } catch (e) { return []; }
  }

  async function buildQueue(limit) {
    const q = [];
    FOLLOWS.forEach((u) => q.push({ kind: "follow", user: u }));
    Object.keys(PLAYLISTS).forEach((name) => {
      PLAYLISTS[name].forEach((url, i) => q.push({ kind: "add", playlist: name, url, first: i === 0 }));
    });
    for (const ap of ARTIST_PLAYLISTS) {
      const urls = await artistTopUrls(ap.user, ap.count, ap.minMinutes);
      urls.forEach((url, i) => q.push({ kind: "add", playlist: ap.name, url, first: i === 0 }));
      await sleep(150);
    }
    return typeof limit === "number" ? q.slice(0, limit) : q;
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function reset() { localStorage.removeItem(KEY); }

  function fire(el) {
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.focus && el.focus();
    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((t) =>
      el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window })));
    if (el.click) try { el.click(); } catch (e) {}
  }
  const leaf = (re) => [...document.querySelectorAll('span,div,button,[role="menuitem"],li')]
    .find((e) => e.childElementCount === 0 && re.test((e.innerText || "").trim()));

  async function doFollow() {
    await sleep(1400);
    const already = [...document.querySelectorAll("button,[role=button]")]
      .some((e) => (e.innerText || "").trim() === "Following");
    if (already) return "already";
    const btn = [...document.querySelectorAll("button,[role=button]")]
      .find((e) => (e.innerText || "").trim() === "Follow");
    if (!btn) return "no-button";
    fire(btn.closest("button") || btn);
    await sleep(1200);
    return "followed";
  }

  async function doAdd(playlist, first) {
    await sleep(1600);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await sleep(300);
    const addBtn = [...document.querySelectorAll("button,[role=button]")]
      .find((e) => ((e.getAttribute("aria-label") || "") === "Add To") || ((e.innerText || "").trim() === "Add to"));
    if (!addBtn) return "no-addbtn";
    fire(addBtn); await sleep(800);
    const atp = leaf(/^add to playlist$/i);
    if (!atp) return "no-atp";
    fire(atp.closest('button,[role="menuitem"],a,li') || atp); await sleep(900);
    if (first) {
      const cnp = leaf(/^create new playlist$/i);
      if (!cnp) return "no-create";
      fire(cnp.closest('button,[role="menuitem"],a,li') || cnp); await sleep(700);
      const inp = [...document.querySelectorAll("input")].find((i) => /name your playlist/i.test(i.placeholder || ""));
      if (!inp) return "no-input";
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(inp, playlist);
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(400);
      const cbtn = [...document.querySelectorAll("button")].find((b) => (b.innerText || "").trim().toLowerCase() === "create");
      if (!cbtn) return "no-createbtn";
      fire(cbtn); await sleep(1500);
      return "created";
    } else {
      const search = document.querySelector('input[name="mixcloud_query"]');
      if (search) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(search, playlist);
        search.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(700);
      }
      const row = [...document.querySelectorAll('span,div,button,[role="menuitem"],li')]
        .find((e) => e.childElementCount === 0 && (e.innerText || "").trim() === playlist);
      if (!row) return "no-row";
      fire(row.closest('button,[role="menuitem"],a,li') || row); await sleep(1400);
      return "added";
    }
  }

  function requiredURL(step) {
    return step.kind === "follow"
      ? "https://www.mixcloud.com/" + step.user + "/"
      : step.url;
  }

  async function tick() {
    const s = load();
    if (!s || !s.running) { paint(); return; }
    if (s.i >= s.queue.length) { s.running = false; save(s); paint(); alert("Mixcloud Builder: done. " + s.queue.length + " steps."); return; }
    const step = s.queue[s.i];
    const want = norm(requiredURL(step));
    if (norm(location.href) !== want) { location.href = requiredURL(step); return; }
    let res;
    try { res = step.kind === "follow" ? await doFollow() : await doAdd(step.playlist, step.first); }
    catch (e) { res = "error:" + e; }
    s.log = (s.log || []).slice(-20);
    s.log.push(step.kind + " " + (step.user || step.playlist) + " -> " + res);
    s.i++;
    save(s);
    paint();
    await sleep(800);
    if (s.i < s.queue.length) location.href = requiredURL(s.queue[s.i]);
    else { const f = load(); f.running = false; save(f); paint(); alert("Mixcloud Builder: done."); }
  }

  async function start(limit) {
    reset();
    const bar = document.getElementById("mcm-bar"); if (bar) bar.innerHTML = "<b>Mixcloud Builder</b><br>building queue (fetching artist mixes)...";
    const queue = await buildQueue(limit);
    save({ running: true, i: 0, queue, log: [] });
    tick();
  }
  function stop() { const s = load() || {}; s.running = false; save(s); paint(); }

  function paint() {
    let bar = document.getElementById("mcm-bar");
    if (!bar) {
      bar = document.createElement("div"); bar.id = "mcm-bar";
      bar.style.cssText = "position:fixed;z-index:99999;bottom:16px;right:16px;width:230px;background:#111;color:#fff;font:12px/1.35 system-ui,sans-serif;padding:10px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.45)";
      document.body.appendChild(bar);
    }
    const s = load(); const running = s && s.running;
    const prog = s ? (s.i + "/" + s.queue.length) : "idle";
    bar.innerHTML = "<b>Mixcloud Builder</b> &nbsp;" + (running ? "running " + prog : prog) +
      "<div style='max-height:70px;overflow:auto;color:#9ca3af;margin:6px 0'>" +
      ((s && s.log) ? s.log.slice(-4).join("<br>") : "") + "</div>";
    const mk = (label, fn, color) => { const b = document.createElement("button"); b.textContent = label;
      b.style.cssText = "cursor:pointer;border:0;border-radius:7px;padding:5px 8px;margin-right:6px;font-weight:600;background:" + color + ";color:#111"; b.onclick = fn; return b; };
    if (running) { bar.appendChild(mk("Stop", stop, "#ef4444")); }
    else { bar.appendChild(mk("Test (first 2)", () => start(2), "#fbbf24")); bar.appendChild(mk("Run all", () => start(), "#f97316")); }
  }

  function boot() { paint(); const s = load(); if (s && s.running) setTimeout(tick, 1500); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
