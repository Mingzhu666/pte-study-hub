# Summit Climb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the All Modules Command Map with a Summit Climb whose progress is driven by a per-module strategy checklist (攻略 / mastery model). Categories pages and module detail pages stay unchanged.

**Architecture:** Two new pure libraries (`strategyChecklist`, `summitMastery`) own all derivation and state. Three React components (`SummitClimb`, `MissionPanel`, `StrategyChecklistItem`) are presentational; one (`SummitOnboarding`) handles first-visit target picking inside `SummitClimb`. Existing data (`pteModules.ts`, `commandMap.ts`) is reused; no new content is authored. localStorage uses a fresh key (`pte-summit-mastery-v1`) and the previous Command Map state is abandoned.

**Tech Stack:** Next.js 16, React 19, TypeScript, framer-motion 12, lucide-react, Tailwind 4, native `node:test` runner.

**Spec:** `docs/superpowers/specs/2026-05-09-summit-climb-redesign.md`

---

## File Structure

**Create:**
- `lib/strategyChecklist.ts` — derive bilingual checklist from a `PTEModule`
- `lib/strategyChecklist.test.ts`
- `lib/summitMastery.ts` — state model, persistence, completion math, recommendation
- `lib/summitMastery.test.ts`
- `components/SummitClimb.tsx` — orchestrator: banner, climb canvas, base camp, mission panel, onboarding gate
- `components/SummitOnboarding.tsx` — first-visit target picker
- `components/MissionPanel.tsx` — right-column strategy checklist + stats
- `components/StrategyChecklistItem.tsx` — single checkbox row

**Modify:**
- `app/page.tsx` — swap `<CommandMap />` for `<SummitClimb />`
- `app/globals.css` — add Summit styles (one section, contained)
- `data/commandMap.ts` — strip unused `(x, y)` and `roadmapWidth` fields, drop `commandEdges` export and `CommandEdge` type
- `data/translations.ts` — add ~12 new bilingual strings

**Delete:**
- `components/CommandMap.tsx`
- `lib/commandMapLogic.ts`
- `lib/commandMapLogic.test.ts`

---

## Test Strategy

- **Pure libs** (`strategyChecklist`, `summitMastery`): full TDD with `node:test`. Run with `node --test lib/<name>.test.ts`.
- **Components**: no React test infra exists. Verify by running `npm run dev` and exercising the page in a browser, plus `npm run lint` and `npm run build`.
- The user has stated they may follow up with frontend-design polish; this plan delivers a correct, working version. It does not pixel-tune visuals beyond what the spec requires.

---

## Task 1: Strategy checklist library (TDD)

**Files:**
- Create: `lib/strategyChecklist.ts`
- Create: `lib/strategyChecklist.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `lib/strategyChecklist.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategyList, fnv1a32 } from './strategyChecklist.ts';
import type { PTEModule } from '@/types/pte';

const baseModule: PTEModule = {
  id: 'demo',
  name: 'Demo',
  fullName: 'Demo Module',
  category: 'speaking',
  priority: 'high',
  icon: 'Volume2',
  color: '#000',
  content: {
    overview: 'o',
    scoring: { marks: '1', weight: 'high' },
    questionCount: '1',
    strategy: ['Keep rhythm steady', 'Do not stop on errors'],
    tips: ['Keep rhythm steady', 'Read in chunks'],
  },
  contentZh: {
    overview: 'o',
    scoring: { marks: '1', weight: 'high' },
    questionCount: '1',
    strategy: ['保持节奏稳定', '错了别停'],
    tips: ['保持节奏稳定', '按意群读'],
  },
};

test('fnv1a32 produces stable 8-char hex hashes', () => {
  assert.equal(fnv1a32('hello'), fnv1a32('hello'));
  assert.notEqual(fnv1a32('hello'), fnv1a32('world'));
  assert.match(fnv1a32('anything'), /^[0-9a-f]{8}$/);
});

test('buildStrategyList combines strategy + tips and dedupes by trimmed lowercase text', () => {
  const list = buildStrategyList(baseModule, 'en');
  assert.equal(list.length, 3);
  assert.deepEqual(list.map((i) => i.text), [
    'Keep rhythm steady',
    'Do not stop on errors',
    'Read in chunks',
  ]);
});

test('buildStrategyList returns stable ids derived from English text only', () => {
  const en = buildStrategyList(baseModule, 'en');
  const zh = buildStrategyList(baseModule, 'zh');
  assert.deepEqual(en.map((i) => i.id), zh.map((i) => i.id));
  assert.ok(en[0].id.startsWith('demo:'));
});

test('buildStrategyList swaps display text to zh when language is zh', () => {
  const zh = buildStrategyList(baseModule, 'zh');
  assert.equal(zh[0].text, '保持节奏稳定');
  assert.equal(zh[1].text, '错了别停');
  assert.equal(zh[2].text, '按意群读');
});

test('buildStrategyList falls back to English when contentZh is missing', () => {
  const noZh: PTEModule = { ...baseModule, contentZh: undefined };
  const zh = buildStrategyList(noZh, 'zh');
  assert.equal(zh[0].text, 'Keep rhythm steady');
});

test('buildStrategyList caps the list at 8 items', () => {
  const many: PTEModule = {
    ...baseModule,
    content: {
      ...baseModule.content,
      strategy: Array.from({ length: 6 }, (_, i) => `S${i}`),
      tips: Array.from({ length: 6 }, (_, i) => `T${i}`),
    },
    contentZh: undefined,
  };
  const list = buildStrategyList(many, 'en');
  assert.equal(list.length, 8);
  assert.deepEqual(list.slice(0, 3).map((i) => i.text), ['S0', 'S1', 'S2']);
});
```

- [ ] **Step 1.2: Run tests to verify they fail**

Run: `node --test lib/strategyChecklist.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 1.3: Implement the library**

Create `lib/strategyChecklist.ts`:

