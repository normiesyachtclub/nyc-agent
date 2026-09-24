#!/usr/bin/env node
/*
 * set-up-my-agent — writes your orders for you, from the club's own published language.
 *
 *   node .github/set-up-my-agent.js <job> <wallet> [yacht] [island] [discipline] [paid-in]
 *
 * It names no act of its own: the acts, and the choices each job asks you for, come from readyJobs in
 * https://normiesyachtclub.com/api/v1/standing-orders.json, the same list The Purser reads.
 *
 * ONE REPOSITORY IS ONE WALLET, AND IT CAN RUN A CREW:
 *   · a job for the whole wallet (Keep me posted, Daily watch) is written to orders.json;
 *   · a job one yacht does (Work at an island) is written to orders-<yacht>.json, one file per yacht,
 *     so setting up a second yacht ADDS it to the crew and never replaces the first.
 * Each yacht that acts needs the key granted on THAT yacht in The Purser. Nothing here holds a key,
 * and this file never reads one.
 */
"use strict";
const fs = require("fs");
const DOC = process.env.NYC_ORDERS_DOC || "https://normiesyachtclub.com/api/v1/standing-orders.json";
const [job, wallet, yacht, island, discipline, paidIn] = process.argv.slice(2).map((s) => String(s == null ? "" : s).trim());
// The boxes of the "Set up my agent" form, by the word the club's language uses for each.
const GIVEN = { yacht: yacht, venue: island, discipline: discipline, paidIn: paidIn };
const BOX = { yacht: "yacht", venue: "island", discipline: "discipline", paidIn: "paid in" };
// A file this repository's agent runs: orders.json, or orders-<yacht>.json. Never its notes
// (orders.ledger.json, orders-8.posted.json and the rest), which sit beside them.
const ORDERS_FILE = /^orders(-\d{1,7})?\.json$/;
// ⚠ It never calls process.exit: a fetch still in flight makes Node print an assertion of its own on
// top of the sentence the member needs to read. The message is thrown, said once, and the exit code set.
const die = (m) => { const e = new Error(m); e.said = true; throw e; };

(async () => {
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) die("That wallet is not an address. It starts with 0x and has 40 more characters.");

  // ☠ One repository, one wallet. An orders file names one wallet, and a crew is one wallet's yachts.
  const crew = fs.readdirSync(".").filter((f) => ORDERS_FILE.test(f)).sort();
  for (const f of crew) {
    let w = "";
    try { w = String(JSON.parse(fs.readFileSync(f, "utf8")).wallet || ""); } catch (e) { w = ""; }
    if (w && w.toLowerCase() !== wallet.toLowerCase()) {
      die("This repository already works for " + w + " (in " + f + "). One repository is one wallet: " +
        "for " + wallet + ", make another repository from the template. Nothing was written.");
    }
  }

  let doc;
  try {
    const r = await fetch(DOC);
    if (!r.ok) throw new Error("HTTP " + r.status);
    doc = await r.json();
  } catch (e) { die("Could not read the club's list of ready jobs (" + e.message + "). Nothing was written; try again."); }
  const jobs = Array.isArray(doc.readyJobs) ? doc.readyJobs : [];
  const j = jobs.find((x) => x.job === job);
  if (!j) die("The club does not publish a ready job called \"" + job + "\" today. It publishes: " + jobs.map((x) => x.job).join(", ") + ". Nothing was written.");

  // The choices this job asks for, read from the club. ☠ A missing one is refused, never filled in:
  // only what the club marks "may leave empty" may be left empty.
  const asks = (Array.isArray(j.asks) ? j.asks : []).slice();
  if (j.needsKey && asks.indexOf("yacht") < 0) asks.unshift("yacht");
  const mayLeave = Array.isArray(j.mayLeaveEmpty) ? j.mayLeaveEmpty : [];
  for (const w of asks) {
    if (!BOX[w]) die("\"" + j.title + "\" asks for \"" + w + "\", and this template has no box for it yet. Nothing was written: take the newer template, or set it up in The Purser.");
    if (!GIVEN[w] && mayLeave.indexOf(w) < 0) {
      die(w === "yacht"
        ? "\"" + j.title + "\" acts for one yacht, so it needs that yacht's number, and the key you granted on it. Nothing was written."
        : "\"" + j.title + "\" needs the " + BOX[w] + " box filled in. Nothing is chosen for you, and nothing was written.");
    }
  }
  if (asks.indexOf("yacht") >= 0 && !/^\d{1,7}$/.test(GIVEN.yacht)) die("That yacht is not a number. Nothing was written.");

  const published = Array.isArray(doc.acts) ? doc.acts : [];
  const orders = { version: 1, wallet: wallet };
  if (j.needsKey) orders.actingYacht = GIVEN.yacht;
  if (j.keepMePosted) orders.keepMePosted = true;
  orders.orders = (j.acts || []).map((act) => {
    const A = published.find((x) => x.act === act);
    if (!A) die("The club's job \"" + j.title + "\" names \"" + act + "\", which its own list of acts does not carry. Nothing was written.");
    const o = { act: act };
    (A.needs || []).concat(A.optional || []).forEach((w) => { if (asks.indexOf(w) >= 0 && GIVEN[w]) o[w] = GIVEN[w]; });
    // What the JOB itself fixes on an act, as the club publishes it (e.g. the Crew Mess voice): never a member's choice.
    if (j.set && j.set[act] && typeof j.set[act] === "object") Object.assign(o, j.set[act]);
    return o;
  });
  const ignored = Object.keys(GIVEN).filter((w) => w !== "yacht" && GIVEN[w] && asks.indexOf(w) < 0);

  // A job that itself asks WHICH yacht does its work belongs to that yacht: its own file, so a crew grows.
  // A job that only needs a key (Daily watch) is the wallet's, and a yacht is named just to authorise it.
  const file = (j.asks || []).indexOf("yacht") >= 0 ? "orders-" + GIVEN.yacht + ".json" : "orders.json";
  const had = fs.existsSync(file);
  fs.writeFileSync(file, JSON.stringify(orders, null, 2) + "\n");
  // The workflow reads back and keeps exactly this file, and no other.
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, "file=" + file + "\n");
  console.log("  " + (had ? "Replaced " : "Wrote ") + file + " for \"" + j.title + "\": " + (orders.orders.length || "no") + " act(s)" +
    (j.needsKey ? ", acting for yacht #" + GIVEN.yacht : ", and it cannot act") + ".");
  if (ignored.length) console.log("  (" + ignored.map((w) => BOX[w]).join(", ") + ": not asked by this job, so left out.)");
  const now = fs.readdirSync(".").filter((f) => ORDERS_FILE.test(f)).sort();
  if (now.length > 1) console.log("  Your crew in this repository: " + now.join(", ") + ". Each one runs every hour.");
})().catch((e) => {
  console.error("  " + (e && e.said ? e.message : "Nothing was written: " + ((e && e.message) || e)));
  process.exitCode = 1;
});
