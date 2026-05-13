# RA AI Mirror — Design

**Date:** 2026-05-13
**Module target:** `ra` (PTE Speaking — Read Aloud)
**Status:** Draft, awaiting written-spec review

## Goal

Add the project's first AI-powered feature: a one-shot AI scoring mini-game
inside the Read Aloud module. The user reads a short PTE-style **single
sentence** (10–20 words) aloud; the browser transcribes it locally via Web
Speech; one LLM call returns a structured score; the original sentence
re-renders with per-word coloring (read correctly / missed / mispronounced)
plus a one-line Chinese comment.

This is a **portfolio MVP**. Its job is to be the smallest demoable AI
integration that visibly fuses Web Speech + LLM + structured JSON + frontend
visualization. Streaming, waveforms, heatmaps, AI-pronounced playback,
transcript-vs-original diff view, full-paragraph mode, and bilingual output
are deferred to v2.

## Non-goals (MVP)

- **No mastery gating.** The AI mirror does NOT affect Summit progression.
  Avoids breaking the offline / no-API-key flow.
- No streaming output (single JSON response).
- No waveform / spectrum animation.
- No diff view between original and transcript ("PTE 阅卷镜" packaging is v2).
- No TTS playback of correct pronunciation.
- No history / progress tracking across sessions beyond a `localStorage`
  sentence-index pointer.
- No AI sentence generation; the sentence library is hardcoded.
- AI comment is **Chinese-only** regardless of the UI language toggle.
- Sentences are **English-only**.

## Behavior

1. **Entry card** inside the `ra` MissionPanel, beside the existing strategy
   checklist. Single Start button.
2. On start, present 1 challenge per session (no streak):
   - Show one PTE-style English sentence (10–20 words).
   - Show a 🎙 record button + a 1-line instruction.
3. User taps record:
   - Browser microphone permission prompt (first time per origin only).
   - SpeechRecognition starts (`continuous=false`, `interimResults=false`,
     `lang='en-US'`); the button switches to "停止录音".
   - Tapping stop ends recording. Recognition also auto-ends after silence
     because `continuous=false`.
4. On stop:
   - The raw transcript appears below the original sentence (unstyled).
   - Loading spinner: "AI 正在评分…"
   - One POST to `/api/ra-mirror` with `{ original, transcript }`.
5. On API success, replace the transcript area with:
   - The **original sentence**, rendered word-by-word, each token colored:
     - 🟢 green = `hits` (read correctly)
     - 🔴 red = `missed` (skipped from original)
     - 🟡 yellow = `mispronounced` (read but pronunciation likely off)
     - default gray = neutral filler not classified by the LLM
   - A score chip (0–90 integer) on the right.
   - One-line Chinese comment underneath, ~20–40 characters.
   - "再来一句" button → advances `sentenceIndex` (round-robin) and resets to
     step 2 with the next sentence.
6. Errors collapse to one of two friendly states:
   - "你的浏览器不支持本地语音识别，请用 Chrome / Edge / Safari 打开" — when
     `window.SpeechRecognition` and `window.webkitSpeechRecognition` are both
     undefined.
   - "AI 评分服务暂不可用，请稍后再试" — for API failure, missing key,
     malformed response, or network error.

## Visual & layout

Reuse the existing `wfd-game-*` CSS scaffolding (`wfd-game-entry`,
`wfd-game-card`, `wfd-game-header`, `wfd-game-primary`, `wfd-game-secondary`,
`wfd-game-result`) for visual consistency with the other mini-games.

New CSS only for:

- `.ra-mirror-sentence` — flex-wrap container for word tokens, gap.
- `.ra-mirror-token` + modifiers `--hit` / `--missed` / `--mispronounced` /
  `--neutral` — pill-style backgrounds with tinted text. Match the
  green / red / yellow palette already used for priority dots
  (`#30D158`, `#FF375F`, `#FF9F0A`).
- `.ra-mirror-score` — round chip showing the integer score, tinted by score
  band (≥80 green, ≥60 yellow, else red).
- `.ra-mirror-comment` — Chinese comment block with a small AI icon prefix
  (`Sparkles` from `lucide-react`).

Added to `app/globals.css`.

## Sentence library — `lib/raAiMirror.ts`

```ts
export interface RaSentence {
  id: string;     // e.g. 'ra-1'
  text: string;   // 10-20 words, PTE-style academic English
}

export const raSentences: RaSentence[]; // hardcoded, 8-10 entries
```

Sentence selection: round-robin via `sentenceIndex` state in the component,
persisted under `localStorage` key `'pte-ra-mirror-sentence-index'` so demos
progress across reloads.

Score shape returned from the API and consumed by the component:

```ts
export interface RaMirrorScore {
  score: number;            // 0-90 integer
  hits: string[];
  missed: string[];
  mispronounced: string[];
  comment: string;          // single Chinese sentence
}
```

