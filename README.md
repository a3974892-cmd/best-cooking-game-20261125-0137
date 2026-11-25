# Sizzle &amp; Serve — best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/a3974892-cmd/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/a3974892-cmd/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle &amp; Serve** is a lunch-rush cooking game: tickets come in on the order board, you grill patties, fry the fries, stack the plate and ring the bell before each customer's patience runs out. One 150-second shift, three hearts, combos for serving back-to-back, and a star rating at the end.

## How to play

- **Tickets** arrive on the board at the top, each with a dish, its ingredients and a patience bar.
- **Grill** (left): click the Patty bin to start one cooking — grab it when it says READY, before it burns.
- **Fryer**: click the Fries bin, same story, quicker.
- **Plate** (middle): click ingredient bins to stack the dish. Click a layer on the plate to take it off; the trash can clears the plate.
- **Serve**: click a ticket whose dish matches the plate exactly, or ring the golden bell to serve the first matching ticket. Tips grow with patience left and with your combo.
- **Keys**: 1–7 add ingredients, Space serves, T clears the plate, P pauses, M mutes.
- Lose a heart for every ticket that expires. The shift ends at 150 seconds or at zero hearts.

## The menu

| Dish | Needs | Price |
| --- | --- | --- |
| Classic Burger | bun, patty, lettuce | $8 |
| Cheese Burger | bun, patty, cheese, tomato | $10 |
| Double Stack | bun, patty, patty, cheese | $13 |
| Garden Burger | bun, lettuce, tomato, cheese | $9 |
| Crispy Fries | fries | $4 |
| Berry Soda | drink | $3 |

Score targets: $40 ★, $70 ★★, $100 ★★★.

## Run it

Serve `game/` with any static server and open `game/index.html` in a desktop browser — no build step, no network requests, all art and sound are drawn and synthesized in code.

```sh
python3 -m http.server 8080 --directory game
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. The four screenshots under `screenshots/` are real renders of the game (title, mid-shift, a plate ready to serve, and the end-of-shift results), staged by `game/src/shots.js` through `?shot=start|play|serve|end&seed=1`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7yd20ms9&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
