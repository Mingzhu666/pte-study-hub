# Summit Climb — All Modules Redesign

## Status

This spec supersedes `2026-05-09-pte-command-map-design.md`. The Command Map metaphor (spatial tactical map + daily-practice tracking) is being replaced with the Summit Climb metaphor (vertical priority climb + strategy-mastery checklist). Categories pages and module detail pages remain untouched.

## Goal

Replace the All Modules empty state with an interactive Summit Climb. The page should:

- Make the user feel that the system understands their target (7炸 vs 8炸) and shows the *real* exam priorities, not a generic checklist.
- Reinforce strategy mastery through a per-module checklist that doubles as an interactive 攻略.
- Drive return visits through visible, curiosity-tugging progress on the climb — without manipulative streak mechanics.
- Feel premium and operational, not gamified.

The page must be easy to extend later with per-module drills (small games), but those are out of scope for this version.

## Source Strategy

The design uses the user's 7炸 and 8炸 research as product logic.

For Australia migration contexts after 2025-08-07:

- 7炸 / Proficient — L 58, R 59, W 69, S 76.
- 8炸 / Superior — L 69, R 70, W 85, S 88.

Module priority consensus:

- **Highest value (focus tier):** WFD, RS, DI, RL/SGD, WE, SWT, SST, FIB-RW, FIB-R.
- **Support tier:** RA, RO, HIW, FIB-L.
- **Low yield:** single choice, multiple choice, ASQ, SMW, and similar low-return items.

The page must avoid implying that 7炸 / 8炸 means four equal legacy band scores; it shows target chips as `L / R / W / S` with the real per-skill thresholds.

7炸 framing: stable passing — protect big modules, reduce low-level loss. 8炸 framing: Speaking 88 / Writing 85 are the real bottlenecks; the pressure chain is RS / WFD / WE / SWT-SST / FIB.

## Experience Principles

- **Climb, not checklist.** Vertical priority is the spine of the page; a flat list won't carry the metaphor.
- **System decides priority.** The user does not reorder or hide modules. Low-yield modules are downplayed by the system based on the research, not by user toggling.
- **Mastery beats ritual.** A persistent strategy checklist replaces "Mark practiced today." No streaks, no badge walls, no daily punishment.
- **Premium and quiet.** Apple-clean visual language, restrained color, calm motion. No gamified noise.
- **Categories remain the library; All Modules is the climb.** Sidebar, category pages, and module detail pages stay exactly as they are.

## Page Structure

### Sidebar

Unchanged.

- `All Modules` opens the Summit Climb.
- `Categories` and nested module links behave exactly as today.
- Existing category views and module detail views stay as-is.

### Main Layout

Two columns inside the existing `main` area.

**Left column · Climb (≈ 60% width):**

- Top: **Summit Banner** — target name, four target-score chips (`L · R · W · S`), and a `7炸 / 8炸` segmented switch. A coach line sits directly under the banner: e.g. `Next focus → WFD (3 strategies remaining)`.
- Center: **Vertical winding path** — checkpoints for modules with priority ∈ {focus, active, support} for the active target, arranged so higher priority sits closer to the summit. Path is drawn with a single stroke; the current "next focus" pulses softly.
- Right of the main path (or lower-right corner): **Side Trails** — modules with priority `low` for the active target, rendered as a small dashed branch with faded labels. Visible but visually de-emphasized. Labelled `Low Yield · Skip-friendly`. Users cannot interact with these to "ignore" — they are *pre-ignored* by the system.
- Bottom: **Base Camp** — a single line showing total mastery against the climb's module count (currently 17 modules from `commandMap.ts`; the four PTE modules absent from that data file — see "Module coverage gap" below — are not represented on the climb). Example readout: `4 / 17 mastered · 12 / 78 strategy points`. No streak. No daily counter.

**Right column · Mission Panel (≈ 40% width):**

- Persistent, reflects the currently selected checkpoint.
- Reuses the visual idiom of the existing ActionPanel but with new content. Existing ActionPanel component is replaced.

### Mission Panel content

Top to bottom inside the Mission Panel:

1. **Module header** — module name, category color stripe, target-specific role (one sentence, from `commandNodes[id].rationale[target]`).
2. **Stats row** — daily volume chip (e.g. `80–120 / day`), priority tier chip (`FOCUS` / `ACTIVE` / `SUPPORT`), completion percentage.
3. **Strategy Checklist** — the heart of the panel. 5–8 actionable strategy items, each rendered as a checkbox row.
   - Source: a flattened union of the existing `strategy[]` and `tips[]` arrays in `data/pteModules.ts`. Items are de-duplicated and trimmed to imperative form.
   - Bilingual: when language is `zh`, use the items from `contentZh` if present; fall back to English.
