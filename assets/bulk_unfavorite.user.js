// ==UserScript==
// @name         Mixcloud Bulk Unfavorite
// @namespace    https://github.com/piddonkadonk/mixcloud-mix-miner
// @version      1.0.0
// @description  Remove ALL of your Mixcloud favorites automatically. Survives the page reloads Mixcloud forces when the list empties.
// @match        https://www.mixcloud.com/*/favorites/
// @grant        none
// ==/UserScript==
//
// HOW TO USE (automatic, recommended):
//   1. Install Tampermonkey (or any userscript manager) in your browser.
//   2. Add this script.
//   3. Go to https://www.mixcloud.com/<piddonkadonk>/favorites/
//   4. Click the floating "Clear favorites" button. It removes the loaded batch,
//      reloads to fetch the next batch, and repeats until empty. Click "Stop" anytime.
//
// WHY A RELOAD LOOP: Mixcloud removes each card asynchronously and its infinite
// scroll loses its anchor once you strip the loaded items, so it stops fetching more.
// Reloading pulls a fresh batch. The userscript persists progress in localStorage so
// it keeps going across those reloads.
//
// ONE-SHOT CONSOLE VERSION (no userscript manager): paste this in DevTools, then
// re-run it after each reload:
//   (()=>{const s='button[aria-label="Remove Favorite"]';const b=[...document.querySelectorAll(s)];
//   b.forEach(x=>{try{x.click()}catch(e){}});console.log('clicked',b.length);
//   if(b.length)setTimeout(()=>location.reload(),2500);else console.log('done');})();

(function () {
  "use strict";
  const SEL = 'button[aria-label="Remove Favorite"]';
  const RUN_KEY = "mc_bulk_unfav_running";
  const CNT_KEY = "mc_bulk_unfav_count";

  function clearBatchThenReload() {
    const btns = Array.from(document.querySelectorAll(SEL));
    btns.forEach((b) => { try { b.click(); } catch (e) {} });
    const total = (parseInt(localStorage.getItem(CNT_KEY) || "0", 10) || 0) + btns.length;
    localStorage.setItem(CNT_KEY, String(total));
    if (btns.length > 0) {
      setTimeout(() => location.reload(), 2500); // let async removals + API deletes land
    } else {
      finish(total);
    }
  }

  function finish(total) {
    localStorage.removeItem(RUN_KEY);
    localStorage.removeItem(CNT_KEY);
    alert("Mixcloud Bulk Unfavorite: done. Removed about " + total + " favorites.");
    paintButton();
  }

  function start() {
    localStorage.setItem(RUN_KEY, "1");
    if (!localStorage.getItem(CNT_KEY)) localStorage.setItem(CNT_KEY, "0");
    clearBatchThenReload();
  }

  function stop() {
    localStorage.removeItem(RUN_KEY);
    paintButton();
  }

  function paintButton() {
    let bar = document.getElementById("mc-bulk-unfav-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "mc-bulk-unfav-bar";
      bar.style.cssText =
        "position:fixed;z-index:99999;bottom:18px;right:18px;background:#111;color:#fff;" +
        "font:14px/1.3 system-ui,sans-serif;padding:10px 12px;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.4)";
      document.body.appendChild(bar);
    }
    const running = localStorage.getItem(RUN_KEY) === "1";
    const cnt = localStorage.getItem(CNT_KEY) || "0";
    bar.innerHTML =
      '<div style="margin-bottom:6px">Bulk Unfavorite' + (running ? " (running, ~" + cnt + ")" : "") + "</div>";
    const btn = document.createElement("button");
    btn.textContent = running ? "Stop" : "Clear favorites";
    btn.style.cssText =
      "cursor:pointer;border:0;border-radius:8px;padding:6px 10px;font-weight:600;" +
      (running ? "background:#b91c1c;color:#fff" : "background:#f97316;color:#111");
    btn.onclick = running ? stop : start;
    bar.appendChild(btn);
  }

  function boot() {
    paintButton();
    if (localStorage.getItem(RUN_KEY) === "1") {
      setTimeout(clearBatchThenReload, 1500); // continue after a forced reload
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