A small pure helper for token comparison (used by the component for
classifying tokens not returned by the LLM, AND for unit testing):

```ts
export function tokenize(sentence: string): string[];
// lowercase, strip punctuation, split on whitespace
```

## Component — `components/RaAiMirrorGame.tsx`

State:

```ts
const [started, setStarted] = useState(false);
const [phase, setPhase] = useState<'idle' | 'recording' | 'scoring' | 'result' | 'error'>('idle');
const [transcript, setTranscript] = useState<string>('');
const [score, setScore] = useState<RaMirrorScore | null>(null);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const [sentenceIndex, setSentenceIndex] = useState<number>(/* read from localStorage, default 0 */);
const recognitionRef = useRef<SpeechRecognition | null>(null);
```

Props (consistent with the existing game components):

```ts
interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}
```

`onLatestResult` is called with `score >= 60` after a result returns. Even
though this MVP does NOT gate Summit progression (see Non-goals), we still
call it so the result is captured under
`gameResults['<target>:ra']` for future use without a schema change.

Web Speech setup outline:

```ts
const SpeechRecognitionCtor =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

if (!SpeechRecognitionCtor) {
  setPhase('error');
  setErrorMessage(t('raMirrorNoSpeech'));
  return;
}

const recognition = new SpeechRecognitionCtor();
recognition.lang = 'en-US';
recognition.continuous = false;
recognition.interimResults = false;
recognition.onresult = (e) => setTranscript(e.results[0][0].transcript);
recognition.onerror = () => { setPhase('error'); setErrorMessage(t('raMirrorAiFailed')); };
recognition.onend = () => { /* if transcript captured, kick off scoring */ };
```

## API route — `app/api/ra-mirror/route.ts`

