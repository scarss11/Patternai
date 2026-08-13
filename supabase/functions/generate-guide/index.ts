// Supabase Edge Function: generate-guide
// Deploy:
//   supabase secrets set GEMINI_API_KEY=tu_api_key_de_google_ai_studio
//   supabase functions deploy generate-guide
//
// La API key NUNCA va en la app móvil — solo en secrets de Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) {
    return json({ error: 'GEMINI_API_KEY not configured in Supabase secrets' }, 503);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload: { title?: string; category?: string; language?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const title = payload.title?.trim();
  if (!title) {
    return json({ error: 'title is required' }, 400);
  }

  const category = payload.category?.trim() || 'general';
  const language = payload.language === 'en' ? 'en' : 'es';
  const langLabel = language === 'en' ? 'English' : 'Spanish';

  const prompt = `You are an expert at writing internal company guides for any industry (sales, operations, support, HR, tech, etc.).

Write a complete, practical guide in Markdown for the following topic.

Title: "${title}"
Category: ${category}
Language: ${langLabel}

Requirements:
- Use clear headings (##, ###), numbered steps, and bullet lists where helpful.
- Be professional and actionable for any team (not only developers).
- Include: objective, prerequisites (if any), step-by-step procedure, tips, and a short summary.
- Do NOT wrap the output in code fences.
- Output ONLY the markdown body (no title H1 at the top — the app already has the title).
- Length: about 400–800 words.`;

  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  const geminiData = await geminiRes.json().catch(() => ({}));
  if (!geminiRes.ok) {
    const errMsg = geminiData?.error?.message ?? `Gemini HTTP ${geminiRes.status}`;
    return json({ error: errMsg }, 502);
  }

  const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    return json({ error: 'Empty response from Gemini' }, 502);
  }

  return json({ content_md: text.trim() });
});
