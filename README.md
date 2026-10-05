# 🧩 Riddle Flashcards

100 classic riddles as flip-to-reveal flashcards. Tap a card to see the answer, mark it
solved, and it won't come back next time you visit.

**Play:** https://kinjalthehero.github.io/riddle/

## Features

- **Flashcards** — riddle on the front, answer on the back. Tap, click, or press `Space` to flip.
- **Solved / Unsolved badge** at the top of every card.
- **Progress is remembered** in your browser's `localStorage`, so it survives refreshes and restarts.
- **Solved riddles are hidden by default.** Flip the *Show solved riddles* switch at the top to see them again.
- **Shuffled every visit**, with a `Shuffle` button to re-randomise on demand.
- **Auto-advance** to the next unsolved riddle the moment you mark one solved.
- **Progress counter** and bar — `23 / 100 solved (23%)`.
- **Reset progress** button to start over.
- **Dark mode** — follows your system by default; the 🌗 button cycles auto → light → dark.
- **Responsive** from small phones to desktop, including landscape phones.
- **Swipe** left/right on touch devices to move between riddles.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` / `Enter` | Flip the card |
| `←` / `→` | Previous / next riddle |
| `S` | Toggle solved |
| `R` | Shuffle the deck |

## Running it locally

No build step, no dependencies — it's plain HTML, CSS, and JavaScript.

```bash
git clone https://github.com/kinjalthehero/riddle.git
cd riddle
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly from the filesystem works too.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Theming, layout, flip animation |
| `app.js` | Deck, navigation, solved-state persistence |
| `riddles.js` | The 100 riddles and answers |

## Adding riddles

Append to the array in `riddles.js`:

```js
{ id: 101, q: "Your riddle here?", a: "The answer" },
```

`id` is the key used to store solved state — give new riddles new ids and never
renumber existing ones, or saved progress will point at the wrong riddles.

## Deployment

Hosted on GitHub Pages from the `main` branch root. Pushing to `main` publishes.
