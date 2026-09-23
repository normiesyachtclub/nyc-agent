# Your Normies Yacht Club agent

This repository runs **your** agent once a day on GitHub's machines, so it works while your computer
is off. It is your repository and your key. **The club never sees either, and runs none of this.**

## Set it up, in two steps

1. **Actions** tab, **Set up my agent**, **Run workflow**. Pick the job, type your wallet, and for a
   job that acts, the number of the yacht whose account authorises your key. It writes your orders
   for you.
2. **Only if your job acts** (Daily watch, Work at an island): **Settings**, **Secrets and variables**, **Actions**,
   **New repository secret**, named `NYC_AGENT_KEY`, holding the key The Purser gave you.

That is all. It runs every day by itself. When there is news it opens an issue here and GitHub
emails you.

## The jobs

- **Keep me posted** reads the club for your wallet and tells you what is open to you: your own
  islands first, every island on the map, today's free draw, your watch, a Tide round, a prize with
  your name on it, a berth, and posted work. No key, no gas, and it cannot act.
- **Daily watch** enters today's free draw and keeps your watch in the Regatta, every day, and tells
  you if either one did not go through. Both acts are free. It needs one key, granted on one yacht in
  The Purser.
- **Work at an island**, once the club opens it, takes a part of work posted at the island you
  choose, in your discipline, hands it in and records the competence your yacht earned. You give it
  the yacht, the island, the discipline and, if you like, the currency: nothing is chosen for you.
  If the club has not opened it yet, Set up my agent says so and writes nothing.

## A crew: several yachts, one repository

One repository is **one wallet**. The draw and the watch are once a day for the whole wallet, so
Daily watch needs one yacht only, in `orders.json`. Work at an island is done by **each yacht**, so
each working yacht has its own file, `orders-<yacht>.json`.

- To add a yacht: run **Set up my agent** again with that yacht. It joins the crew; the others stay.
- Grant the same key on that yacht too, in The Purser. One secret, `NYC_AGENT_KEY`, serves the crew.
- Every file runs every day, and all the news arrives as **one** issue.
- To take a yacht out: delete its `orders-<yacht>.json` here, and revoke the key on it in The Purser.

## What to know about the key

- A granted key can act for that yacht's account, and nothing else you own. Revoke it in The Purser
  at any time, and before you sell the yacht.
- The secret is the only place it goes. Never commit it, and never paste it into a chat, an issue or
  a form.
- Keep this repository **private**: your orders name your wallet, and GitHub switches scheduled runs
  off in a public repository after 60 days with no activity.

## What is in here

- `agent.js` is the club's own tool, one file, public domain. It is the same file published at
  https://normiesyachtclub.com/agent/agent.js.
- `.github/workflows/nyc-agent.yml` runs it every day. `.github/workflows/set-up-my-agent.yml` writes
  your orders. `.github/set-up-my-agent.js` is what that one runs.
- Nothing updates itself. When the club publishes a newer `agent.js`, your agent opens an issue here
  and leaves the decision to you.
- `.github/workflows/club-sync.yml` is for the club's own template only. In your copy it never runs.

## Reading it yourself

`node agent.js orders.json` shows what it would do and sends nothing. Add `--send` to let it act.
The language it reads is published at https://normiesyachtclub.com/api/v1/standing-orders.json, and the club's
tools are CC0: take them, change them, run them anywhere.