```ts
import type { PTEModule } from '@/types/pte';

export interface StrategyItem {
  id: string;
  text: string;
}

export function fnv1a32(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const MAX_ITEMS = 8;

export function buildStrategyList(module: PTEModule, lang: 'en' | 'zh'): StrategyItem[] {
  const enSource = [...(module.content.strategy ?? []), ...(module.content.tips ?? [])];
  const zhSource = module.contentZh
    ? [...(module.contentZh.strategy ?? []), ...(module.contentZh.tips ?? [])]
    : [];

  const seen = new Set<string>();
  const items: StrategyItem[] = [];

  for (let i = 0; i < enSource.length && items.length < MAX_ITEMS; i++) {
    const enText = enSource[i];
    const key = enText.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const zhText = zhSource[i];
    const display = lang === 'zh' && zhText ? zhText : enText;

    items.push({
      id: `${module.id}:${fnv1a32(key)}`,
      text: display,
    });
  }

  return items;
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

Run: `node --test lib/strategyChecklist.test.ts`
Expected: PASS — all 6 tests green.

- [ ] **Step 1.5: Commit**

```bash
git add lib/strategyChecklist.ts lib/strategyChecklist.test.ts
git commit -m "feat: add strategy checklist library with stable bilingual ids"
```

---

## Task 2: Summit mastery library (TDD)

**Files:**
- Create: `lib/summitMastery.ts`
- Create: `lib/summitMastery.test.ts`

- [ ] **Step 2.1: Write the failing tests**

Create `lib/summitMastery.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  toggleStrategy,
  getModuleCompletion,
  getNextFocus,
  getTotalMastery,
  STORAGE_KEY,
  type SummitMasteryState,
} from './summitMastery.ts';

test('createInitialState returns an empty mastery map and a default target', () => {
  const state = createInitialState();
  assert.equal(state.target, 'eight');
  assert.deepEqual(state.mastery, {});
});

test('toggleStrategy adds an id when not present', () => {
  const state = createInitialState();
  const next = toggleStrategy(state, 'rs', 'rs:abc12345');
  assert.deepEqual(next.mastery['rs'].checked, ['rs:abc12345']);
});

test('toggleStrategy removes an id when already present', () => {
  const start: SummitMasteryState = {
    target: 'eight',
    mastery: { rs: { checked: ['rs:abc12345', 'rs:def67890'] } },
  };
  const next = toggleStrategy(start, 'rs', 'rs:abc12345');
  assert.deepEqual(next.mastery['rs'].checked, ['rs:def67890']);
});

test('toggleStrategy does not duplicate an id when added twice', () => {
  let state = createInitialState();
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  state = toggleStrategy(state, 'rs', 'rs:abc12345');
  assert.deepEqual(state.mastery['rs'].checked, ['rs:abc12345']);
});

test('getModuleCompletion returns checked / total / percent', () => {
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { rs: { checked: ['a', 'b'] } },
  };
  assert.deepEqual(getModuleCompletion(state, 'rs', 4), { checked: 2, total: 4, percent: 50 });
  assert.deepEqual(getModuleCompletion(state, 'wfd', 4), { checked: 0, total: 4, percent: 0 });
  assert.deepEqual(getModuleCompletion(state, 'rs', 0), { checked: 2, total: 0, percent: 0 });
});

