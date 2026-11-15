# The Neighborhood Watch — prototype

Original retro-propaganda comic slot concept built as an isolated, dependency-free browser prototype inside `slotpol1`.

## Run

From the repository root:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/neighborhood-watch/`.

## Test

```sh
node --test neighborhood-watch/engine.test.mjs
```

The game currently uses a JavaScript **client-side simulation** and **play credits only**. It is **not yet integrated into the Slotopol Go backend**. The random selection, paytable, bonus prices, and payouts are prototype values, not audited or certified. No real-money use, published RTP claim, or wagering integration should rely on them.

Features: 20 line base spin; Curfew locks outer reels and awards an additional multiplier; HOA Meeting purchases a wild-placement multiplier spin; Home Invasion replaces random non-scatter symbols with Evidence Wilds. Reset restores demo credits.

Next: define and simulate math for chosen RTP/volatility; implement a standalone Slotopol game package with server-authoritative outcomes; replace temporary symbols with original commissioned art and sounds; verify accessibility and mobile behavior.