4. **Failure points** — short bullet list from `commandNodes[id].failurePoints`. Read-only; not part of the checklist.
5. **Footer** — completion progress bar (`n / m completed`) and a secondary link `Open full strategy` that routes into the existing module detail view.

### Side Trails (low-yield)

- Render as a small dashed branch on the canvas.
- Each side-trail node is clickable: clicking still selects it and updates the Mission Panel (so users can read the strategy if curious).
- Side-trail nodes never pulse, never get a "next focus" highlight.
- They participate in the `4 / 22 mastered` count but their progress is not coach-recommended.

## Onboarding & Target Switch

### First visit (no localStorage)

- The Climb is *not* drawn yet. The Summit Banner area shows two large side-by-side cards: `7炸 · Stable Passing` and `8炸 · Superior Pressure`, each with its four score chips.
- Coach copy below: *"Pick your target. We'll plot the route."*
- The user taps one card. Cards fade out. The path animates in: line stroke draws from base to summit (~700 ms), then checkpoints `pop-in` along the path in priority order, ~80 ms staggered. Total reveal ~1.2–1.5 s.
- The target choice is persisted; subsequent visits skip this entirely.

### Returning visit

- Climb renders fully on load. Target chips and switch are visible at the top.

### Switching 7 ↔ 8炸

- Score chips morph through a number-roller transition.
- Checkpoints re-tier (focus / active / support priority changes between targets) and re-position with spring physics. Side-trail membership recomputes.
- Coach copy changes to the new target's framing.
- Progress is preserved — switching does not reset mastery state.
- Target switch is the most important "premium feel" moment in the design. It must be smooth and clearly communicate "different target = genuinely different route."

## Progress Model

### Mastery, not practice

