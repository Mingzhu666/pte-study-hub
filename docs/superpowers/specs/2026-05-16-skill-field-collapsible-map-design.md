---
name: skill-field-collapsible-map
description: Refactor 通关秘籍2 (SkillField) to mirror 通关秘籍1 (SummitClimb) — independent scrolling practice column, collapsible map area, drag-to-resize divider.
status: draft
date: 2026-05-16
---

# SkillField · Collapsible Map & Independent Practice Column

## Goal

Bring `SkillField` (通关秘籍2) in line with `SummitClimb` (通关秘籍1) so that:

1. The right-hand practice column scrolls **independently** of the rest of the page (no shared page scroll).
2. The middle map area can be **collapsed away**, leaving the practice column at full width.
3. A **drag-to-resize handle** sits between the map area and the practice column.

This is purely a layout/interaction refactor. The map's internal content (4 zones, nodes, hover rays, tour) and the `MissionPanel` are unchanged.

## Non-goals

- No changes to the map's internal layout, node positions, hover rays, or tour overlays.
- No changes to `MissionPanel` or the underlying `useSummitMastery` data flow.
- No changes to `data/skillFieldModules.ts`.
- No styling overhaul of the editorial / Swiss-poster look — collapse button and resize handle reuse Apple-style chrome from SummitClimb where it exists, no new visual language.

## Current vs target layout

### Current (page-scroll, 3 fixed columns)

```
.skill-field-view              overflow: auto (page scroll)
└─ .pte-skill-field-root       flex column
   ├─ .pte-sf-header           page header
   └─ .pte-sf-body             grid: 280px | 720px center | 380px
      ├─ .pte-sf-left          filter + legend + DetailPanel
      ├─ .pte-sf-middle        720x720 map canvas
      └─ .pte-sf-right         MissionPanel (position: sticky, top: 24px)
```

Problems:
- Whole page scrolls together; sticky right column shifts when page scrolls past sticky bounds.
- Map area cannot be hidden — always 720+px wide regardless of focus.

### Target (split layout, collapsible map unit)

```
.skill-field-view              height: 100vh, overflow: hidden
└─ .pte-skill-field-root       flex column, height: 100%
   └─ .pte-sf-shell            grid: minmax(...) | 12px | minmax(...)
      ├─ .pte-sf-map-wrap      independent overflow-y: auto, contain: strict
      │   ├─ .pte-sf-header    (moved INSIDE this wrap — collapses with map)
      │   └─ .pte-sf-inner     grid: 280px | 1fr
      │       ├─ .pte-sf-left  filter + legend + DetailPanel
      │       └─ .pte-sf-middle 720x720 map canvas
      ├─ .pte-sf-resize-handle 12px drag handle
      └─ .pte-sf-right         independent overflow-y: auto, contains MissionPanel
```

Collapsed state (`.pte-sf-shell.map-collapsed`):
- Grid collapses to a single column (`minmax(320px, 1fr)`).
- `.pte-sf-map-wrap` and `.pte-sf-resize-handle` become `display: none`.
- `.pte-sf-right` fills the full width.

## Component changes

### `components/SkillField.tsx`

Add props (mirroring `SummitClimb`):

```ts
interface Props {
  modules: PTEModule[];
  onOpenModule: (module: PTEModule) => void;
  mapCollapsed?: boolean;
  onCollapseMap?: () => void;
}
```

Add internal state for the resize:

```ts
const splitRef = useRef<HTMLDivElement | null>(null);
const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);
const [isResizing, setIsResizing] = useState(false);
```

The `useEffect` that wires `pointermove` / `pointerup` / `pointercancel` for resizing is copied from `SummitClimb` (uses `splitPercentFromPointer`). It adds/removes a `body.skill-field-resizing` class for global cursor.

