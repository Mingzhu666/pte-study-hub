import type {
  WeEssayBreakdown,
  WeEssayScore,
  WeSentenceFeedback,
} from '@/lib/weAiEssay';

const MODEL_ID = 'MiniMax-M2.7';

type FeedbackLanguage = 'en' | 'zh';

const COMMON_PROMPT = `You are a PTE Academic Write Essay examiner. The candidate has 20 minutes to write a 200-300 word essay responding to the prompt. Score the essay using PTE Academic criteria and return a JSON object with this exact shape:

{
  "total": integer 0-90,
  "breakdown": {
    "content": integer 0-3,
    "form": integer 0-2,
    "development": integer 0-2,
    "grammar": integer 0-2,
    "linguistic": integer 0-2,
    "vocabulary": integer 0-2,
    "spelling": integer 0-2
  },
  "sentences": [
    { "sentence": "<exact original sentence>", "level": "good"|"ok"|"weak", "comment": "<see language rules below>" }
  ],
  "overall": "<see language rules below>"
}

Criteria definitions:
- content (0-3): Does the essay address all parts of the prompt with relevant ideas?
- form (0-2): 200-300 words, has paragraphs, no all-caps blocks. (0 if <120 or >380 or single paragraph)
- development (0-2): Logical structure, clear thesis, coherent transitions.
- grammar (0-2): Grammatical accuracy.
- linguistic (0-2): Range of sentence structures (simple, compound, complex).
- vocabulary (0-2): Range and precision of word choice.
- spelling (0-2): Spelling and word-form errors.
- total: scaled to 0-90. Roughly: total ≈ round((breakdown.content/3 * 0.30 + form/2 * 0.10 + development/2 * 0.15 + grammar/2 * 0.15 + linguistic/2 * 0.10 + vocabulary/2 * 0.15 + spelling/2 * 0.05) * 90).

Per-sentence rules:
- Split the candidate's essay into sentences (by . ! ?). Output ONE feedback entry per sentence in order.
- "sentence" must be the verbatim original sentence text (no rewrites, no paraphrase).
- "level": good = fluent and accurate; ok = understandable but improvable; weak = grammar/clarity/relevance issue.`;

const PROMPT_ZH = `${COMMON_PROMPT}

- "comment" MUST be Simplified Chinese, 20-60 characters, one sentence:
  - For "good": brief praise pointing out what works ("句式自然，过渡词使用恰当").
  - For "ok": one concrete improvement ("可换用更精准的动词，如 deepen → reinforce").
  - For "weak": identify the specific issue and suggest a fix ("主谓不一致：should change 'is' to 'are'").

Overall feedback rules:
- Simplified Chinese, 80-180 characters total.
- Structure: 1 sentence of 强项 (strength), 1-2 sentences of 主要待改进 (main issues with concrete suggestion), 1 sentence of 鼓励 (encouragement).

Output rules:
- Reply with ONLY the JSON object. No prose before/after, no markdown fences, no \`\`\`json.
- All Chinese strings must use Simplified characters.`;

const PROMPT_EN = `${COMMON_PROMPT}

- "comment" MUST be in English, 15-40 words, one sentence:
  - For "good": brief praise pointing out what works ("Natural rhythm with a well-placed transition word").
  - For "ok": one concrete improvement ("Swap 'deepen' for a sharper verb like 'reinforce'").
  - For "weak": identify the specific issue and suggest a fix ("Subject-verb agreement: change 'is' to 'are'").

Overall feedback rules:
- English, 60-140 words total.
- Structure: 1 sentence on the essay's strength, 1-2 sentences on the main issues with a concrete suggestion, 1 sentence of encouragement.

Output rules:
- Reply with ONLY the JSON object. No prose before/after, no markdown fences, no \`\`\`json.
- All natural-language strings ("comment", "overall") must be in English only.`;

function systemPromptFor(language: FeedbackLanguage): string {
  return language === 'en' ? PROMPT_EN : PROMPT_ZH;
}

function isBreakdown(v: unknown): v is WeEssayBreakdown {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const intIn = (val: unknown, max: number) =>
    typeof val === 'number' && Number.isInteger(val) && val >= 0 && val <= max;
  return (
    intIn(o.content, 3) &&
    intIn(o.form, 2) &&
    intIn(o.development, 2) &&
    intIn(o.grammar, 2) &&
    intIn(o.linguistic, 2) &&
    intIn(o.vocabulary, 2) &&
    intIn(o.spelling, 2)
  );
}

function isSentenceFeedback(v: unknown): v is WeSentenceFeedback {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.sentence === 'string' &&
    o.sentence.length > 0 &&
    typeof o.comment === 'string' &&
    o.comment.length > 0 &&
    (o.level === 'good' || o.level === 'ok' || o.level === 'weak')
  );
}

function isWeEssayScore(value: unknown): value is WeEssayScore {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.total === 'number' &&
    Number.isInteger(v.total) &&
    v.total >= 0 &&
    v.total <= 90 &&
    isBreakdown(v.breakdown) &&
    Array.isArray(v.sentences) &&
    v.sentences.length > 0 &&
    v.sentences.every(isSentenceFeedback) &&
    typeof v.overall === 'string' &&
    v.overall.length > 0
  );
}

function extractJsonPayload(text: string): string | null {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
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

  const { topic, essay, language } = (body ?? {}) as {
    topic?: unknown;
    essay?: unknown;
    language?: unknown;
  };

  if (
    typeof topic !== 'string' ||
    typeof essay !== 'string' ||
    topic.length === 0 ||
    essay.length === 0 ||
    topic.length > 1000 ||
    essay.length > 5000
  ) {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const feedbackLanguage: FeedbackLanguage = language === 'zh' ? 'zh' : 'en';

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'NO_API_KEY' }, { status: 500 });
  }

  const host = process.env.MINIMAX_API_HOST ?? 'api.minimaxi.com';
  const url = `https://${host}/v1/chat/completions`;

  const requestBody = {
    model: MODEL_ID,
    messages: [
      { role: 'system', content: systemPromptFor(feedbackLanguage) },
      { role: 'user', content: `Prompt: ${topic}\n\nEssay:\n${essay}` },
    ],
    temperature: 0.3,
    max_tokens: 4000,
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
    console.error('[we-essay] network error', err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => '');
    console.error('[we-essay] upstream non-2xx', upstream.status, errBody);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch (err) {
    console.error('[we-essay] upstream JSON parse error', err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  const text: unknown = (raw as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    console.error('[we-essay] unexpected upstream shape', JSON.stringify(raw).slice(0, 500));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  const jsonPayload = extractJsonPayload(text);
  if (!jsonPayload) {
    console.error('[we-essay] no JSON object in model output', text.slice(0, 300));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[we-essay] extracted JSON failed to parse', jsonPayload.slice(0, 300), err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!isWeEssayScore(parsed)) {
    console.error('[we-essay] model output failed schema validation', JSON.stringify(parsed).slice(0, 300));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  return Response.json(parsed);
}
