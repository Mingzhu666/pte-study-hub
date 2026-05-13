import type { RaMirrorScore } from '@/lib/raAiMirror';

const MODEL_ID = 'MiniMax-M2.7';

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

function extractJsonPayload(text: string): string | null {
  // Strip <think>...</think> blocks emitted by reasoning models like MiniMax M2.7.
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip ``` or ```json fences if present.
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  // Find the first {...} balanced JSON object. Handles trailing text after the JSON.
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
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

  const host = process.env.MINIMAX_API_HOST ?? 'api.minimaxi.com';
  const url = `https://${host}/v1/chat/completions`;

  const requestBody = {
    model: MODEL_ID,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Original: ${original}\nTranscript: ${transcript}` },
    ],
    temperature: 0.2,
    max_tokens: 2000,
    // M2.7 is a reasoning model. Splitting reasoning out keeps `content` clean.
    reasoning_split: true,
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
  } catch (err) {
    console.error('[ra-mirror] network error', err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => '');
    console.error('[ra-mirror] upstream non-2xx', upstream.status, errBody);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch (err) {
    console.error('[ra-mirror] upstream JSON parse error', err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  const text: unknown = (raw as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    console.error('[ra-mirror] unexpected upstream shape', JSON.stringify(raw).slice(0, 500));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  const jsonPayload = extractJsonPayload(text);
  if (!jsonPayload) {
    console.error('[ra-mirror] no JSON object in model output', text.slice(0, 300));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[ra-mirror] extracted JSON failed to parse', jsonPayload.slice(0, 300), err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!isRaMirrorScore(parsed)) {
    console.error('[ra-mirror] model output failed schema validation', JSON.stringify(parsed).slice(0, 300));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  return Response.json(parsed);
}
