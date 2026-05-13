# RA AI Mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the project's first AI-powered feature — a single-sentence Read Aloud scoring mini-game that combines browser Web Speech transcription with one MiniMax M2.7 call to produce per-word color feedback + a Chinese improvement tip.

**Architecture:** Pure-frontend lib (sentence library + tokenize + types) consumed by a new client component (`RaAiMirrorGame`) that drives the Web Speech API and POSTs to a thin Next.js API route (`/api/ra-mirror`). The API route is the only server-side code in the project; it forwards to MiniMax via native `fetch`. No new SDK dependencies. Mirror is NOT gated against Summit progression in MVP.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (strict), `node:test` (existing project pattern), browser Web Speech API, MiniMax M2.7 over native `fetch`.

**Spec:** [docs/superpowers/specs/2026-05-13-ra-ai-mirror-design.md](../specs/2026-05-13-ra-ai-mirror-design.md)

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `lib/raAiMirror.ts` | Create | Sentence library, `RaSentence` / `RaMirrorScore` types, `tokenize` helper |
| `lib/raAiMirror.test.ts` | Create | Unit tests for the library |
| `app/api/ra-mirror/route.ts` | Create | Server-side POST handler that calls MiniMax |
| `components/RaAiMirrorGame.tsx` | Create | The mini-game UI + Web Speech orchestration |
| `app/globals.css` | Modify | Add `.ra-mirror-*` styles |
| `data/translations.ts` | Modify | Add ~10 new keys for the mini-game UI |
| `components/MissionPanel.tsx` | Modify | Slot the new game in for `node.id === 'ra'` |
| `.env.local` | Create (LOCAL ONLY, NOT COMMITTED) | Holds `MINIMAX_API_KEY` for the dev server |
| `.env.local.example` | Create | Committed template; needs `.gitignore` negation |
| `.gitignore` | Modify | Add `!.env.local.example` so the template can be committed |

---

## Pre-flight: gather what I need from the user

Before Task 4 (the API route), I need from the user:

1. **MiniMax API key** (`MINIMAX_API_KEY`)
2. **Whether MiniMax M2.7 still requires a `GroupId`** query parameter (and if so, the value)
3. **Confirmed model-id string** for M2.7 in the API (e.g. `MiniMax-M2.7`, `abab7-m2.7`, etc.)

Ask the user for these as a single batch before starting Task 4. If the user does not know (2) and (3), Task 3 (docs research) covers it.

---

## Task 1: Sentence library, types, and tokenize helper (TDD)

**Files:**
- Create: `lib/raAiMirror.ts`
- Create: `lib/raAiMirror.test.ts`

- [ ] **Step 1.1: Write the failing test file**

Create `lib/raAiMirror.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { raSentences, tokenize } from './raAiMirror.ts';

test('tokenize lowercases and splits on whitespace', () => {
  assert.deepEqual(tokenize('Hello World'), ['hello', 'world']);
});

test('tokenize strips punctuation but keeps apostrophes', () => {
  assert.deepEqual(tokenize('Hello, world!'), ['hello', 'world']);
  assert.deepEqual(tokenize("It's a test."), ["it's", 'a', 'test']);
});

test('tokenize collapses multiple spaces and ignores empty tokens', () => {
  assert.deepEqual(tokenize('  one   two  '), ['one', 'two']);
});

test('raSentences has at least 8 entries', () => {
  assert.ok(raSentences.length >= 8, `expected >= 8 sentences, got ${raSentences.length}`);
});

test('every sentence has 10-20 words after tokenize', () => {
  for (const s of raSentences) {
    const len = tokenize(s.text).length;
    assert.ok(len >= 10 && len <= 20, `${s.id}: ${len} words (${s.text})`);
  }
});

test('every sentence id is unique and matches /^ra-\\d+$/', () => {
  const ids = raSentences.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
  for (const id of ids) {
    assert.match(id, /^ra-\d+$/);
  }
});
```