JSX restructuring:
- The existing `.pte-sf-body` 3-column grid is **removed**. It is replaced by `.pte-sf-shell` (the new outer split container) and `.pte-sf-inner` (the map area's internal 2-column grid).
- Wrap `.pte-sf-header` + a new `.pte-sf-inner` (containing left + middle) inside `.pte-sf-map-wrap`.
- Promote `.pte-sf-right` to a sibling of `.pte-sf-map-wrap` under `.pte-sf-shell`.
- Insert `.pte-sf-resize-handle` between them.
- Render the collapse button in the header row (top-right of the map area), only when `onCollapseMap` is provided.

Header collapse button (Chinese tooltip "收起地图", icon `ChevronsLeft` from lucide-react). Styling: extract a shared class `.split-collapse-button` (renamed from `.summit-collapse-button`) so both SummitClimb and SkillField use one definition. See "CSS reuse" below — the same rename pattern is applied to `.summit-collapse-button` → `.split-collapse-button` and updated in `SummitClimb.tsx`.

### `app/page.tsx`

Add separate state for the SkillField map collapse (independent from SummitClimb's):

```ts
const SKILL_FIELD_MAP_COLLAPSED_KEY = 'pte-skill-field-map-collapsed';
const [skillFieldMapCollapsed, setSkillFieldMapCollapsed] = useState(false);

useEffect(() => {
  if (typeof window === 'undefined') return;
  const stored = window.localStorage.getItem(SKILL_FIELD_MAP_COLLAPSED_KEY);
  if (stored === 'true') setSkillFieldMapCollapsed(true);
}, []);

useEffect(() => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SKILL_FIELD_MAP_COLLAPSED_KEY, String(skillFieldMapCollapsed));
}, [skillFieldMapCollapsed]);
```

`handleSkillFieldClick` resets to expanded (matching summit's `handleAllModulesClick` pattern):

```ts
const handleSkillFieldClick = () => {
  setViewState({ type: 'skillField' });
  setSkillFieldMapCollapsed(false);
};
```

Pass to `<SkillField>`:

```tsx
<SkillField
  modules={allModules}
  onOpenModule={handleModuleClick}
  mapCollapsed={skillFieldMapCollapsed}
  onCollapseMap={() => setSkillFieldMapCollapsed(true)}
/>
```

Sidebar "能力场" button gets the same `sidebar-map-hint` indicator pattern when its map is collapsed (mirrors the existing "所有模块" hint), and tooltip toggles to `${t('skillField')} · 展开地图` when collapsed.

### `lib/layoutSizing.ts` — rename to generic

Rename the `SUMMIT_*` constants and helpers to generic names (since they are reused by both panels):

| Old | New |
|-----|-----|
| `DEFAULT_SUMMIT_SPLIT_PERCENT` | `DEFAULT_SPLIT_PERCENT` |
| `MIN_SUMMIT_SPLIT_PERCENT` | `MIN_SPLIT_PERCENT` |
| `MAX_SUMMIT_SPLIT_PERCENT` | `MAX_SPLIT_PERCENT` |
| `clampSummitSplitPercent` | `clampSplitPercent` |
| `splitPercentFromPointer` | unchanged (already generic) |

Update all call sites:
- `components/SummitClimb.tsx`
- `lib/layoutSizing.test.ts`
- (new) `components/SkillField.tsx`

### `app/globals.css`

Changes to the `.skill-field-view` and below:

```css
.skill-field-view {
  height: 100vh;
  overflow: hidden;
  background: #fafaf7;
  /* drop padding: 24px and overflow: auto */
}

.skill-field-view > .pte-skill-field-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* drop max-width / box-shadow / padding — fill the main area */
}

.pte-sf-shell {
  display: grid;
  grid-template-columns: minmax(560px, var(--sf-map-width, 60%)) 12px minmax(360px, 1fr);
  gap: 14px;
  padding: 24px 32px 32px;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  transition: grid-template-columns 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
.pte-sf-shell.map-collapsed {
  grid-template-columns: minmax(360px, 1fr);
  gap: 0;
}
.pte-sf-shell.map-collapsed > .pte-sf-map-wrap,
.pte-sf-shell.map-collapsed > .pte-sf-resize-handle {
  display: none;
}

.pte-sf-map-wrap {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--pte-rule);
  overflow-y: auto;
  height: 100%;
  contain: strict;
}

.pte-sf-inner {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  padding: 24px 32px;
  align-items: start;
}

.pte-sf-right {
  min-width: 0;
  height: 100%;
  overflow-y: auto;
}
.pte-sf-right .pte-sf-mission-wrap {
  position: static; /* drop the sticky behavior — column scrolls itself now */
}
```

**CSS reuse decision** — to avoid leaking `summit-*` class names into SkillField's editorial-style markup, we **rename** the two cross-cutting summit chrome classes to generic names (mirroring the `lib/layoutSizing.ts` rename):

| Old | New |
|-----|-----|
| `.summit-resize-handle` | `.split-resize-handle` |
| `.summit-collapse-button` | `.split-collapse-button` |
| `body.summit-resizing` | `body.split-resizing` (used during pointer drag) |

Both `SummitClimb.tsx` and `SkillField.tsx` use these new class names. The `.summit-climb.resizing .summit-resize-handle span` rule becomes `.summit-climb.resizing .split-resize-handle span` (and a parallel `.pte-sf-shell.resizing .split-resize-handle span` is added).

Header (`.pte-sf-header`) keeps its existing styling but gains `flex-shrink: 0` so it doesn't compress when the map area is short.

Responsive breakpoints (`@media max-width: 1280px` / `1100px`) updated to fall back to the new shell:
- At ≤1100px the shell stacks vertically (map-wrap on top, then handle hidden, then right panel) — same as the current `1fr` fallback. Map collapse still works.

## Behavior details

### Collapse button placement
Inside `.pte-sf-header`, top-right of the header row (which now sits inside `.pte-sf-map-wrap`). Hidden when `onCollapseMap` is undefined. Clicking it calls `onCollapseMap()`, which the parent uses to set `skillFieldMapCollapsed = true`.

### Re-expanding the map
- Clicking "能力场" in the sidebar resets `skillFieldMapCollapsed` to `false`.
- (The sidebar shows the small map-hint icon when collapsed, just like summit's pattern.)

### localStorage persistence
Survives page reload. Independent from the summit map collapse state.

### Resize handle
Same drag/keyboard semantics as summit:
- Pointer drag: continuous resize via `splitPercentFromPointer`.
- ArrowLeft/Right: ±2% per keypress.
- Home/End: jump to `MIN_SPLIT_PERCENT` / `MAX_SPLIT_PERCENT`.
- `aria-orientation="vertical"` and `aria-valuenow={splitPercent}`.

### Sidebar hint
Add the existing `sidebar-map-hint` icon next to the "能力场" label when `skillFieldMapCollapsed === true && viewState.type === 'skillField'`. Tooltip toggles to "能力场 · 展开地图".

## Affected files

- `app/page.tsx` — new state, new effect, new key, pass props to SkillField, add sidebar hint.
- `components/SkillField.tsx` — new props, restructured JSX, resize hook, collapse button, header moved inside map-wrap.
- `lib/layoutSizing.ts` — rename constants/functions.
- `lib/layoutSizing.test.ts` — update import/call names.
- `components/SummitClimb.tsx` — update import/call names.
- `app/globals.css` — new shell/wrap/inner/right rules, removed `.pte-sf-body`, removed sticky on `.pte-sf-mission-wrap`, renamed `.summit-resize-handle` → `.split-resize-handle`, renamed `.summit-collapse-button` → `.split-collapse-button`, renamed `body.summit-resizing` → `body.split-resizing`, kept editorial-style chrome for the map area, new `.map-collapsed` rules.

## Out-of-scope considerations explicitly rejected

- **Single shared collapse state across both modules**: rejected. User may want to collapse one and not the other; behaviour should be independent.
- **A separate "expand map" floating button inside the practice column when map is collapsed**: rejected for now. Sidebar re-click is sufficient and matches summit's UX. Revisit if telemetry shows users get stuck.
- **Refactoring the map canvas to be fluid (not 720x720 fixed)**: out of scope. The map already has its own complex layout algorithm; resizing it would require redesigning the node placement.

## Test plan

**Manual**
1. Open `/` → click "能力场" → confirm 3-column layout with independent right-column scroll.
2. Click collapse button in map header → map area + filter/legend/detail collapse together → practice column fills width.
3. Refresh page → collapsed state persists.
4. Click "能力场" in sidebar again → map re-expands.
5. While not collapsed, drag the divider — map and practice resize smoothly within min/max bounds.
6. Keyboard: focus the divider, press ArrowLeft/Right/Home/End — values adjust.
7. Switch to summit (通关秘籍1), collapse it, switch back to 能力场 — collapse states stay independent.
8. Resize browser to <1100px — layout falls back to stacked.

**Automated**
- Update `lib/layoutSizing.test.ts` for renamed exports; existing assertions stay green.
- No new tests for the React layout changes (keeping with existing project convention — no component tests for SummitClimb either).
