import type { RaMirrorScore } from '@/lib/raAiMirror';

const MODEL_ID = 'gemini-2.5-flash';

type FeedbackLanguage = 'en' | 'zh';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string' },
    score: { type: 'integer' },
    hits: { type: 'array', items: { type: 'string' } },
    missed: { type: 'array', items: { type: 'string' } },
    mispronounced: { type: 'array', items: { type: 'string' } },
    comment: { type: 'string' },
  },
  required: ['transcript', 'score', 'hits', 'missed', 'mispronounced', 'comment'],
  propertyOrdering: ['transcript', 'score', 'hits', 'missed', 'mispronounced', 'comment'],
} as const;

const COMMENT_RULES_ZH = `- comment: ONE short Simplified Chinese sentence (20-40 chars) giving the most actionable improvement tip
- comment must be in Simplified Chinese.
- If the audio is silent or unintelligible, set transcript to "" and score to 0; comment should say "未识别到您的朗读，请再试一次。"`;

const COMMENT_RULES_EN = `- comment: ONE short English sentence (10-25 words) giving the most actionable improvement tip
- comment must be in English.
- If the audio is silent or unintelligible, set transcript to "" and score to 0; comment should say "No speech detected. Please try recording again."`;

const PROMPT_TEMPLATE = (original: string, language: FeedbackLanguage) => `You are a PTE Read Aloud examiner. The candidate was asked to read this sentence aloud:

"${original}"

Listen to their recording and return a JSON object with:
- transcript: a lowercase, punctuation-stripped transcript of what the candidate actually said
- score: integer 0-90 (PTE-style)
- hits: lowercase tokens from the original that the candidate read correctly
- missed: lowercase tokens from the original that the candidate skipped
- mispronounced: lowercase tokens from the original that the candidate read but with likely pronunciation error
${language === 'en' ? COMMENT_RULES_EN.split('\n')[0] : COMMENT_RULES_ZH.split('\n')[0]}

Rules:
- Only include tokens from the ORIGINAL sentence in hits / missed / mispronounced.
- Articles and prepositions ("the", "a", "an", "of", "in", "on", "to") are excluded from all three arrays unless the candidate clearly missed a content word.
- Score weights: 60% content (hit ratio), 30% pronunciation (mispronounced count), 10% completeness (no large skipped runs).
${language === 'en'
  ? COMMENT_RULES_EN.split('\n').slice(1).join('\n')
  : COMMENT_RULES_ZH.split('\n').slice(1).join('\n')}`;

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
    v.comment.length > 0 &&
    typeof v.transcript === 'string'
  );
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const audio = formData.get('audio');
  const original = formData.get('original');
  const explicitMime = formData.get('mimeType');
  const languageField = formData.get('language');

  if (
    !(audio instanceof Blob) ||
    typeof original !== 'string' ||
    original.length === 0 ||
    original.length > 500
  ) {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  // 10 MB safety cap on incoming audio.
  if (audio.size === 0 || audio.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const feedbackLanguage: FeedbackLanguage = languageField === 'zh' ? 'zh' : 'en';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'NO_API_KEY' }, { status: 500 });
  }

  // Gemini supports a number of audio MIME types. Map the browser's mimeType
  // to one Gemini accepts; webm/opus is supported as audio/webm.
  const browserMime = (typeof explicitMime === 'string' && explicitMime) || audio.type || 'audio/webm';
  const geminiMime = browserMime.split(';')[0].trim() || 'audio/webm';

  const arrayBuffer = await audio.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: PROMPT_TEMPLATE(original, feedbackLanguage) },
          { inline_data: { mime_type: geminiMime, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 4096,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    console.error('[score-audio] network error', err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => '');
    console.error('[score-audio] upstream non-2xx', upstream.status, errBody.slice(0, 500));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let raw: unknown;
  try {
    raw = await upstream.json();
  } catch (err) {
    console.error('[score-audio] upstream JSON parse error', err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  const text: unknown = (
    raw as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
    }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== 'string') {
    console.error('[score-audio] unexpected upstream shape', JSON.stringify(raw).slice(0, 500));
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error('[score-audio] model output not JSON', text.slice(0, 300), err);
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  if (!isRaMirrorScore(parsed)) {
    console.error(
      '[score-audio] model output failed schema validation',
      JSON.stringify(parsed).slice(0, 300),
    );
    return Response.json({ error: 'AI_FAILED' }, { status: 500 });
  }

  return Response.json(parsed);
}