- [ ] **Step 1.2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types lib/raAiMirror.test.ts`
Expected: FAIL with "Cannot find module './raAiMirror.ts'" or similar.

- [ ] **Step 1.3: Write the minimal implementation**

Create `lib/raAiMirror.ts`:

```ts
export interface RaSentence {
  id: string;     // e.g. 'ra-1'
  text: string;   // 10-20 words, PTE-style academic English
}

export interface RaMirrorScore {
  score: number;            // 0-90 integer
  hits: string[];           // lowercase tokens from original read correctly
  missed: string[];         // lowercase tokens from original skipped
  mispronounced: string[];  // lowercase tokens from original with pronunciation off
  comment: string;          // single Simplified Chinese sentence, ~20-40 chars
}

export function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, '')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export const raSentences: RaSentence[] = [
  {
    id: 'ra-1',
    text: 'The development of sustainable energy is essential for our future generations.',
  },
  {
    id: 'ra-2',
    text: 'Climate change has become one of the most pressing issues of our time.',
  },
  {
    id: 'ra-3',
    text: 'Many universities now offer online courses to students around the world.',
  },
  {
    id: 'ra-4',
    text: 'Scientists have discovered a new species of bird in the Amazon rainforest.',
  },
  {
    id: 'ra-5',
    text: 'The library will be closed for renovation during the entire summer break.',
  },
  {
    id: 'ra-6',
    text: 'Globalization has transformed the way businesses operate across international borders.',
  },
  {
    id: 'ra-7',
    text: 'Regular exercise can significantly improve both physical health and mental wellbeing.',
  },
  {
    id: 'ra-8',
    text: 'Artificial intelligence is reshaping industries from healthcare to finance and education.',
  },
  {
    id: 'ra-9',
    text: 'Public transportation reduces traffic congestion and lowers urban carbon emissions effectively.',
  },
  {
    id: 'ra-10',
    text: 'The committee will review the proposal at the next monthly board meeting.',
  },
];
```

- [ ] **Step 1.4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types lib/raAiMirror.test.ts`
Expected: PASS, all 6 tests green.

- [ ] **Step 1.5: Commit**

```bash
git add lib/raAiMirror.ts lib/raAiMirror.test.ts
git commit -m "feat: add raAiMirror sentence library, tokenize, score types"
```

---

## Task 2: Add translation keys

**Files:**
- Modify: `data/translations.ts` (both `en` and `zh` blocks)

- [ ] **Step 2.1: Read the file to find both blocks**

Run: `grep -n "^  en:\|^  zh:" data/translations.ts`
Note the line numbers for the `en:` block end and the `zh:` block end (i.e. the closing `}` of each).

- [ ] **Step 2.2: Add the new English keys**

Insert at the end of the `en:` block (just before its closing `}`):

```ts
    // RA AI Mirror
    raMirrorEyebrow: 'Speaking · AI Coach',
    raMirrorTitle: 'AI Mirror',
    raMirrorStart: 'Start Practice',
    raMirrorStartAgain: 'Try Another',
    raMirrorHint: 'Read the sentence aloud at a natural pace.',
    raMirrorRecord: 'Record',
    raMirrorStop: 'Stop',
    raMirrorScoring: 'AI is scoring…',
    raMirrorNextSentence: 'Next Sentence',
    raMirrorNoSpeech: 'Your browser does not support local speech recognition. Please open in Chrome / Edge / Safari.',
    raMirrorAiFailed: 'AI scoring is currently unavailable. Please try again later.',
```

- [ ] **Step 2.3: Add the matching Chinese keys**

Insert at the end of the `zh:` block (just before its closing `}`), in the same order:

```ts
    // RA AI Mirror
    raMirrorEyebrow: '口语 · AI 教练',
    raMirrorTitle: 'AI 跟读对照镜',
    raMirrorStart: '开始练习',
    raMirrorStartAgain: '再来一次',
    raMirrorHint: '请用自然语速朗读这句话',
    raMirrorRecord: '开始录音',
    raMirrorStop: '停止录音',
    raMirrorScoring: 'AI 正在评分…',
    raMirrorNextSentence: '再来一句',
    raMirrorNoSpeech: '你的浏览器不支持本地语音识别，请用 Chrome / Edge / Safari 打开',
    raMirrorAiFailed: 'AI 评分服务暂不可用，请稍后再试',
```

- [ ] **Step 2.4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (If errors are unrelated to translation keys, note them but don't try to fix here.)

- [ ] **Step 2.5: Commit**

```bash
git add data/translations.ts
git commit -m "feat(i18n): add RA AI Mirror translation keys"
```

---

## Task 3: Verify Next.js 16 route handler signature + MiniMax M2.7 API shape

**Files:** none (research only)

This task produces notes that inform Task 4. **Do not skip.**

- [ ] **Step 3.1: Read Next.js 16 App Router route handler docs**

The project warns in `AGENTS.md` that this Next.js version has breaking changes. The bundled docs are authoritative.

Run: `ls node_modules/next/dist/docs/01-app/`

Then read the route-handler doc. Likely paths:

```bash
find node_modules/next/dist/docs/01-app -name "*route*" -o -name "*api*" -o -name "*handler*" 2>/dev/null
```

Open the most relevant file and capture: the exact export signature for a POST handler, how to read JSON body, how to return JSON, and any required runtime exports (e.g. `runtime`, `dynamic`).

- [ ] **Step 3.2: Look up MiniMax M2.7 API**

Use the `WebFetch` tool against MiniMax's current docs portal (likely `https://platform.minimaxi.com/document/` or `https://intl.minimaxi.com/document/`). Capture:

- Base URL for chat completions in 2026 (historic: `https://api.minimax.chat/v1/text/chatcompletion_v2`).
- Whether the endpoint still requires a `GroupId` query parameter.
- Exact model-id string for M2.7.
- Whether `tools` + `tool_choice` is supported (OpenAI-style).
- Whether `response_format: { type: 'json_object' }` is supported.
- Exact request body shape: `messages`, role names, system message convention.
- Exact response body shape: where the assistant text lives (e.g. `choices[0].message.content`).

- [ ] **Step 3.3: Pick the structured-output strategy**

Based on Step 3.2, pick ONE in this preferred order and write it down for use in Task 4:

1. **`tools` + `tool_choice`** forcing a single function call whose arguments match `RaMirrorScore`. Most robust.
2. **`response_format: { type: 'json_object' }`** plus an in-prompt instruction to emit the exact schema.
3. **In-prompt only** ("Reply with ONLY a JSON object matching the following schema: …"), plus strict JSON.parse + shape validation server-side.

- [ ] **Step 3.4: Confirm with user before proceeding**

Stop and ask the user to confirm:

- Their MiniMax API key (set into `.env.local` in Task 4).
- The model-id string from Step 3.2.
- Whether `GroupId` is needed and its value.

Do not start Task 4 until you have all three.

---

## Task 4: API route `/api/ra-mirror`

**Files:**
- Create: `app/api/ra-mirror/route.ts`
- Create: `.env.local` (LOCAL, never committed)
- Create: `.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 4.1: Set up env files**

Create `.env.local.example`:

```
# MiniMax M2.7 credentials for /api/ra-mirror
# Get keys from https://platform.minimaxi.com/
MINIMAX_API_KEY=
# GroupId only required if MiniMax's chat-completion endpoint still needs it.
# Leave blank if the version you use does not require it.
MINIMAX_GROUP_ID=
```

Patch `.gitignore` (the file currently has `.env*` which would ignore the example too). Append at the bottom:

```
# Allow committing the env template
!.env.local.example
```

Verify the negation works:

```bash
git check-ignore -v .env.local.example   # expected: no match (file is NOT ignored)
git check-ignore -v .env.local           # expected: matches `.env*`
```

Create `.env.local` with the user-provided key (DO NOT commit this file):

```
MINIMAX_API_KEY=<paste from user>
MINIMAX_GROUP_ID=<paste from user, or leave empty>
```

- [ ] **Step 4.2: Write the route handler**

Create `app/api/ra-mirror/route.ts`. Use the Next.js 16 signature confirmed in Step 3.1; the skeleton below assumes the standard `POST(request: Request)` form — adjust if the bundled docs say otherwise.

```ts
import type { RaMirrorScore } from '@/lib/raAiMirror';

const MINIMAX_ENDPOINT =
  // TODO(plan-task-3): replace with the URL confirmed in Step 3.2
  'https://api.minimax.chat/v1/text/chatcompletion_v2';

const MODEL_ID =
  // TODO(plan-task-3): replace with the model-id confirmed in Step 3.2
  'MiniMax-M2.7';

const SYSTEM_PROMPT = `You are a PTE Read Aloud examiner. Compare the candidate's transcript to the original sentence and return a JSON object with:
- score: integer 0-90 (PTE-style)
- hits: array of lowercase tokens from the original that the candidate read correctly
- missed: array of lowercase tokens from the original that the candidate skipped
- mispronounced: array of lowercase tokens from the original that the candidate read but with likely pronunciation error (i.e., the transcript token differs phonetically from the original)
- comment: ONE short Simplified Chinese sentence (20-40 chars) giving the most actionable improvement tip

Rules:
- Only include tokens from the original sentence in hits / missed / mispronounced.
- Punctuation is stripped before comparison; tokens are lowercase.
- Articles and prepositions ("the", "a", "an", "of", "in", "on", "to") are excluded from all three arrays unless the candidate clearly missed a content word.
- Score weights: 60% content (hit ratio), 30% pronunciation (mispronounced count), 10% completeness (no large skipped runs).
- comment must be in Simplified Chinese.
- Reply with ONLY a JSON object matching the schema. No prose, no markdown fences.`;

function isRaMirrorScore(value: unknown): value is RaMirrorScore {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.score === 'number' &&
    Number.isInteger(v.score) &&
    v.score >= 0 &&
    v.score <= 90 &&
    Array.isArray(v.hits) && v.hits.every((t) => typeof t === 'string') &&
    Array.isArray(v.missed) && v.missed.every((t) => typeof t === 'string') &&
    Array.isArray(v.mispronounced) && v.mispronounced.every((t) => typeof t === 'string') &&
    typeof v.comment === 'string' &&
    v.comment.length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const { original, transcript } = (body ?? {}) as {
    original?: unknown;
    transcript?: unknown;
  };

  if (
    typeof original !== 'string' ||
    typeof transcript !== 'string' ||
    original.length === 0 ||
    transcript.length === 0 ||
    original.length > 500 ||
    transcript.length > 500
  ) {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'NO_API_KEY' }, { status: 500 });
  }

  const groupId = process.env.MINIMAX_GROUP_ID;
  const url = groupId
    ? `${MINIMAX_ENDPOINT}?GroupId=${encodeURIComponent(groupId)}`
    : MINIMAX_ENDPOINT;

  // NOTE: Body shape below assumes OpenAI-compatible chat-completion. Adjust
  // if Step 3.2 found that MiniMax M2.7 uses a different shape.
  const requestBody = {
    model: MODEL_ID,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Original: ${original}\nTranscript: ${transcript}` },
    ],
    // TODO(plan-task-3): swap to tools+tool_choice OR response_format if Step 3.3
    // chose those strategies.
    temperature: 0.2,
    max_tokens: 400,
  };

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!upstream.ok) {
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let raw: any;
  try {
    raw = await upstream.json();
  } catch {
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  // Adjust this access path based on Step 3.2 findings.
  const text: unknown = raw?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!isRaMirrorScore(parsed)) {
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  return Response.json(parsed);
}
```

- [ ] **Step 4.3: Smoke test the route**

Start the dev server in one shell:

```bash
npm run dev
```

In another shell, hit the route:

```bash
curl -X POST http://localhost:3000/api/ra-mirror \
  -H 'Content-Type: application/json' \
  -d '{"original":"The development of sustainable energy is essential for our future generations.","transcript":"the development of energy is essential for our future"}'
```

Expected:
- Returns HTTP 200 with a JSON body matching `RaMirrorScore` shape.
- `missed` should include `'sustainable'` and `'generations'`.
- `score` should be a number between 0 and 90.
- `comment` should be in Chinese.

If the response is `{"error": "AI_FAILED"}`, inspect the dev-server console for the upstream error and adjust the request body shape per Step 3.2 findings. Stop the dev server when done.

- [ ] **Step 4.4: Test the error paths**

```bash
# Missing fields → 400
curl -i -X POST http://localhost:3000/api/ra-mirror \
  -H 'Content-Type: application/json' -d '{}'
# Expected: HTTP 400, {"error":"BAD_REQUEST"}

# Temporarily clear the key → 500 NO_API_KEY
# (Comment out MINIMAX_API_KEY in .env.local, restart dev server, retry, then restore)
```

- [ ] **Step 4.5: Strip scaffolding TODOs and final-check before commit**

Search the new route file for any remaining `TODO(plan-task-3)` markers. Each one should now be resolved (URL replaced, model id replaced, structured-output strategy in place). Remove the marker comments themselves.

```bash
grep -n "TODO(plan-task-3)" app/api/ra-mirror/route.ts
# Expected: no output. If any remain, finish resolving them first.
```

Verify `.env.local` is NOT staged:

```bash
git status --short
# .env.local must NOT appear. Only .env.local.example should be new (??).
```

- [ ] **Step 4.6: Commit**

```bash
git add app/api/ra-mirror/route.ts .env.local.example .gitignore
git commit -m "feat(api): add /api/ra-mirror endpoint backed by MiniMax M2.7"
```

---

## Task 5: CSS for the new mini-game

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 5.1: Find an anchor location in the CSS file**

Run: `grep -n "wfd-game-result\|wfd-game-card" app/globals.css | tail -5`
Add the new block immediately after the last `wfd-game-*` rule.

- [ ] **Step 5.2: Append the new CSS block**

Append to `app/globals.css`:

```css
/* RA AI Mirror */
.ra-mirror-sentence {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 4px;
  font-size: 16px;
  line-height: 1.7;
  margin: 12px 0 16px;
}

.ra-mirror-token {
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  color: #1d1d1f;
  transition: background 0.2s ease;
}

.ra-mirror-token--hit {
  background: rgba(48, 209, 88, 0.16);
  color: #14794e;
}

.ra-mirror-token--missed {
  background: rgba(255, 55, 95, 0.14);
  color: #b3173a;
  text-decoration: line-through;
}

.ra-mirror-token--mispronounced {
  background: rgba(255, 159, 10, 0.18);
  color: #8a4d00;
}

.ra-mirror-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 16px;
  background: rgba(0, 113, 227, 0.1);
  color: #0071e3;
}

.ra-mirror-score--high { background: rgba(48, 209, 88, 0.16); color: #14794e; }
.ra-mirror-score--mid  { background: rgba(255, 159, 10, 0.18); color: #8a4d00; }
.ra-mirror-score--low  { background: rgba(255, 55, 95, 0.14); color: #b3173a; }

.ra-mirror-comment {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  color: #3a3a3c;
  font-size: 13.5px;
  line-height: 1.55;
  margin-top: 4px;
}

.ra-mirror-transcript {
  font-size: 13px;
  color: #6e6e73;
  margin: 8px 0 0;
}

.ra-mirror-error {
  color: #b3173a;
  font-size: 13px;
  margin-top: 8px;
}
```

- [ ] **Step 5.3: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): add RA AI Mirror CSS classes"
```

---

## Task 6: Build the `RaAiMirrorGame` component

**Files:**
- Create: `components/RaAiMirrorGame.tsx`

- [ ] **Step 6.1: Add a Web Speech type declaration**

The DOM lib does not always include `SpeechRecognition`. To stay typesafe without adding an `@types` package, declare the minimal shape we use at the top of the new file (NOT in a global ambient file).

- [ ] **Step 6.2: Write the component**

Create `components/RaAiMirrorGame.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  raSentences,
  tokenize,
  type RaMirrorScore,
  type RaSentence,
} from '@/lib/raAiMirror';

