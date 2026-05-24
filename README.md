# FIFA World Cup 2026 Team Picker — v2 (React)

A browser-based tournament simulator for the FIFA World Cup 2026. Pick scores for every group match and knockout fixture to crown your own champion.

---

## From JavaScript to React

The original project ([FifaWC26TeamPicker](https://github.com/batuhanbatur/FifaWC26TeamPicker)) was a single-file vanilla JS application that used direct DOM manipulation — `document.createElement`, `innerHTML`, and imperative event listeners — to run the full tournament flow.

### What the original did

- Fetched group/match/knockout data from three JSON files
- Rendered group standings and a match prompt (Team 1 wins / Draw / Team 2 wins buttons)
- Showed a modal at the end of the group stage where the user **manually** selected the 8 best third-place teams
- Ran the knockout bracket by reassigning `button.onclick` handlers for each new stage

### Why it needed a rewrite

| Problem in v1 | React solution |
|---|---|
| All state lived in closure variables inside nested functions | Explicit `useState` / `useMemo` — state is traceable and predictable |
| DOM was mutated directly (`innerHTML`, `appendChild`) | Declarative JSX — UI is a function of state |
| Button handlers were replaced wholesale each stage | Event delegation via React synthetic events |
| No component boundaries — one 500-line script | Isolated components: `GroupStage`, `MatchCard`, `KnockoutStages`, `Bracket` |
| No reusable constants — magic strings scattered everywhere | `constants/points.js`, `stageLabels.js`, `stageOrder.js` |

### Architecture

```
App
├── GroupStage          — owns all group-stage state
│   └── MatchCard       — controlled score-entry UI (remounts per match via key)
└── KnockoutStages      — owns knockout progression state
    └── Bracket         — pure display component, derives layout from JSON tree
```

State flows one way: `GroupStage` calls `onComplete(groupResults, bestThirds)` when all 72 matches are done, and `App` swaps in `KnockoutStages`.

---

## v2 Features

### Group Stage

**Score input instead of Win/Draw/Loss buttons**
Each match now takes actual goal values (e.g. 2–1) rather than a binary outcome. Standings track Wins, Draws, Losses, Goal Difference, and Points.

**Auto-focus home → away input**
After typing the home team's score, focus moves automatically to the away input after a short delay (700 ms for single-digit scores, immediate for double-digit).

**Quick Scores panel**
A persistent tray of common scorelines (1–0, 2–1, 0–0, etc.) opens by default under each match. Clicking a score submits the result immediately and advances to the next match.

**Live standings sidebar**
All 12 groups are listed in a sidebar. The active group (currently being played) is highlighted; completed groups show a ✓ tick. Clicking any group shows its live standings sorted by Points → Goal Difference → Goals For.

### Best Third-Place Selection

The v1 modal — where the user manually picked 8 teams — is removed entirely. The top 8 third-place teams are **automatically determined** at the end of the group stage using the same tiebreaker order (Points → GD → GF). They are then assigned to their correct bracket slots using a backtracking algorithm that respects the eligibility rules encoded in `knockout.json` (each slot specifies which groups' thirds are valid for it).

### Knockout Stage

**Visual tournament bracket**
A full left-to-right / right-to-left bracket is rendered across all rounds simultaneously, meeting at the Final in the centre. The column order and match positions are derived by a DFS pre-order traversal of the match tree built from `knockout.json` — no hardcoded ordering.

- **Active match** — white border + glow
- **Completed matches** — winner row highlighted, match at 75% opacity
- **Future matches** — dimmed at 40% opacity
- Horizontally scrollable on smaller screens

**Nation flags**
Flag SVGs appear everywhere: group standings, match cards, bracket match rows, and the knockout match picker buttons.

---

## Tech Stack

- React 19
- Vite 8
- Vanilla CSS (dark theme, no UI library)

## Running Locally

```bash
npm install
npm run dev
```
