# Priority Unification — Design Spec

## Problem

The app currently exposes two unrelated priority systems:

- **Legacy** `PTEModule.priority: 'high' | 'medium' | 'low'` (also duplicated as `ScoringInfo.weight`) in [data/pteModules.ts](../../../data/pteModules.ts). Drives sidebar dot, Category-view card badge, and Module Detail header / scoring badge.
- **Strategic** `CommandNode.priority: { seven: 'focus'|'active'|'support'|'low'; eight: ... }` in [data/commandMap.ts](../../../data/commandMap.ts). Drives the SummitClimb visualization.

The two were authored from different research sources and disagree for several modules — most starkly **RA** (legacy `low` vs. strategic `active`) and **HIW** (legacy `high` vs. strategic `support`). Because users see both surfaces at once, the inconsistency erodes trust.

## Decision

**Single source of truth = `commandMap`.** The legacy `priority` and `weight` fields are removed from data; every priority display derives from `CommandNode.priority` for the user's current target (7炸 / 8炸).

## Mapping (4 → 3)

| commandMap   | UI legacy tier |
| ------------ | -------------- |
| `focus`      | `high`         |
| `active`     | `high`         |
| `support`    | `medium`       |
| `low`        | `low`          |

Rationale: `focus` and `active` are both "main route" in the climb; `support` is maintenance; `low` is skip-mostly. Collapsing focus+active into a single legacy tier keeps the sidebar's visual rhythm and matches the climb's main-vs-side-trail split.

## Architecture

### Lift `SummitMasteryState` into a Context

Currently SummitClimb owns the mastery state via `useState` + a hydration `useEffect`. To let other views know the current target without each view re-implementing hydration, we lift the entire state into a `SummitMasteryProvider` at app root.

- New module `context/SummitMasteryContext.tsx` exports `SummitMasteryProvider`, `useSummitMastery()` (full state + setters), `useTarget()` (read-only target + `setTarget`).
- The provider does the hydration / persistence currently in SummitClimb.
- `lib/summitMastery.ts` is unchanged — its function signatures and tests stay intact.

### Derived priority helper

New helper in `data/commandMap.ts`:

```ts
export function legacyPriorityForTarget(
  moduleId: string,
  target: CommandTarget,
): 'high' | 'medium' | 'low' {
  const node = commandNodes.find((n) => n.id === moduleId);
  if (!node) return 'low';
  const tier = node.priority[target];
  if (tier === 'focus' || tier === 'active') return 'high';
  if (tier === 'support') return 'medium';
  return 'low';
}
```

Returns `'low'` for unknown ids (defensive only — no module in the data file is missing from commandMap).

### Type changes

- Remove `priority` from `PTEModule`.
- Remove `weight` from `ScoringInfo` (and `ModuleContentZh.scoring.weight` value via shared type).
- Strip these fields from every entry in `data/pteModules.ts` (~22 modules × 3 sites).

### Display sites updated

- `app/page.tsx` — sidebar priority dot, Category-view card badge, Module Detail header badge, scoring weight cell.
- `components/ModuleDetail.tsx` — header badge, scoring weight cell.

Each of these now reads `target` via `useTarget()` and calls `legacyPriorityForTarget(module.id, target)`.

## Behavior change visible to user

- Sidebar dot color and detail badge label now react to the 7/8 toggle in SummitClimb.
- Modules whose legacy and strategic priority disagreed (RA, HIW, DI, RL, SGD, FIB-L, RTS, SWT) now show the strategic value everywhere.

## Out of scope

- Visual redesign of the priority indicators (only the data they read changes).
- Surfacing the 4-tier strategic value verbatim in non-climb views — collapsed to 3 tiers per the mapping above.
- Removing the unused `components/ModuleCard.tsx` (dead code, but unrelated cleanup).