const STORAGE_KEY = 'pte-ra-mirror-sentence-index';
const PASS_THRESHOLD = 60;

// Minimal local typing for Web Speech API (DOM lib doesn't always include it).
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface Props {
  latestPassed: boolean;
  onLatestResult: (passed: boolean) => void;
}

type Phase = 'entry' | 'idle' | 'recording' | 'scoring' | 'result' | 'error';

function readStoredIndex(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed % raSentences.length : 0;
}

function classifyToken(
  token: string,
  hits: string[],
  missed: string[],
  mispronounced: string[],
): 'hit' | 'missed' | 'mispronounced' | 'neutral' {
  if (hits.includes(token)) return 'hit';
  if (missed.includes(token)) return 'missed';
  if (mispronounced.includes(token)) return 'mispronounced';
  return 'neutral';
}

function scoreBand(score: number): 'high' | 'mid' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'mid';
  return 'low';
}

export default function RaAiMirrorGame({ onLatestResult }: Props) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>('entry');
  const [sentenceIndex, setSentenceIndex] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<RaMirrorScore | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Hydrate sentence index from localStorage on mount (avoids SSR hydration mismatch).
  useEffect(() => {
    setSentenceIndex(readStoredIndex());
  }, []);

  const sentence: RaSentence = raSentences[sentenceIndex] ?? raSentences[0];
  const tokens = useMemo(() => tokenize(sentence.text), [sentence.text]);

  const handleStart = () => {
    setPhase('idle');
    setTranscript('');
    setScore(null);
    setErrorMessage(null);
  };

  const handleRecord = () => {
    const Ctor: SpeechRecognitionCtor | undefined =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
        .webkitSpeechRecognition;

    if (!Ctor) {
      setPhase('error');
      setErrorMessage(t('raMirrorNoSpeech'));
      return;
    }

    let captured = '';
    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      captured = event.results[0][0].transcript;
      setTranscript(captured);
    };
    recognition.onerror = () => {
      setPhase('error');
      setErrorMessage(t('raMirrorAiFailed'));
    };
    recognition.onend = () => {
      if (captured) {
        void handleScore(captured);
      } else {
        // Recognition ended without capturing anything (silence / cancel).
        setPhase('idle');
      }
    };

    recognitionRef.current = recognition;
    setPhase('recording');
    recognition.start();
  };

  const handleStop = () => {
    recognitionRef.current?.stop();
  };

  const handleScore = async (capturedTranscript: string) => {
    setPhase('scoring');
    try {
      const res = await fetch('/api/ra-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original: sentence.text, transcript: capturedTranscript }),
      });
      if (!res.ok) {
        setPhase('error');
        setErrorMessage(t('raMirrorAiFailed'));
        return;
      }
      const data = (await res.json()) as RaMirrorScore;
      setScore(data);
      setPhase('result');
      onLatestResult(data.score >= PASS_THRESHOLD);
    } catch {
      setPhase('error');
      setErrorMessage(t('raMirrorAiFailed'));
    }
  };

  const handleNextSentence = () => {
    const next = (sentenceIndex + 1) % raSentences.length;
    setSentenceIndex(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    }
    handleStart();
  };

  // ---- Render ----

  if (phase === 'entry') {
    return (
      <div className="wfd-game-entry">
        <div className="wfd-game-header">
          <p className="wfd-game-eyebrow">{t('raMirrorEyebrow')}</p>
          <h3 className="wfd-game-title">{t('raMirrorTitle')}</h3>
        </div>
        <button type="button" className="wfd-game-primary" onClick={handleStart}>
          {t('raMirrorStart')}
        </button>
      </div>
    );
  }

  return (
    <div className="wfd-game-card">
      <div className="wfd-game-header">
        <p className="wfd-game-eyebrow">{t('raMirrorEyebrow')}</p>
        <h3 className="wfd-game-title">{t('raMirrorTitle')}</h3>
        <p className="wfd-game-helper">{t('raMirrorHint')}</p>
      </div>

      {phase !== 'result' && (
        <p className="ra-mirror-sentence">
          {tokens.map((token, i) => (
            <span key={i} className="ra-mirror-token">
              {token}
            </span>
          ))}
        </p>
      )}

      {phase === 'result' && score && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <p className="ra-mirror-sentence" style={{ flex: 1, margin: 0 }}>
              {tokens.map((token, i) => {
                const cls = classifyToken(token, score.hits, score.missed, score.mispronounced);
                return (
                  <span key={i} className={`ra-mirror-token ra-mirror-token--${cls}`}>
                    {token}
                  </span>
                );
              })}
            </p>
            <span className={`ra-mirror-score ra-mirror-score--${scoreBand(score.score)}`}>
              {score.score}
            </span>
          </div>
          <div className="ra-mirror-comment">
            <Icons.Sparkles size={14} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{score.comment}</span>
          </div>
        </>
      )}

      {phase === 'idle' && (
        <button type="button" className="wfd-game-primary" onClick={handleRecord}>
          🎙 {t('raMirrorRecord')}
        </button>
      )}

      {phase === 'recording' && (
        <button type="button" className="wfd-game-secondary" onClick={handleStop}>
          ■ {t('raMirrorStop')}
        </button>
      )}

      {phase === 'scoring' && (
        <p className="wfd-game-helper">{t('raMirrorScoring')}</p>
      )}

      {phase === 'result' && (
        <button type="button" className="wfd-game-primary" onClick={handleNextSentence}>
          {t('raMirrorNextSentence')}
        </button>
      )}

      {phase === 'error' && (
        <>
          <p className="ra-mirror-error">{errorMessage}</p>
          <button type="button" className="wfd-game-secondary" onClick={handleStart}>
            {t('raMirrorStartAgain')}
          </button>
        </>
      )}

      {transcript && phase !== 'result' && phase !== 'error' && (
        <p className="ra-mirror-transcript">› {transcript}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 6.3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. If there are errors about translation keys (`raMirror*`), make sure Task 2 was applied in BOTH `en` and `zh` blocks.

- [ ] **Step 6.4: Commit**

```bash
git add components/RaAiMirrorGame.tsx
git commit -m "feat(ui): add RaAiMirrorGame component with Web Speech + scoring flow"
```

---

## Task 7: Wire `RaAiMirrorGame` into `MissionPanel`

**Files:**
- Modify: `components/MissionPanel.tsx`

- [ ] **Step 7.1: Add the import**

Open `components/MissionPanel.tsx`. After the existing game-component imports (around line 11), add:

```tsx
import RaAiMirrorGame from './RaAiMirrorGame';
```

- [ ] **Step 7.2: Add the conditional render**

Find the block of game conditionals (lines 98–134, anchored on `node.id === 'wfd'`). Add a new block immediately AFTER the `node.id === 'asq'` line and BEFORE the `failurePoints` section:

```tsx
      {node.id === 'ra' && (
        <RaAiMirrorGame
          latestPassed={gameResult?.passed === true}
          onLatestResult={(passed) => onGameResult(node.id, passed)}
        />
      )}
```

- [ ] **Step 7.3: Verify nothing else needs to change**

Confirm:
- `gameRequired` on line 53 is NOT modified (RA mirror is non-gating per spec).
- `lib/summitMastery.ts` is NOT modified.

- [ ] **Step 7.4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7.5: Commit**

```bash
git add components/MissionPanel.tsx
git commit -m "feat: integrate RaAiMirrorGame into MissionPanel for ra module"
```

---

## Task 8: Manual demo verification

**Files:** none (testing only)

This is the moment of truth — verify the MVP works end-to-end in a real browser.

- [ ] **Step 8.1: Start dev server**

```bash
npm run dev
```

Open http://localhost:3000 in **Chrome or Edge**.

- [ ] **Step 8.2: Happy path — read correctly**

1. Click into the Read Aloud node from the Summit map.
2. Click Start in the AI Mirror entry card.
3. Verify the sentence renders as gray pills.
4. Click 🎙, grant microphone permission if prompted.
5. Read the sentence accurately.
6. Click Stop.
7. Verify "AI is scoring…" appears, then within ~2s the colored result + score chip + Chinese comment render.
8. Verify most tokens are green and the score is high (≥80).

- [ ] **Step 8.3: Happy path — read with mistakes**

1. Click "Next Sentence".
2. Read it but deliberately skip 1 word and stumble on another.
3. Verify the skipped word is red, the stumbled word is yellow (or red if the STT didn't capture it at all).
4. Verify the Chinese comment mentions one of those words.

- [ ] **Step 8.4: Error path — Web Speech unsupported**

1. Open the page in **Firefox** (or temporarily delete `webkitSpeechRecognition` via devtools console: `delete window.webkitSpeechRecognition; delete window.SpeechRecognition`).
2. Click Start, then click 🎙.
3. Verify the friendly Chinese error renders ("你的浏览器不支持本地语音识别…").
4. Verify "Try Another" button returns to the entry state.

- [ ] **Step 8.5: Error path — API failure**

1. Stop the dev server.
2. Temporarily comment out `MINIMAX_API_KEY` in `.env.local`.
3. Restart the dev server.
4. Trigger a record + scoring cycle.
5. Verify the friendly error renders ("AI 评分服务暂不可用…").
6. Restore `.env.local` and restart the dev server.

- [ ] **Step 8.6: Sentence index persistence**

1. Click Next Sentence twice (so you're on `ra-3`).
2. Refresh the page and reopen the AI Mirror.
3. Click Start.
4. Verify the sentence shown is `ra-4` (the next one after the saved index, because `handleNextSentence` advanced and persisted before result was shown — confirm this matches your read of the code; adjust the test if logic differs).

- [ ] **Step 8.7: Confirm MVP is demoable**

Walk through the 90-second demo script from the spec end-to-end. If anything is rough, file follow-up notes but DO NOT scope-creep the MVP.

- [ ] **Step 8.8: Final commit (only if any demo fixes were made)**

```bash
git status
# If there are new fixes, commit them with a clear message.
# If there are none, skip this step.
```

---

## Out of scope (explicitly NOT in this plan)

These are spec-listed v2 items. Do NOT add them in this plan:

- Streaming output, waveform animation, heatmap-gradient coloring
- Original-vs-transcript diff view ("PTE 阅卷镜" packaging)
- TTS playback of correct pronunciation
- AI sentence generation
- Multi-sentence / paragraph mode
- History across sessions beyond `localStorage` index
- Bilingual sentences or English AI comments
- Adding `'ra'` to `moduleRequiresGame` (Summit gating)

---

## Risks & mitigations recap

| Risk | Mitigation in this plan |
|---|---|
| Next.js 16 route handler signature differs | Task 3.1 reads bundled docs first |
| MiniMax M2.7 API shape unknown | Task 3.2 reads MiniMax docs; Task 3.3 picks structured-output strategy; Task 4 has clear `TODO(plan-task-3)` markers to update |
| `.env*` ignore swallows the example file | Task 4.1 patches `.gitignore` with `!.env.local.example` and verifies via `git check-ignore` |
| Web Speech absent in Firefox | Task 8.4 explicitly tests the error path |
| `.env.local` accidentally committed | Task 4.5 reminds to verify `git status` before commit |
| LLM returns malformed JSON | `isRaMirrorScore` validator in Task 4.2 returns `AI_FAILED` rather than crashing |
