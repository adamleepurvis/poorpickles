# Dynasty Draft Assistant

A live dynasty fantasy baseball draft tool with AI advisor, scoring engine,
positional scarcity tracking, and dynamic category need decay.

---

## Project structure

```
dynasty-draft/
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # League switcher
│   └── DraftAssistant.jsx   # The full draft app
├── leagues/
│   └── poor_pickles.js      # League-specific config (keepers, cats, teams)
├── data/
│   ├── fetch_projections.py # Pulls FanGraphs data → targets.json
│   └── targets.json         # Generated player pool (commit this)
├── index.html
├── vite.config.js
├── package.json
└── vercel.json
```

---

## First-time setup

### 1. Install Node.js
Download from https://nodejs.org (LTS version). This gives you `npm`.

### 2. Clone or create the repo on GitHub
- Go to github.com → New repository → name it `dynasty-draft` → Private → Create
- On your machine, open Terminal and run:
```bash
git clone https://github.com/YOUR_USERNAME/dynasty-draft.git
cd dynasty-draft
```
Then copy all these project files into that folder.

### 3. Install dependencies
```bash
npm install
```

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:5173 — the app loads instantly, no build needed.

---

## Before each draft: update projections

### Install Python dependencies (one time)
```bash
pip install requests pandas
```

### Pull fresh projections
```bash
python data/fetch_projections.py
```

This hits FanGraphs for Steamer projections, normalizes them to 0-10 scores,
and writes `data/targets.json`. Commit that file before your draft.

### Manual overrides
For key targets (prospects, IL players, dynasty stashes), add them to
`DYNASTY_OVERRIDES` in `fetch_projections.py` — these override the
auto-calculated dynasty score with your own judgment.

---

## Deploy to Vercel (free hosting)

### One-time setup
1. Go to vercel.com → Sign up with GitHub (one click)
2. Click "Add New Project" → Import your `dynasty-draft` repo
3. Vercel auto-detects Vite → click Deploy

That's it. You get a URL like `dynasty-draft.vercel.app`.

### Auto-deploy on every push
Once connected, every `git push` triggers a new deploy automatically:
```bash
git add .
git commit -m "update projections before draft"
git push
```
Vercel rebuilds in ~30 seconds. Your live URL always has the latest version.

---

## Add a second league

1. Copy `leagues/poor_pickles.js` → `leagues/my_other_league.js`
2. Update all values: team names, draft order, keeper picks, category needs
3. In `src/App.jsx`, uncomment the second league entry and import your file:
```js
import { OTHER_LEAGUE_CONFIG } from '../leagues/my_other_league.js'

const LEAGUES = [
  { id: 'poor_pickles', label: 'Poor Pickles (12-team)', config: POOR_PICKLES_CONFIG },
  { id: 'other',        label: 'My Other League',        config: OTHER_LEAGUE_CONFIG },
]
```
A league selector tab appears at the top automatically.

---

## Scoring model

| Component | Weight | Description |
|---|---|---|
| 2026 production | 25% | Immediate contribution this season |
| Dynasty score | 75% | 2027-2028 peak value |
| Category fit | 0.6-1.0× | Multiplier based on your specific category gaps |
| Positional VOR | +0-1.0 | Value over replacement at scarcest position |
| Urgency bonus | +0-1.5 | Probability player is gone by your next pick |

Category need weights decay as you draft — drafting a HR guy drops HR need
by 1, so the board re-sorts automatically toward your remaining gaps.

IL players: 40% of 2026 score, full dynasty score.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Focus the pick input |
| `Enter` | Record pick and advance |
| `Esc` | Clear input |
| `↓` | Accept first autocomplete suggestion |

---

## Updating player scores before draft day

1. Run `python data/fetch_projections.py` to get fresh Steamer/ZiPS numbers
2. Review `data/targets.json` — check that key targets have sensible scores
3. Add manual overrides in `fetch_projections.py → DYNASTY_OVERRIDES` for prospects
4. Commit and push → auto-deploys to your Vercel URL
