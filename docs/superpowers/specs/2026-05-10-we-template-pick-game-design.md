# WE Template Pick Game — Design

**Date:** 2026-05-10
**Module target:** `essay` (PTE Writing — Write Essay)
**Status:** Approved by user, awaiting written-spec review

## Goal

Train PTE candidates to recognize essay prompt type and pick the structurally
correct template. Misjudging prompt type is one of the top causes of WE score
drops; a fast pattern-recognition drill is the highest-leverage micro-game for
this module.

## Behavior

A small interactive drill that lives inside the `essay` MissionPanel, mirroring
the existing WFD / RS / FIB games:

1. Entry card with a single Start button (text differs based on whether the
   user previously passed).
2. On start, present 3 challenges sequentially. Each challenge shows:
   - One PTE-style essay prompt (English).
   - Two candidate template cards (A and B) stacked vertically, each labeled
     with its frame name and 4 short structural lines.
3. User taps one template, then submits.
4. After submit:
   - Reveal correct vs. wrong (border color, like WFD's correct/incorrect
     state).
   - Show a bilingual explanation of why the correct template fits.
   - If wrong → Try Again resets selection for the same challenge.
   - If correct → Next moves to the next challenge.
5. After challenge 3 finishes correctly → Completion screen.
6. Pass logic mirrors `WfdSpotRepairGame`: `onLatestResult(false)` is fired on
   any wrong submit; `onLatestResult(true)` only when the last challenge is
   correct at finish time. The latest result is what `summitMastery.ts` reads.

## Visual & layout

- Reuse the existing `wfd-game-*` CSS scaffolding (`wfd-game-entry`,
  `wfd-game-card`, `wfd-game-header`, `wfd-game-progress`, `wfd-game-meter`,
  `wfd-game-helper`, `wfd-game-primary`, `wfd-game-secondary`,
  `wfd-game-result`). New CSS only for the template cards (selected /
  correct / wrong states) — added to `app/globals.css` if needed.
- Templates are stacked, not side-by-side, because the MissionPanel is narrow.

## Data model — `lib/weTemplatePick.ts`

```ts
export interface WeTemplate {
  id: 'a' | 'b';
  label: string;            // e.g. "Discuss Both Views"
  lines: string[];          // exactly 4 lines: intro / body 1 / body 2 / conclusion
}

export interface WeTemplateChallenge {
  id: string;
  prompt: string;                                // PTE prompt, English only
  templates: [WeTemplate, WeTemplate];
  correctTemplateId: 'a' | 'b';
  explanation: { en: string; zh: string };       // bilingual teaching note
}

export const weTemplatePickChallenges: WeTemplateChallenge[];
```

### Challenge plan (3 items)

| # | Prompt type                                         | Template A                | Template B                | Correct |
|---|-----------------------------------------------------|---------------------------|---------------------------|---------|
| 1 | "Discuss both views and give your opinion"          | Discuss Both Views        | Agree / Disagree          | A       |
| 2 | "To what extent do you agree or disagree?"          | Discuss Both Views        | Agree / Disagree          | B       |
| 3 | "Do the advantages outweigh the disadvantages?"     | Single-side Argument      | Advantage vs. Disadvantage| B       |

Templates 1A, 2A and 1B, 2B share copy (same frame), so `lib/weTemplatePick.ts`
defines the four template frames once and references them from challenges.

## Component — `components/WeTemplatePickGame.tsx`

State (mirrors WfdSpotRepairGame):

```ts
const [started, setStarted] = useState(false);
const [challengeIndex, setChallengeIndex] = useState(0);
const [pickedTemplateId, setPickedTemplateId] = useState<'a' | 'b' | null>(null);
const [submitted, setSubmitted] = useState(false);
const [completed, setCompleted] = useState(false);
```

Props (identical to existing games):

```ts
interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}
```

Submit logic:

```ts
const isCorrect = submitted && pickedTemplateId === challenge.correctTemplateId;
```

Same `handleSubmit` / `handleNext` / `resetRound` flow as WFD.

## Translations — `data/translations.ts`

New keys (both `en` and `zh`):

- `weGameStart`, `weGameStartAgain`
- `weGameEyebrow`, `weGameTitle`
- `weGameRulePick` (instruction line)
- `weGameSubmit`, `weGameTryAgain`, `weGameNext`, `weGameFinish`
- `weGameCorrectTitle`, `weGameIncorrectTitle`
- `weGameCorrectHint`, `weGameIncorrectHint`, `weGamePickHint`
- `weGameCompleteTitle`, `weGameCompleteBody`
- `weGamePromptLabel` (small label above prompt, e.g. "Prompt")
- `weGameTemplateLabel` (small label above each template)

## Integration

1. **`components/MissionPanel.tsx`** — add the new game block beside the
   existing WFD / RS / FIB blocks, conditional on `node.id === 'essay'`.
2. **`lib/summitMastery.ts`** — extend `moduleRequiresGame` to include
   `'essay'`. This means the summit ring for essay needs both the strategy
   checklist and a passing game run, consistent with WFD/RS/FIB.

No storage schema change required: `state.gameResults['<target>:essay']`
already works under the existing `pte-summit-mastery-v2` schema.

## Tests — `lib/weTemplatePick.test.ts`

Unit tests for the lib only (component behavior is covered manually, like the
other games):

1. `weTemplatePickChallenges` has exactly 3 entries.
2. Each challenge has 2 templates with distinct ids `'a'` and `'b'`.
3. Each challenge's `correctTemplateId` matches one of the template ids.
4. Each template has exactly 4 lines.
5. `explanation` has both `en` and `zh` non-empty for every challenge.

## Out of scope

- No timer.
- No score / rating beyond pass/fail (matches WFD).
- No randomization of challenge order (deterministic, matches WFD).
- No new SummitClimb behavior — essay just joins the existing
  `moduleRequiresGame` cohort.

## Risks

- Adding `'essay'` to `moduleRequiresGame` means existing users (post-v2 reset)
  who completed the essay strategy checklist before this change will now see
  essay drop from 100% to ~83% until they pass the new game. Acceptable — the
  v2 reset already happened and the new game is the gating mechanism.