test('getNextFocus returns the first module in priority order whose completion < 100%', () => {
  const totals = new Map([
    ['rs', 3],
    ['wfd', 4],
    ['essay', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      rs: { checked: ['1', '2', '3'] },
      wfd: { checked: ['1', '2'] },
    },
  };
  const result = getNextFocus(state, ['rs', 'wfd', 'essay'], totals);
  assert.equal(result.moduleId, 'wfd');
  assert.equal(result.remaining, 2);
});

test('getNextFocus returns null when every module is at 100%', () => {
  const totals = new Map([['rs', 1]]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: { rs: { checked: ['x'] } },
  };
  const result = getNextFocus(state, ['rs'], totals);
  assert.equal(result.moduleId, null);
  assert.equal(result.remaining, 0);
});

test('getTotalMastery counts only modules in the climb id list', () => {
  const totals = new Map([
    ['rs', 2],
    ['wfd', 2],
    ['mcm', 2],
  ]);
  const state: SummitMasteryState = {
    target: 'eight',
    mastery: {
      rs: { checked: ['a', 'b'] },
      wfd: { checked: ['a'] },
      mcm: { checked: ['a', 'b'] },
    },
  };
  const result = getTotalMastery(state, ['rs', 'wfd'], totals);
  assert.deepEqual(result, {
    masteredCount: 1,
    totalModules: 2,
    pointsChecked: 3,
    pointsTotal: 4,
  });
});

test('STORAGE_KEY is the versioned summit key, not the legacy command-map key', () => {
  assert.equal(STORAGE_KEY, 'pte-summit-mastery-v1');
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

Run: `node --test lib/summitMastery.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 2.3: Implement the library**

Create `lib/summitMastery.ts`:

```ts
import type { CommandTarget } from '@/data/commandMap';

export const STORAGE_KEY = 'pte-summit-mastery-v1';

export interface MasteryEntry {
  checked: string[];
}

export interface SummitMasteryState {
  target: CommandTarget;
  mastery: Record<string, MasteryEntry>;
}

export interface ModuleCompletion {
  checked: number;
  total: number;
  percent: number;
}

export interface NextFocus {
  moduleId: string | null;
  remaining: number;
}

export interface TotalMastery {
  masteredCount: number;
  totalModules: number;
  pointsChecked: number;
  pointsTotal: number;
}

export function createInitialState(): SummitMasteryState {
  return { target: 'eight', mastery: {} };
}

export function loadState(): SummitMasteryState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<SummitMasteryState>;
    if (parsed.target !== 'seven' && parsed.target !== 'eight') return createInitialState();
    return {
      target: parsed.target,
      mastery: parsed.mastery ?? {},
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: SummitMasteryState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or disabled; failing silently is acceptable here.
  }
}

export function setTarget(state: SummitMasteryState, target: CommandTarget): SummitMasteryState {
  if (state.target === target) return state;
  return { ...state, target };
}

export function toggleStrategy(
  state: SummitMasteryState,
  moduleId: string,
  strategyId: string,
): SummitMasteryState {
  const current = state.mastery[moduleId] ?? { checked: [] };
  const has = current.checked.includes(strategyId);
  const nextChecked = has
    ? current.checked.filter((id) => id !== strategyId)
    : [...current.checked, strategyId];

  return {
    ...state,
    mastery: {
      ...state.mastery,
      [moduleId]: { checked: nextChecked },
    },
  };
}

export function getModuleCompletion(
  state: SummitMasteryState,
  moduleId: string,
  total: number,
): ModuleCompletion {
  const checked = state.mastery[moduleId]?.checked.length ?? 0;
  const safeTotal = Math.max(total, 0);
  const percent = safeTotal === 0 ? 0 : Math.round((checked / safeTotal) * 100);
  return { checked, total: safeTotal, percent };
}

export function getNextFocus(
  state: SummitMasteryState,
  priorityOrder: string[],
  totals: Map<string, number>,
): NextFocus {
  for (const moduleId of priorityOrder) {
    const total = totals.get(moduleId) ?? 0;
    if (total === 0) continue;
    const checked = state.mastery[moduleId]?.checked.length ?? 0;
    if (checked < total) {
      return { moduleId, remaining: total - checked };
    }
  }
  return { moduleId: null, remaining: 0 };
}

export function getTotalMastery(
  state: SummitMasteryState,
  climbModuleIds: string[],
  totals: Map<string, number>,
): TotalMastery {
  let masteredCount = 0;
  let pointsChecked = 0;
  let pointsTotal = 0;

  for (const id of climbModuleIds) {
    const total = totals.get(id) ?? 0;
    const checked = state.mastery[id]?.checked.length ?? 0;
    pointsTotal += total;
    pointsChecked += Math.min(checked, total);
    if (total > 0 && checked >= total) masteredCount += 1;
  }

  return {
    masteredCount,
    totalModules: climbModuleIds.length,
    pointsChecked,
    pointsTotal,
  };
}
```

- [ ] **Step 2.4: Run tests to verify they pass**

Run: `node --test lib/summitMastery.test.ts`
Expected: PASS — all 9 tests green.

- [ ] **Step 2.5: Commit**

```bash
git add lib/summitMastery.ts lib/summitMastery.test.ts
git commit -m "feat: add summit mastery state library with tests"
```

---

## Task 3: Add translations

**Files:**
- Modify: `data/translations.ts`

- [ ] **Step 3.1: Read the current translations file end-to-end**

Run: `cat data/translations.ts`. Confirm `translations` has top-level `en` and `zh` keys, and identify the `TranslationKey` export pattern.

- [ ] **Step 3.2: Add new bilingual strings**

In `data/translations.ts`, add the following entries to BOTH the `en` and `zh` blocks (place them in a clearly labeled `// Summit Climb` section at the bottom of each block, just before the closing `}`):

```ts
// English block additions
// Summit Climb
summitTitle: 'Your Climb',
pickTargetTitle: 'Pick your target',
pickTargetSubtitle: "We'll plot the route for you.",
target7Title: '7炸 · Stable Passing',
target7Subtitle: 'Protect the big modules; reduce low-level loss.',
target8Title: '8炸 · Superior Pressure',
target8Subtitle: 'Speaking 88 and Writing 85 are the bottlenecks.',
nextFocus: 'Next focus',
strategiesRemaining: 'strategies remaining',
routeMastered: 'Route mastered. Maintain or revisit any module.',
mastered: 'Mastered',
focusTier: 'Focus',
activeTier: 'Active',
supportTier: 'Support',
lowYieldTier: 'Low Yield · Skip-friendly',
strategyChecklist: 'Strategy Checklist',
failurePoints: 'Failure points',
openFullStrategy: 'Open full strategy',
baseCampMastered: 'mastered',
baseCampPoints: 'strategy points',
dailyVolume: 'Daily volume',
```

```ts
// Chinese block additions
// Summit Climb
summitTitle: '你的登顶图',
pickTargetTitle: '选择目标',
pickTargetSubtitle: '我们帮你规划路线。',
target7Title: '7炸 · 稳健通过',
target7Subtitle: '抓住高价值题型,减少低级失分。',
target8Title: '8炸 · 高压冲刺',
target8Subtitle: '口语 88、写作 85 是真正的瓶颈。',
nextFocus: '下一重点',
strategiesRemaining: '条策略待完成',
routeMastered: '全部攻略完成。继续保持或回顾任意模块。',
mastered: '已掌握',
focusTier: '核心',
activeTier: '主练',
supportTier: '辅助',
lowYieldTier: '低产 · 可略过',
strategyChecklist: '攻略清单',
failurePoints: '失分陷阱',
openFullStrategy: '打开完整攻略',
baseCampMastered: '已掌握',
baseCampPoints: '条攻略已勾选',
dailyVolume: '每日量',
```

- [ ] **Step 3.3: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (If `TranslationKey` is a derived type from `keyof typeof translations.en`, the new keys are automatically picked up.)

- [ ] **Step 3.4: Commit**

```bash
git add data/translations.ts
git commit -m "feat: add Summit Climb bilingual strings"
```

---

## Task 4: Strip unused fields from commandMap data

**Files:**
- Modify: `data/commandMap.ts`

The Summit Climb does not use the old `(x, y)` coordinates, the `roadmapWidth` field, or the `commandEdges`/`CommandEdge` exports. They are tied to the spatial map metaphor and exist nowhere else in the runtime once the old `CommandMap` component is removed.

- [ ] **Step 4.1: Update the `CommandNode` interface**

In `data/commandMap.ts`, find the `CommandNode` interface and remove the `x`, `y`, and `roadmapWidth` properties:

```ts
export interface CommandNode {
  id: string;
  label: string;
  skills: PTEModule['category'][];
  priority: Record<CommandTarget, CommandPriority>;
  dailyVolume: Record<CommandTarget, string>;
  rationale: Record<CommandTarget, string>;
  failurePoints: string[];
}
```

- [ ] **Step 4.2: Strip the matching fields from every entry in `commandNodes`**

For each object literal in the `commandNodes` array, delete the lines `x: ...,`, `y: ...,`, and `roadmapWidth: ...,`. Keep all other fields untouched.

(There are 17 entries. A regex pass is safe: search for `^\s*(x|y|roadmapWidth):.*,?\s*$` lines inside the array.)

- [ ] **Step 4.3: Remove the `CommandEdge` type and `commandEdges` export**

Delete the `CommandEdge` interface and the entire `export const commandEdges: CommandEdge[] = [...]` block at the bottom of the file.

- [ ] **Step 4.4: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: errors will appear from `components/CommandMap.tsx` (still imports `commandEdges`, still reads `node.x`/`node.y`/`node.roadmapWidth`). That is expected — they go away when CommandMap is deleted in Task 10. Note them and proceed.

- [ ] **Step 4.5: Commit**

```bash
git add data/commandMap.ts
git commit -m "refactor: drop spatial fields and edges from commandMap data"
```

---

## Task 5: StrategyChecklistItem component

**Files:**
- Create: `components/StrategyChecklistItem.tsx`

- [ ] **Step 5.1: Create the component**

```tsx
'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface Props {
  id: string;
  text: string;
  checked: boolean;
  onToggle: (id: string) => void;
}

export default function StrategyChecklistItem({ id, text, checked, onToggle }: Props) {
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(id)}
      whileTap={{ scale: 0.985 }}
      className={`strategy-row ${checked ? 'checked' : ''}`}
      aria-pressed={checked}
    >
      <span className="strategy-box" aria-hidden="true">
        {checked && <Icons.Check size={12} strokeWidth={2.4} />}
      </span>
      <span className="strategy-text">{text}</span>
    </motion.button>
  );
}
```

- [ ] **Step 5.2: Add styles to `app/globals.css`**

Append to the end of `app/globals.css`:

```css
/* Summit Climb — Strategy Checklist Item */
.strategy-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 8px;
  background: transparent;
  border: none;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.strategy-row:hover { background: rgba(0,0,0,0.03); }
.strategy-row:focus-visible { outline: 2px solid #0071E3; outline-offset: 2px; }

.strategy-box {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1.5px solid rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #fff;
  margin-top: 1px;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.strategy-row.checked .strategy-box {
  background: #0071E3;
  border-color: #0071E3;
}
.strategy-text {
  font-size: 13.5px;
  line-height: 1.55;
  color: #1D1D1F;
  transition: color 0.15s ease, opacity 0.15s ease;
}
.strategy-row.checked .strategy-text {
  color: #6E6E73;
  opacity: 0.78;
}
```

- [ ] **Step 5.3: Commit**

```bash
git add components/StrategyChecklistItem.tsx app/globals.css
git commit -m "feat: add StrategyChecklistItem with toggleable checkbox row"
```

---

## Task 6: MissionPanel component

**Files:**
- Create: `components/MissionPanel.tsx`

- [ ] **Step 6.1: Create the component**

```tsx
'use client';

import * as Icons from 'lucide-react';
import StrategyChecklistItem from './StrategyChecklistItem';
import { useLanguage } from '@/context/LanguageContext';
import { buildStrategyList } from '@/lib/strategyChecklist';
import type { CommandNode, CommandTarget } from '@/data/commandMap';
import type { PTEModule } from '@/types/pte';
import type { MasteryEntry } from '@/lib/summitMastery';

const categoryColors: Record<PTEModule['category'], string> = {
  speaking: '#FF375F',
  writing: '#0071E3',
  reading: '#30D158',
  listening: '#BF5AF2',
};

const tierTranslationKey = {
  focus: 'focusTier',
  active: 'activeTier',
  support: 'supportTier',
  low: 'lowYieldTier',
} as const;

interface Props {
  node: CommandNode;
  module?: PTEModule;
  target: CommandTarget;
  mastery: MasteryEntry | undefined;
  onToggle: (moduleId: string, strategyId: string) => void;
  onOpenDetail: (module: PTEModule) => void;
}

export default function MissionPanel({ node, module, target, mastery, onToggle, onOpenDetail }: Props) {
  const { language, t } = useLanguage();
  const items = module ? buildStrategyList(module, language) : [];
  const checked = new Set(mastery?.checked ?? []);
  const tier = node.priority[target];
  const accent = module ? categoryColors[module.category] : '#0071E3';

  const checkedCount = items.filter((item) => checked.has(item.id)).length;
  const percent = items.length === 0 ? 0 : Math.round((checkedCount / items.length) * 100);

  return (
    <aside className="mission-panel">
      <div className="mission-stripe" style={{ background: accent }} aria-hidden="true" />

      <header className="mission-header">
        <p className="mission-eyebrow">{t(tierTranslationKey[tier])}</p>
        <h2 className="mission-name">{node.label}</h2>
        <p className="mission-rationale">{node.rationale[target]}</p>
      </header>

      <div className="mission-stats">
        <span className="mission-stat">
          <span className="mission-stat-label">{t('dailyVolume')}</span>
          <span className="mission-stat-value">{node.dailyVolume[target]}</span>
        </span>
        <span className="mission-stat">
          <span className="mission-stat-label">{t('strategyChecklist')}</span>
          <span className="mission-stat-value">{checkedCount} / {items.length}</span>
        </span>
      </div>

      <div className="mission-progress" aria-hidden="true">
        <span style={{ width: `${percent}%`, background: accent }} />
      </div>

      <section className="mission-section">
        <h3 className="mission-section-title">{t('strategyChecklist')}</h3>
        <div className="mission-strategy-list">
          {items.length === 0 && <p className="mission-empty">—</p>}
          {items.map((item) => (
            <StrategyChecklistItem
              key={item.id}
              id={item.id}
              text={item.text}
              checked={checked.has(item.id)}
              onToggle={(id) => onToggle(node.id, id)}
            />
          ))}
        </div>
      </section>

      {node.failurePoints.length > 0 && (
        <section className="mission-section">
          <h3 className="mission-section-title">{t('failurePoints')}</h3>
          <ul className="mission-failure-list">
            {node.failurePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {module && (
        <button type="button" className="mission-detail-link" onClick={() => onOpenDetail(module)}>
          <Icons.ExternalLink size={14} strokeWidth={1.8} />
          {t('openFullStrategy')}
        </button>
      )}
    </aside>
  );
}
```

- [ ] **Step 6.2: Add styles to `app/globals.css`**

Append:

```css
/* Summit Climb — Mission Panel */
.mission-panel {
  position: relative;
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,0.06);
  padding: 24px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.mission-stripe {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}
.mission-eyebrow {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #A1A1A6;
}
.mission-name {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1D1D1F;
  margin: 4px 0 8px;
}
.mission-rationale {
  font-size: 13.5px;
  line-height: 1.55;
  color: #6E6E73;
}
.mission-stats {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.mission-stat { display: flex; flex-direction: column; gap: 2px; }
.mission-stat-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #A1A1A6;
  font-weight: 600;
}
.mission-stat-value {
  font-size: 13px;
  color: #1D1D1F;
  font-weight: 500;
}
.mission-progress {
  height: 4px;
  border-radius: 999px;
  background: rgba(0,0,0,0.05);
  overflow: hidden;
}
.mission-progress > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease;
}
.mission-section { display: flex; flex-direction: column; gap: 6px; }
.mission-section-title {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #A1A1A6;
  margin-bottom: 4px;
}
.mission-strategy-list { display: flex; flex-direction: column; gap: 1px; }
.mission-failure-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
  color: #6E6E73;
  line-height: 1.55;
}
.mission-detail-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 12.5px;
  color: #0071E3;
  background: transparent;
  border: none;
  padding: 6px 0;
  cursor: pointer;
}
.mission-detail-link:hover { text-decoration: underline; }
.mission-empty { font-size: 13px; color: #A1A1A6; }
```

- [ ] **Step 6.3: Commit**

```bash
git add components/MissionPanel.tsx app/globals.css
git commit -m "feat: add MissionPanel with strategy checklist and stats"
```

---

## Task 7: SummitOnboarding component

**Files:**
- Create: `components/SummitOnboarding.tsx`

- [ ] **Step 7.1: Create the component**

```tsx
'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { targetProfiles } from '@/data/commandMap';
import type { CommandTarget } from '@/data/commandMap';

interface Props {
  onPick: (target: CommandTarget) => void;
}

export default function SummitOnboarding({ onPick }: Props) {
  const { t } = useLanguage();
  const targets: CommandTarget[] = ['seven', 'eight'];
  const titleKey: Record<CommandTarget, 'target7Title' | 'target8Title'> = {
    seven: 'target7Title',
    eight: 'target8Title',
  };
  const subtitleKey: Record<CommandTarget, 'target7Subtitle' | 'target8Subtitle'> = {
    seven: 'target7Subtitle',
    eight: 'target8Subtitle',
  };

  return (
    <motion.div
      key="onboarding"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="summit-onboarding"
    >
      <header className="summit-onboarding-head">
        <Icons.Mountain size={28} strokeWidth={1.6} color="#0071E3" />
        <h1>{t('pickTargetTitle')}</h1>
        <p>{t('pickTargetSubtitle')}</p>
      </header>

      <div className="summit-onboarding-cards">
        {targets.map((target) => {
          const profile = targetProfiles[target];
          return (
            <motion.button
              key={target}
              type="button"
              onClick={() => onPick(target)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              className="summit-target-card"
            >
              <span className="summit-target-label">{profile.label}</span>
              <span className="summit-target-title">{t(titleKey[target])}</span>
              <span className="summit-target-subtitle">{t(subtitleKey[target])}</span>
              <span className="summit-target-scores">
                {profile.scores.map((score) => (
                  <span key={score.skill} className="summit-target-score">
                    <span>{score.skill}</span>
                    <strong>{score.value}</strong>
                  </span>
                ))}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 7.2: Add styles to `app/globals.css`**

Append:

```css
/* Summit Climb — Onboarding */
.summit-onboarding {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 36px;
  padding: 60px 40px;
}
.summit-onboarding-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}
.summit-onboarding-head h1 {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1D1D1F;
}
.summit-onboarding-head p {
  font-size: 15px;
  color: #6E6E73;
}
.summit-onboarding-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 720px;
}
.summit-target-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.summit-target-card:hover {
  border-color: rgba(0,113,227,0.5);
  box-shadow: 0 6px 24px rgba(0,0,0,0.06);
}
.summit-target-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #A1A1A6;
}
.summit-target-title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #1D1D1F;
}
.summit-target-subtitle {
  font-size: 13px;
  line-height: 1.5;
  color: #6E6E73;
}
.summit-target-scores {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.summit-target-score {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  background: rgba(0,0,0,0.04);
  border-radius: 999px;
  font-size: 11px;
  color: #1D1D1F;
}
.summit-target-score strong { font-weight: 600; }
```

- [ ] **Step 7.3: Commit**

```bash
git add components/SummitOnboarding.tsx app/globals.css
git commit -m "feat: add SummitOnboarding target picker"
```

---

## Task 8: SummitClimb component (orchestrator)

This is the largest component. It owns mastery state hydration, target switching, checkpoint layout, the SVG path, the side trail, and integrates the MissionPanel and SummitOnboarding.

**Files:**
- Create: `components/SummitClimb.tsx`

- [ ] **Step 8.1: Create the component**

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { commandNodes, targetProfiles, type CommandNode, type CommandTarget } from '@/data/commandMap';
import { useLanguage } from '@/context/LanguageContext';
import { buildStrategyList } from '@/lib/strategyChecklist';
import {
  createInitialState,
  loadState,
  saveState,
  setTarget,
  toggleStrategy,
  getModuleCompletion,
  getNextFocus,
  getTotalMastery,
  type SummitMasteryState,
} from '@/lib/summitMastery';
import type { PTEModule } from '@/types/pte';
import MissionPanel from './MissionPanel';
import SummitOnboarding from './SummitOnboarding';

const categoryColors: Record<PTEModule['category'], string> = {
  speaking: '#FF375F',
  writing: '#0071E3',
  reading: '#30D158',
  listening: '#BF5AF2',
};

interface Props {
  modules: PTEModule[];
  onOpenModule: (module: PTEModule) => void;
}

interface Layout {
  main: { node: CommandNode; x: number; y: number; index: number }[];
  side: { node: CommandNode; x: number; y: number }[];
}

function computeLayout(target: CommandTarget): Layout {
  const main: Layout['main'] = [];
  const side: Layout['side'] = [];

  const ordered = [...commandNodes].sort((a, b) => priorityRank(a, target) - priorityRank(b, target));

  const mainList = ordered.filter((n) => n.priority[target] !== 'low');
  const sideList = ordered.filter((n) => n.priority[target] === 'low');

  const yMin = 14;
  const yMax = 86;
  const totalSteps = Math.max(mainList.length - 1, 1);

  mainList.forEach((node, index) => {
    const y = yMin + (index / totalSteps) * (yMax - yMin);
    const x = 50 + Math.sin(index * 0.95) * 18;
    main.push({ node, x, y, index });
  });

  sideList.forEach((node, index) => {
    const x = 80 + (index % 2 === 0 ? -6 : 6);
    const y = 88 + Math.floor(index / 2) * 5;
    side.push({ node, x, y });
  });

  return { main, side };
}

function priorityRank(node: CommandNode, target: CommandTarget): number {
  const order = { focus: 0, active: 1, support: 2, low: 3 } as const;
  const tier = order[node.priority[target]];
  const route = targetProfiles[target].route;
  const inRoute = route.indexOf(node.id);
  const support = targetProfiles[target].support;
  const inSupport = support.indexOf(node.id);
  // Within tier, sort by route order, then support order, then label.
  const seq = inRoute >= 0 ? inRoute : inSupport >= 0 ? 100 + inSupport : 200;
  return tier * 1000 + seq;
}

function buildPathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  const segments: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cy = (prev.y + cur.y) / 2;
    segments.push(`C ${prev.x} ${cy}, ${cur.x} ${cy}, ${cur.x} ${cur.y}`);
  }
  return segments.join(' ');
}

export default function SummitClimb({ modules, onOpenModule }: Props) {
  const { t, language } = useLanguage();
  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const [state, setState] = useState<SummitMasteryState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<'onboarding' | 'climbing'>('climbing');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Hydrate from localStorage after mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('pte-summit-mastery-v1');
    if (stored) {
      setState(loadState());
      setPhase('climbing');
    } else {
      setPhase('onboarding');
    }
    setHydrated(true);
  }, []);

  // Persist on every state change after hydration.
  useEffect(() => {
    if (hydrated && phase === 'climbing') saveState(state);
  }, [state, hydrated, phase]);

  const target = state.target;
  const layout = useMemo(() => computeLayout(target), [target]);

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of commandNodes) {
      const module = moduleMap.get(node.id);
      const items = module ? buildStrategyList(module, language) : [];
      map.set(node.id, items.length);
    }
    return map;
  }, [moduleMap, language]);

  const climbModuleIds = useMemo(() => commandNodes.map((n) => n.id), []);
  const priorityOrder = useMemo(() => {
    return [...commandNodes].sort((a, b) => priorityRank(a, target) - priorityRank(b, target)).map((n) => n.id);
  }, [target]);

  const nextFocus = useMemo(() => getNextFocus(state, priorityOrder, totals), [state, priorityOrder, totals]);
  const totalMastery = useMemo(() => getTotalMastery(state, climbModuleIds, totals), [state, climbModuleIds, totals]);

  // Default selected node: nextFocus on first climb render, sticky thereafter.
  useEffect(() => {
    if (phase === 'climbing' && !selectedId) {
      setSelectedId(nextFocus.moduleId ?? layout.main[0]?.node.id ?? null);
    }
  }, [phase, selectedId, nextFocus.moduleId, layout.main]);

  if (!hydrated) {
    // Avoid flashing onboarding before hydration when target is already set.
    return <div className="summit-loading" aria-hidden="true" />;
  }

  if (phase === 'onboarding') {
    return (
      <SummitOnboarding
        onPick={(t) => {
          const next = { ...state, target: t };
          setState(next);
          saveState(next);
          setPhase('climbing');
        }}
      />
    );
  }

  const selectedNode = commandNodes.find((n) => n.id === selectedId) ?? commandNodes[0];
  const selectedModule = moduleMap.get(selectedNode.id);
  const profile = targetProfiles[target];

  const allPoints = [{ x: 50, y: 8 }, ...layout.main.map((p) => ({ x: p.x, y: p.y })), { x: 50, y: 92 }];
  const pathD = buildPathD(allPoints);

  return (
    <div className="summit-climb">
      <section className="summit-canvas-wrap">
        <header className="summit-banner">
          <div className="summit-target-row">
            <span className="summit-eyebrow">{t('summitTitle')}</span>
            <div className="summit-switch" role="tablist" aria-label="Target">
              {(['seven', 'eight'] as CommandTarget[]).map((tg) => (
                <button
                  key={tg}
                  type="button"
                  role="tab"
                  aria-selected={target === tg}
                  onClick={() => setState((current) => setTarget(current, tg))}
                  className={target === tg ? 'on' : ''}
                >
                  {targetProfiles[tg].label}
                </button>
              ))}
            </div>
          </div>
          <div className="summit-scores">
            {profile.scores.map((s) => (
              <span key={s.skill}>
                <span>{s.skill}</span>
                <strong>{s.value}</strong>
              </span>
            ))}
          </div>
          <p className="summit-coach">
            {nextFocus.moduleId
              ? `${t('nextFocus')} → ${commandNodes.find((n) => n.id === nextFocus.moduleId)?.label} (${nextFocus.remaining} ${t('strategiesRemaining')})`
              : t('routeMastered')}
          </p>
        </header>

        <div className="summit-canvas">
          <svg className="summit-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={pathD} className="summit-path" fill="none" stroke="#1D1D1F" strokeWidth="0.4" />
            {layout.side.length > 0 && (
              <path
                d={`M 50 86 C 65 86, 75 86, 80 88`}
                className="summit-side-path"
                fill="none"
                stroke="rgba(0,0,0,0.18)"
                strokeWidth="0.3"
                strokeDasharray="1 1.4"
              />
            )}
          </svg>

          <div className="summit-peak" style={{ top: '4%' }}>
            <span className="summit-peak-pin" />
            <span className="summit-peak-label">{profile.label}</span>
          </div>

          {layout.main.map(({ node, x, y }) => {
            const completion = getModuleCompletion(state, node.id, totals.get(node.id) ?? 0);
            const isSelected = selectedId === node.id;
            const isNext = nextFocus.moduleId === node.id;
            const module = moduleMap.get(node.id);
            const accent = module ? categoryColors[module.category] : '#0071E3';
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                className={[
                  'summit-checkpoint',
                  isSelected ? 'selected' : '',
                  isNext ? 'next' : '',
                  completion.percent === 100 ? 'mastered' : '',
                ].join(' ')}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  ['--accent' as string]: accent,
                  ['--ring' as string]: `${completion.percent}%`,
                }}
                aria-label={`${node.label} ${completion.percent}%`}
              >
                <span className="checkpoint-ring" aria-hidden="true" />
                <span className="checkpoint-dot" aria-hidden="true">
                  {completion.percent === 100 && <Icons.Flag size={11} strokeWidth={2.4} />}
                </span>
                <span className="checkpoint-label">{node.label}</span>
              </button>
            );
          })}

          {layout.side.map(({ node, x, y }) => {
            const completion = getModuleCompletion(state, node.id, totals.get(node.id) ?? 0);
            const isSelected = selectedId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                className={`summit-side-node ${isSelected ? 'selected' : ''} ${completion.percent === 100 ? 'mastered' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={`${node.label} (${t('lowYieldTier')})`}
              >
                <span>{node.label}</span>
              </button>
            );
          })}
        </div>

        <footer className="summit-base-camp">
          <span className="summit-base-text">
            {totalMastery.masteredCount} / {totalMastery.totalModules} {t('baseCampMastered')} · {totalMastery.pointsChecked} / {totalMastery.pointsTotal} {t('baseCampPoints')}
          </span>
          {layout.side.length > 0 && (
            <span className="summit-base-side">{t('lowYieldTier')}</span>
          )}
        </footer>
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="summit-mission-wrap"
        >
          <MissionPanel
            node={selectedNode}
            module={selectedModule}
            target={target}
            mastery={state.mastery[selectedNode.id]}
            onToggle={(moduleId, strategyId) =>
              setState((current) => toggleStrategy(current, moduleId, strategyId))
            }
            onOpenDetail={onOpenModule}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 8.2: Add styles to `app/globals.css`**

