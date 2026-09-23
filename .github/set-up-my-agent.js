#!/usr/bin/env node
/*
 * set-up-my-agent — writes orders.json for you, from the club's own published language.
 *
 *   node .github/set-up-my-agent.js <job> <wallet> [yacht]
 *
 * It names no act of its own: the acts come from readyJobs in https://normiesyachtclub.com/api/v1/standing-orders.json,
 * which is the same list The Purser reads. A job that needs a key also needs the yacht whose account
 * authorises it. Nothing here holds a key, and this file never reads one.
 */
"use strict";
const fs = require("fs");
const DOC = process.env.NYC_ORDERS_DOC || "https://normiesyachtclub.com/api/v1/standing-orders.json";
const [job, wallet, yacht] = process.argv.slice(2);
// ⚠ It never calls process.exit: a fetch still in flight makes Node print an assertion of its own on
// top of the sentence the member needs to read. The message is thrown, said once, and the exit code set.
const die = (m) => { const e = new Error(m); e.said = true; throw e; };

(async () => {
  if (!/^0x[0-9a-fA-F]{40}$/.test(String(wallet || ""))) die("That wallet is not an address. It starts with 0x and has 40 more characters.");
  let doc;
  try {
    const r = await fetch(DOC);
    if (!r.ok) throw new Error("HTTP " + r.status);
    doc = await r.json();
  } catch (e) { die("Could not read the club's list of ready jobs (" + e.message + "). Nothing was written; try again."); }
  const jobs = Array.isArray(doc.readyJobs) ? doc.readyJobs : [];
  const j = jobs.find((x) => x.job === job);
  if (!j) die("The club does not publish a ready job called \"" + job + "\" today. It publishes: " + jobs.map((x) => x.job).join(", "));
  if (j.needsKey && !/^\d{1,7}$/.test(String(yacht || ""))) {
    die("\"" + j.title + "\" acts for one yacht, so it needs that yacht's number, and the key you granted on it.");
  }
  const orders = { version: 1, wallet: wallet };
  if (j.needsKey) orders.actingYacht = String(yacht);
  if (j.keepMePosted) orders.keepMePosted = true;
  orders.orders = (j.acts || []).map((act) => ({ act: act }));
  fs.writeFileSync("orders.json", JSON.stringify(orders, null, 2) + "\n");
  console.log("  Wrote orders.json for \"" + j.title + "\": " + (orders.orders.length || "no") + " act(s)" +
    (j.needsKey ? ", acting for yacht #" + yacht : ", and it cannot act") + ".");
})().catch((e) => {
  console.error("  " + (e && e.said ? e.message : "Nothing was written: " + ((e && e.message) || e)));
  process.exitCode = 1;
});
