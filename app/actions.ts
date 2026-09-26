'use server';

import type { DecodeResult } from '@/lib/types';

const MODEL = 'openai/gpt-oss-20b';

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing. Add it in your environment settings.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Groq API error:', response.status, JSON.stringify(data));
    throw new Error(data.error?.message || `Groq request failed (status ${response.status})`);
  }

  return data.choices[0].message.content;
}

async function callGroqWithRetry(prompt: string, attempts = 3): Promise<string> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await callGroq(prompt);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function decodeMessage(inputText: string) {
  if (!inputText || !inputText.trim()) {
    return { ok: false as const, error: 'Please provide valid text.' };
  }

  const prompt = `You are an expert linguistic parser for code-switched, informal, phonetically-spelled text (like Hinglish, Spanglish, etc.).

Analyze this input: "${inputText}"

Respond ONLY with a valid JSON object matching this exact structure, no other text:
{
  "normalizedEnglish": "clean, natural English translation",
  "detectedLanguages": ["Hindi", "English"],
  "nativeScript": "the text rendered in its native script",
  "scriptNames": ["Devanagari"],
  "intent": "core action or goal, empty string if none",
  "locations": ["any places mentioned"],
  "times": ["any times mentioned"]
}
If a field has no data, use an empty string or empty array as appropriate — never omit a key.`;

  try {
    const raw = await callGroqWithRetry(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const data: DecodeResult = {
      normalizedEnglish: parsed.normalizedEnglish ?? '',
      detectedLanguages: Array.isArray(parsed.detectedLanguages) ? parsed.detectedLanguages : [],
      nativeScript: parsed.nativeScript ?? '',
      scriptNames: Array.isArray(parsed.scriptNames) ? parsed.scriptNames : [],
      intent: parsed.intent ?? '',
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      times: Array.isArray(parsed.times) ? parsed.times : [],
    };

    return { ok: true as const, data };
  } catch (error: any) {
    console.error('Decode Error:', error);
    return { ok: false as const, error: error.message || 'Failed to parse text.' };
  }
}