Append:

```css
/* Summit Climb — Layout */
.summit-climb {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 28px;
  padding: 28px 32px 40px;
  align-items: start;
  min-height: calc(100vh - 0px);
}
.summit-loading { min-height: 70vh; }

/* Left column */
.summit-canvas-wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #fff;
  border-radius: 22px;
  border: 1px solid rgba(0,0,0,0.06);
  padding: 22px 22px 18px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  min-height: 720px;
}
.summit-banner { display: flex; flex-direction: column; gap: 10px; }
.summit-target-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.summit-eyebrow {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #A1A1A6;
}
.summit-switch {
  display: inline-flex;
  background: rgba(0,0,0,0.05);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}
.summit-switch button {
  font-size: 12px;
  padding: 5px 12px;
  border: none;
  background: transparent;
  border-radius: 999px;
  color: #6E6E73;
  font-weight: 600;
  cursor: pointer;
}
.summit-switch button.on {
  background: #1D1D1F;
  color: #fff;
}
.summit-scores {
  display: flex;
  gap: 6px;
}
.summit-scores span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0,0,0,0.04);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  color: #1D1D1F;
}
.summit-scores strong { font-weight: 600; }
.summit-coach {
  font-size: 13px;
  color: #6E6E73;
}

/* Canvas */
.summit-canvas {
  position: relative;
  flex: 1;
  min-height: 540px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(0,113,227,0.04) 0%, rgba(0,0,0,0) 60%);
  overflow: hidden;
}
.summit-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.summit-path { stroke: rgba(29,29,31,0.45); }
.summit-peak {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.summit-peak-pin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #1D1D1F;
  box-shadow: 0 0 0 4px rgba(29,29,31,0.08);
}
.summit-peak-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #1D1D1F;
}

/* Checkpoint */
.summit-checkpoint {
  position: absolute;
  transform: translate(-50%, -50%);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 999px;
  padding: 6px 12px 6px 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: #1D1D1F;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition:
    left 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    top 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
  .summit-checkpoint { transition: none; }
}
.summit-checkpoint:hover { transform: translate(-50%, calc(-50% - 2px)); }
.summit-checkpoint.selected { box-shadow: 0 0 0 3px rgba(0,113,227,0.18), 0 1px 4px rgba(0,0,0,0.05); }
.summit-checkpoint.next::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
  animation: summit-pulse 1.6s ease-out infinite;
}
@keyframes summit-pulse {
  0% { transform: scale(0.92); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .summit-checkpoint.next::before {
    animation: none;
    opacity: 0.6;
  }
}
.checkpoint-ring {
  position: relative;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background:
    conic-gradient(var(--accent) var(--ring), rgba(0,0,0,0.08) var(--ring) 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.checkpoint-ring::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: #fff;
}
.checkpoint-dot {
  position: relative;
  z-index: 1;
  width: 8px;
  height: 8px;
  margin-left: -12px;
  border-radius: 50%;
  background: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.summit-checkpoint.mastered .checkpoint-dot {
  width: 16px;
  height: 16px;
  margin-left: -16px;
}
.summit-checkpoint.mastered .checkpoint-ring { display: none; }

/* Side trail */
.summit-side-node {
  position: absolute;
  transform: translate(-50%, -50%);
  background: transparent;
  border: 1px dashed rgba(0,0,0,0.18);
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 10.5px;
  color: #A1A1A6;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition:
    left 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    top 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.15s ease,
    border-color 0.15s ease;
}
@media (prefers-reduced-motion: reduce) {
  .summit-side-node { transition: none; }
}
.summit-side-node:hover { color: #6E6E73; border-color: rgba(0,0,0,0.3); }
.summit-side-node.selected { background: rgba(0,113,227,0.06); border-color: rgba(0,113,227,0.4); color: #0071E3; }
.summit-side-node.mastered { color: #6E6E73; border-style: solid; }

/* Base camp */
.summit-base-camp {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: #A1A1A6;
  letter-spacing: 0.02em;
  padding: 4px 6px;
}
.summit-base-side {
  font-style: italic;
  font-size: 10.5px;
}

/* Right column */
.summit-mission-wrap { position: sticky; top: 28px; }

/* Mobile */
@media (max-width: 900px) {
  .summit-climb {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }
  .summit-canvas-wrap { min-height: 560px; }
  .summit-canvas { min-height: 440px; }
  .summit-mission-wrap { position: static; }
}
```

