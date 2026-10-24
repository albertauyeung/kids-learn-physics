# Block Physics

A blocky, game-style physics course for kids aged about 10–12. It's designed for iPads and laptops.
Each 10–15 minute session mixes interactive simulations, predictions, worked explanations and
calculation/word problems. Duolingo-style XP, streaks, emeralds, quests and achievements keep it fun.

**Now playable:** Mechanics Unit 1 (Describing Motion) and Unit 2 (Velocity & Relative Motion).
That's 19 sessions: per unit, 5–6 lessons, 2 problem sets, a Unit Review and a Boss Mission. The full 10-unit plan is in
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
To jump to any session, go to **Profile → Settings**, answer the grown-ups' maths question under
**Parent settings**, then turn on "Unlock all sessions".

## Cloud save with Google sign-in (optional)

Progress is always kept on the device (localStorage). Signing in with Google also keeps a copy
in Firebase, so it is safe and can be carried to another iPad or computer. It is off until a
Firebase config is added; no server code is needed.

1. Create a project at https://console.firebase.google.com (the free Spark plan is enough).
2. **Authentication → Sign-in method:** enable **Google**. Under **Settings → Authorized domains**, add `ayeung.dev`
   (and `localhost` for testing).
3. **Firestore Database → Create database** (a NoSQL document database; any region, start in production mode).
   Then **Rules:** paste [`firestore.rules`](firestore.rules) and **Publish**.
4. **Project settings → Your apps → Web app (`</>`):** register an app and copy its `firebaseConfig`
   into [`js/core/firebase-config.js`](js/core/firebase-config.js). These values are public by design;
   the rules keep each user's data private.

Each Google account gets one document, `users/{uid}`, holding the whole save as a JSON string.
When two copies differ, the one with more XP wins (ties: the newer). A device only uploads after
reading the cloud copy, so an old tab can't overwrite newer progress. A parent's Google account is
recommended (children's accounts under 13 are managed by Family Link).

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
