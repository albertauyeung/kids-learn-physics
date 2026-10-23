# Block Physics

A blocky, game-style physics course for kids aged about 10–12. It's designed for iPads and laptops.
Each 10–15 minute session mixes interactive simulations, predictions, worked explanations and
calculation/word problems. Duolingo-style XP, streaks, emeralds, quests and achievements keep it fun.

**Now playable:** Mechanics Unit 1 (Describing Motion) and Unit 2 (Velocity & Relative Motion).
That's 16 sessions: 5 lessons, 2 problem sets and 1 Boss Mission per unit. The full 10-unit plan is in
[`docs/SYLLABUS.md`](docs/SYLLABUS.md).

## Run it

It's a static site with no build step and no dependencies.

```sh
npm start          # serves the folder at http://localhost:8080
npm test           # checks every problem template and session (Node 18+)
```

### GitHub Pages

Go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, pick the branch and the
`/ (root)` folder, then save. The site appears at `https://<user>.github.io/kids-learn-physics/`.

Progress is saved in the browser's local storage, so each device or browser keeps its own progress.
To jump to any session, go to **Profile → Settings** and turn on "Unlock all sessions (parent mode)".

## How it's organised

```
index.html, css/style.css      app page and blocky theme
js/main.js                     screens: map, session, results, quests, shop, profile
js/core/                       state & gamification, pixel sprites/textures, sounds, helpers
js/engine/                     session runner, question types, problem templates, SVG graphs
js/widgets/                    interactive simulations (registered by name in index.js)
js/content/course.js           Course → Track → Unit list
js/content/mechanics/unitN.js  lessons as data: steps of info / predict / sim / questions
js/content/mechanics/unitN-templates.js  parameterised problems (fresh numbers every time)
```

### Adding content

- **A new unit:** create `js/content/<track>/unitN.js` plus its templates file, then list it in `course.js`.
- **A new topic** (e.g. Waves): add a track to `course.js`. The runner, gamification and question types are
  topic-agnostic.
- **A new simulation:** write `js/widgets/<name>.js` exporting `(el, params, api) => destroy`, call
  `api.done()` when its goal is met, then register it in `js/widgets/index.js`.

The art is original pixel art, drawn in code and inspired by blocky voxel games. It's not affiliated with any game.