Next.js 15 route handler (App Router). Calls the **MiniMax** chat-completion
API with model **`MiniMax-M2.7`** (exact model-id string to be confirmed
against MiniMax's current docs during implementation).

Implementation uses **native `fetch`** to MiniMax's HTTPS endpoint rather
than an SDK — keeps dependencies minimal and avoids SDK-version drift, given
MiniMax's OpenAI-compatible request/response shape.

Env vars (loaded from `.env.local`):

- `MINIMAX_API_KEY` — required.
- `MINIMAX_GROUP_ID` — required only if MiniMax's current endpoint still
  takes a `GroupId` query parameter. Implementation phase confirms.

> **Note 1:** Per `AGENTS.md`, this Next.js version may have non-standard
> conventions. Implementation phase MUST consult
> `node_modules/next/dist/docs/` for the current route-handler signature
> before writing the route.
>
> **Note 2:** Implementation phase MUST consult MiniMax's current public
> docs (https://platform.minimaxi.com/ or equivalent) to confirm:
> (a) the exact M2.7 model-id string,
> (b) whether `GroupId` query param is still required,
> (c) whether OpenAI-style `tool_choice` or a `response_format: 'json'`
> field is supported for forcing structured JSON output. If neither is
> available, fall back to an in-prompt JSON-only instruction plus strict
> response validation.

Request body:

```ts
{ original: string; transcript: string }
```

Response body (success):

```ts
{
  score: number;            // 0-90 integer
  hits: string[];           // lowercase tokens from original read correctly
  missed: string[];         // lowercase tokens from original skipped
  mispronounced: string[];  // lowercase tokens from original with pronunciation off
  comment: string;          // single Chinese sentence, ~20-40 chars
}
```

Response body (failure): `{ error: 'NO_API_KEY' | 'AI_FAILED' | 'BAD_REQUEST' }`
with HTTP 400 (BAD_REQUEST) or 500 (others).

Implementation outline:

- Validate body shape (both fields are non-empty strings, each ≤ 500 chars).
  Return 400 `BAD_REQUEST` on failure.
- If `process.env.MINIMAX_API_KEY` is missing, return 500 `NO_API_KEY`.
- POST to MiniMax chat-completion endpoint with the system + user prompts
  below. Force structured output by whichever mechanism MiniMax M2.7
  currently supports (preferred order: `tool_choice` → `response_format` →
  in-prompt JSON instruction). Decision is made during plan writing after
  reading MiniMax docs.
- Validate the returned JSON matches the `RaMirrorScore` schema. On any
  validation / network / upstream error, return 500 `AI_FAILED`.

Token budget per call (estimate): ~280 input + ~150 output. At MiniMax
indicative pricing (~¥10 / million tokens, verify current rate),
**~¥0.004 per call**. A 100-call demo run ≈ ¥0.4.

## Prompt (draft)

System:

```
You are a PTE Read Aloud examiner. Compare the candidate's transcript to the original sentence and return a JSON object with:
- score: integer 0-90 (PTE-style)
- hits: array of lowercase tokens from the original that the candidate read correctly
- missed: array of lowercase tokens from the original that the candidate skipped
- mispronounced: array of lowercase tokens from the original that the candidate read but with likely pronunciation error (i.e., the transcript token differs phonetically from the original)
- comment: ONE short Chinese sentence (20-40 chars) giving the most actionable improvement tip

Rules:
- Only include tokens from the original sentence in hits / missed / mispronounced.
- Punctuation is stripped before comparison; tokens are lowercase.
- Articles and prepositions ("the", "a", "an", "of", "in", "on", "to") are excluded from all three arrays unless the candidate clearly missed a content word.
- Score weights: 60% content (hit ratio), 30% pronunciation (mispronounced count), 10% completeness (no large skipped runs).
- comment must be in Simplified Chinese.
```

User:

```
Original: {original}
Transcript: {transcript}
```

## Translations — `data/translations.ts`

New keys (both `en` and `zh`):

- `raMirrorEyebrow`, `raMirrorTitle`
- `raMirrorStart`, `raMirrorStartAgain`
- `raMirrorHint` (instruction line above the record button)
- `raMirrorRecord`, `raMirrorStop`
- `raMirrorScoring` ("AI 正在评分…")
- `raMirrorNextSentence` ("再来一句")
- `raMirrorScoreLabel` ("评分")
- `raMirrorNoSpeech` (browser unsupported error)
- `raMirrorAiFailed` (generic AI error)

## Integration

1. **`components/MissionPanel.tsx`** — add `<RaAiMirrorGame ...>` block
   conditional on `node.id === 'ra'`, mirroring the existing game blocks
   (lines 98–134).
2. **`components/MissionPanel.tsx` line 53** — leave `gameRequired`
   unchanged. RA AI Mirror is intentionally NOT gating in MVP.
3. **`lib/summitMastery.ts:45` `moduleRequiresGame`** — leave unchanged.
   (Same reason.)
4. **`.env.local.example`** — create with `MINIMAX_API_KEY=` and (if the
   current MiniMax endpoint requires it) `MINIMAX_GROUP_ID=`, plus a
   one-line comment. Verify `.env.local` is in `.gitignore`.
5. **`package.json`** — **no new runtime dependency**. The route uses
   native `fetch`. (We may add a tiny zod-like validator later, but not for
   MVP.)

No storage schema change required: `state.gameResults['<target>:ra']` already
works under the existing `pte-summit-mastery-v2` schema.

## Tests — `lib/raAiMirror.test.ts`

Unit tests for the lib only. The component and API route are covered manually
during demo (consistent with the other mini-games in this project).

1. `raSentences` has at least 8 entries.
2. Every sentence text contains 10–20 words after `tokenize` (inclusive).
3. Every sentence id is unique and matches `/^ra-\d+$/`.
4. `tokenize` strips punctuation, lowercases, and splits on whitespace
   (3 fixture pairs).

## Demo script (~90 sec)

1. Open `/`, click the Read Aloud node on the Summit map.
2. Mission panel shows the AI Mirror entry card. Click Start.
3. Sentence appears: e.g. "The development of sustainable energy is essential
   for our future."
4. Click 🎙, read it aloud and deliberately skip "sustainable" and stumble
   on "essential".
5. Stop. "AI 正在评分…" for ~1.5 s.
6. The sentence re-renders word-by-word: "sustainable" red, "essential"
   yellow, others green. Score chip: 72. Comment: "注意 'sustainable' 漏读，
   'essential' 重音偏移".
7. Talk through the request shape (`{original, transcript}`), token cost
   (~280 in / ~150 out, ~¥0.004 / call), model (MiniMax M2.7), and how
   structured output is enforced.

## Risks

- **Web Speech browser support.** Firefox lacks the API entirely; Safari
  exposes it as `webkitSpeechRecognition`. Demo on Chrome or Edge for
  reliability. The unsupported-browser error state covers Firefox.
- **Web Speech accuracy varies by accent.** A strong accent may produce a
  transcript that differs from intent, causing the LLM to score "what was
  heard" rather than "what was said". This is the same limitation real PTE
  AI faces — it makes the AI-mirror metaphor more defensible, not less.
- **API key safety.** `.env.local` MUST stay out of git. `.env.local.example`
  is the only env file committed.
- **LLM JSON drift.** Even with tool-use enforcement, validate the response
  shape. On validation failure, return `AI_FAILED`.
- **Microphone permission.** Once denied for an origin, irreversible until
  the user clears site settings. Spec assumes a fresh browser profile or
  permission already granted before the demo.
- **Project's "non-standard Next.js" warning** (`AGENTS.md`). The route
  handler is the project's first server-side code; the implementation phase
  must read `node_modules/next/dist/docs/` for the current route-handler
  signature before writing it.
- **MiniMax M2.7 docs lookup required.** Implementation phase must verify
  the model-id string, whether `GroupId` query param is needed, and which
  structured-output mechanism (`tool_choice` / `response_format` /
  in-prompt) is currently supported. The spec leaves the choice open
  precisely because this depends on the live docs.