- Each strategy item has a stable identifier (`moduleId + index` works; ideally a hashed key from item text so reordering data doesn't lose state).
- Toggling a checkbox updates `mastery[moduleId].checked[]` in localStorage.
- A module's completion percentage = `checked.length / total`.
- A module is "mastered" when completion = 100%.
- Reverting a check is allowed at any time. No confirmation dialog. No lock-in.

### Climb visualization tied to progress

- 0%: outline-only checkpoint dot.
- 1–99%: a ring around the dot fills clockwise as completion advances.
- 100%: dot becomes solid in the category color, plus a small `flag` icon and a subtle `MASTERED` chip on hover.
- The center line of the path lights ("flows") softly when any module's completion changes.

### Base Camp readout

A single line, left-aligned:

```
4 / 22 mastered · 12 / 78 strategy points
```

That is the only progress indicator. No streaks, no daily counters, no XP, no badges.

## Coach Logic

The coach line under the Summit Banner exists to gently point at "what to work on next."

- Priority order: scan modules in the active target's `route` order from `targetProfiles[target].route`, then `support`. Emit the first one that is not yet at 100% completion.
- Coach copy template: `Next focus → {moduleName} ({n} strategies remaining)`.
- If everything in `route` and `support` is mastered, coach reads: `Route mastered. Maintain or revisit any module.`
- The recommended module's checkpoint pulses softly (1.6 s ease-out, opacity loop) to draw the eye.
- Switching targets recomputes the recommendation immediately.

## Data & State

### Reuse — no new content

- Module content (overview, strategy, tips, common mistakes, scoring): `data/pteModules.ts`. Unchanged.
- Target profiles, command nodes (priorities, daily volumes, rationales, failure points, route ordering), edges: `data/commandMap.ts`. The `commandEdges` and the `(x, y)` coordinates on `commandNodes` are no longer used by the new component; strip them in the same change to keep the file honest. The `priority`, `dailyVolume`, `rationale`, `failurePoints`, and `skills` fields are reused.

### Module coverage gap

`data/commandMap.ts` defines 17 modules; `data/pteModules.ts` has more (the marketing copy says "all 22"). The climb shows only modules that appear in `commandMap.ts`, since priority and rationale data exist only there. Modules in `pteModules.ts` without a `commandNode` entry remain reachable through the Categories sidebar; they simply don't sit on the climb. If a missing module is later judged important enough for the climb, the fix is to add a `commandNode` entry, not to invent placeholder priority data inside the climb component.

### Strategy checklist construction

For each module:

1. Concatenate `content.strategy` and `content.tips` (English), and `contentZh.strategy` + `contentZh.tips` if present.
2. De-duplicate by case-insensitive trim.
3. Generate a stable id per item: `${moduleId}:${stableHash(itemText)}`, where `stableHash` is a 32-bit FNV-1a (or any equivalent deterministic non-cryptographic hash) of the trimmed lowercase item text. The hash makes the id resilient to data reordering.
4. Cap the list at 8 items per module. If the source has more, take the first 8 in original order. (Empirically the source rarely exceeds 8; this guard is defensive.)

A small builder (`lib/strategyChecklist.ts`) computes this once at module load and caches by language.

### Storage

- Key: `pte-summit-mastery-v1`. The previous key `pte-command-map-progress-v1` is **not** migrated; the old shape (daily-practice tracking) does not map cleanly to the new mastery shape, and the previous version was never released.
- Shape:

```ts
type SummitMasteryState = {
  target: 'seven' | 'eight';
  mastery: Record<string, { checked: string[] }>; // moduleId -> checked strategy item ids
};
```

- Writes happen on every checkbox toggle and on target switch.
- Reads happen once on mount; no cross-tab sync needed.

### Components

New / replaced:

- `components/SummitClimb.tsx` — replaces `components/CommandMap.tsx`. Renders the canvas, summit banner, base camp, and orchestrates Mission Panel selection.
- `components/MissionPanel.tsx` — extracted from the old `ActionPanel` inside `CommandMap.tsx`. Holds the strategy checklist, stats, footer.
- `components/StrategyChecklistItem.tsx` — single checkbox row.
- `lib/summitMastery.ts` — replaces `lib/commandMapLogic.ts`. Pure functions for: load / save state, compute completion percentages, compute next-focus recommendation, target switch handling.
- `lib/strategyChecklist.ts` — derives the per-module checklist from `pteModules.ts`.

Tests:

- `lib/summitMastery.test.ts` — covers next-focus selection, percentage math, target-switch invariance, uncheck behavior. Modeled on the existing `commandMapLogic.test.ts`.

Removed:

- `components/CommandMap.tsx`
- `lib/commandMapLogic.ts`
- `lib/commandMapLogic.test.ts`

`app/page.tsx` swaps `<CommandMap …/>` for `<SummitClimb …/>`.

## Visual Direction

Apple-clean continues. No new design language.

- Light surface, restrained contrast, fine borders.
- Category colors reused as accents on checkpoints and the color stripe in Mission Panel.
- Typography unchanged from the rest of the app (Inter, the same letter-spacing tokens).
- Single thin path stroke for the climb. No neon glow. No drop shadows on path.
- Subtle motion: spring transitions on target switch, soft pulse on next-focus recommendation, ease-in checkbox tick.
- No marketing hero, no decorative blobs, no nested card stacks, no gamification UI.

The page should feel like a precise study control panel: lively enough to invite play, calm enough to trust.

## Accessibility & Responsiveness

- All interactive nodes (checkpoints, target switch, checkboxes) are real buttons / inputs with focus rings.
- Hover-only information must also be reachable on focus.
- The vertical climb is keyboard-traversable: Tab moves through checkpoints in priority order; Enter selects.
- Reduced-motion: skip the onboarding path-draw, checkpoint pop-in, and target-switch spring; show end states immediately. Replace the next-focus pulse with a static high-contrast tint (no opacity loop).
- Mobile: the two-column layout collapses to a single column. Climb stacks above Mission Panel. Base Camp stays at the bottom of the climb section. Side Trails become a collapsed `Low yield · skip-friendly` accordion. No drag, no horizontal scroll, no gesture work — minimum-viable-mobile.

## Future Hooks (not in this version)

- Per-module **drills** (small games). Mission Panel will gain a `Drills` slot below the strategy checklist when those exist. The slot is not rendered today but the panel layout reserves space mentally — drills slot in without needing a redesign.
- Login / cloud sync. The localStorage key already includes a version suffix; a future migration can lift the same shape into a backed-up record.
- Coach intelligence (e.g. surfacing patterns like "your unchecked items cluster around grammar"). Today's coach is one-rule; the recommendation function can grow into a richer engine without changing the UI contract.

## Out of Scope

- Backend persistence and account binding.
- Multi-device sync.
- Real exercise / drill players.
- Real AI scoring or full mock-test simulation.
- Leaderboards, badges, social features.
- Rewriting category or module-detail pages.
- Migration of old `pte-command-map-progress-v1` data.

## Testing Expectations

- All Modules opens the Summit Climb (not the old Command Map).
- Category pages and module detail pages are unchanged.
- First-visit target picker correctly persists choice; refreshing skips the picker.
- Target switch updates score chips, route ordering, side-trail membership, coach copy. Mastery state persists across switches.
- Checking a strategy item updates: checkbox, completion percentage, checkpoint ring fill, Base Camp counter, coach recommendation if relevant.
- Unchecking reverts all of the above.
- Mastered modules render the flag and `MASTERED` chip.
- Side-trail modules are visible, selectable, never recommended.
- Reduced-motion users skip onboarding animation and target-switch spring; final state is correct.
- Mobile collapses cleanly; nothing overlaps; Mission Panel is reachable below the climb.
- `npm run lint` and `npm run build` pass.