- [ ] **Step 8.3: Commit**

```bash
git add components/SummitClimb.tsx app/globals.css
git commit -m "feat: add SummitClimb orchestrator with vertical climb layout"
```

---

## Task 9: Wire SummitClimb into the page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 9.1: Replace the import**

In `app/page.tsx`, change:

```ts
import CommandMap from '@/components/CommandMap';
```

to:

```ts
import SummitClimb from '@/components/SummitClimb';
```

- [ ] **Step 9.2: Replace the empty-state render**

Find the block:

```tsx
{viewState.type === 'empty' && (
  <motion.div
    key="empty"
    initial={{ opacity: 0, y: 12, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8 }}
    transition={smooth}
    className="command-map-view"
  >
    <CommandMap modules={allModules} onOpenModule={handleModuleClick} />
  </motion.div>
)}
```

Replace it with:

```tsx
{viewState.type === 'empty' && (
  <motion.div
    key="empty"
    initial={{ opacity: 0, y: 12, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8 }}
    transition={smooth}
    className="command-map-view"
  >
    <SummitClimb modules={allModules} onOpenModule={handleModuleClick} />
  </motion.div>
)}
```

- [ ] **Step 9.3: Verify the dev server runs**

Run: `npm run dev`. Open the resulting URL. Confirm:

1. First load shows the onboarding picker (clear localStorage in DevTools first if state already exists: `localStorage.removeItem('pte-summit-mastery-v1')`).
2. Click `8炸` — climb appears.
3. Click any checkpoint — Mission Panel updates.
4. Tick a strategy item — its row checks; the checkpoint ring fills; Base Camp counter increases.
5. Switch target — chips animate, layout adjusts, mastery is preserved.

Expected output (none of these should be true):
- React hydration error in the browser console.
- "Cannot find module '@/components/CommandMap'" error (still present until Task 10).

Stop the dev server.

- [ ] **Step 9.4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: render SummitClimb in the All Modules view"
```

---

## Task 10: Remove the legacy Command Map

**Files:**
- Delete: `components/CommandMap.tsx`
- Delete: `lib/commandMapLogic.ts`
- Delete: `lib/commandMapLogic.test.ts`

- [ ] **Step 10.1: Verify nothing else imports the legacy module**

Run: `grep -rn "CommandMap\b\|commandMapLogic\|commandEdges\|CommandEdge\|focusRoutes" app components lib data --include="*.ts" --include="*.tsx"`

Expected output (after replacement is wired):
- Zero references to `CommandMap`, `commandMapLogic`, `commandEdges`, `CommandEdge`, or `focusRoutes` outside the soon-to-be-deleted files.

If any references remain (e.g. in `app/globals.css` for unrelated CSS, that's fine — only TS imports matter), fix them before deleting.

- [ ] **Step 10.2: Delete the files**

```bash
rm components/CommandMap.tsx lib/commandMapLogic.ts lib/commandMapLogic.test.ts
```

- [ ] **Step 10.3: Run TypeScript and lint**

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

Run: `npm run lint`
Expected: PASS — no errors.

- [ ] **Step 10.4: Run all tests**

Run: `node --test lib/strategyChecklist.test.ts lib/summitMastery.test.ts`
Expected: PASS — 15 tests across both files.

- [ ] **Step 10.5: Commit**

```bash
git add -A
git commit -m "chore: remove legacy CommandMap component and logic"
```

---

## Task 11: Final verification

- [ ] **Step 11.1: Run lint, typecheck, and tests in one pass**

Run: `npm run lint && npx tsc --noEmit && node --test lib/strategyChecklist.test.ts lib/summitMastery.test.ts`
Expected: all green.

- [ ] **Step 11.2: Run the production build**

Run: `npm run build`
Expected: build succeeds with no errors. Warnings about unused CSS or ARIA attributes can be triaged but should not block.

- [ ] **Step 11.3: Manual browser verification**

Run: `npm run dev`. Open the page in a browser and step through the spec's "Testing Expectations":

1. Clear localStorage. Reload. Onboarding picker appears.
2. Pick `7炸`. Climb appears with the 7炸 priority order. localStorage now has `pte-summit-mastery-v1` with `target: 'seven'`.
3. Reload. Climb skips the picker.
4. Click multiple checkpoints — Mission Panel reflects each one, including failure points and daily volume.
5. Tick all strategy items in one module — checkpoint shows the flag; Base Camp counter increments by 1; Mission Panel progress hits 100%.
6. Untick one — checkpoint loses the flag; counters revert.
7. Switch to `8炸`. Layout re-animates, side-trail membership recomputes, score chips update. Strategy state for the previously-mastered module is preserved.
8. Click a side-trail node (e.g. `ASQ` or `MCM`). Mission Panel still loads; node is never the next-focus recommendation.
9. Use Tab to navigate among checkpoints; Enter to select; arrow keys do not cause unexpected jumps. Confirm focus rings render.
10. Toggle the language switch in the sidebar to `中`. Banner, panel, and base camp text translate. Strategy items also display in Chinese where `contentZh` is present; checked state persists across language changes.
11. Resize the window below 900px. The layout collapses to a single column with the climb above and Mission Panel below; nothing overlaps; no horizontal scroll.
12. In macOS / browser dev tools, enable `prefers-reduced-motion: reduce`. Reload. Confirm the next-focus pulse no longer animates and onboarding does not slide.

Stop the dev server.

- [ ] **Step 11.4: Final commit if anything was tweaked during manual verification**

If any small fix was applied, commit it here. Otherwise skip.

```bash
git status
# If clean, no commit needed.
```

- [ ] **Step 11.5: Mark plan complete**

Implementation complete. The Summit Climb is live in `All Modules`. Categories pages and module detail pages are unchanged. Visual polish via the `frontend-design` skill is the next planned step (out of scope here).
