const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const providers = {
  openai: { label: 'OpenAI', model: 'gpt-4o-mini' },
  anthropic: { label: 'Claude', model: 'claude-3-5-haiku-latest' },
  gemini: { label: 'Gemini', model: 'gemini-2.0-flash' },
  perplexity: { label: 'Perplexity Search', model: 'sonar' }
};

const system = `You are Tallal AI, a helpful general-purpose assistant created for Tallal Kiani. Answer clearly and accurately. You may discuss coding, AI, study, projects, career, general knowledge, and current information when web search is enabled. Never claim to have trained on proprietary ChatGPT, Claude, Gemini, or Perplexity models. Do not invent personal facts about Tallal. If a question asks for private or unknown information, say you do not have it. Use Markdown when helpful. Keep answers concise but useful.`;

function messagesFor(history, prompt) {
  const safe = Array.isArray(history) ? history.slice(-12) : [];
  return [...safe, { role: 'user', content: String(prompt).slice(0, 12000) }].map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 12000)
  }));
}

async function callOpenAI(messages) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'}, body:JSON.stringify({model:providers.openai.model, messages:[{role:'system',content:system},...messages], temperature:.4}) });
  const data = await r.json(); if (!r.ok) throw new Error(data.error?.message || 'OpenAI request failed');
  return { text:data.choices?.[0]?.message?.content || '', citations:[] };
}

async function callAnthropic(messages) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'}, body:JSON.stringify({model:providers.anthropic.model,max_tokens:1800,system,messages}) });
  const data = await r.json(); if (!r.ok) throw new Error(data.error?.message || 'Claude request failed');
  return { text:(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n'), citations:[] };
}

async function callGemini(messages) {
  const contents = messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${providers.gemini.model}:generateContent?key=${encodeURIComponent(process.env.GOOGLE_GENERATIVE_AI_API_KEY)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{temperature:.4,maxOutputTokens:1800}}) });
  const data = await r.json(); if (!r.ok) throw new Error(data.error?.message || 'Gemini request failed');
  return { text:data.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('') || '', citations:[] };
}

async function callPerplexity(messages) {
  const r = await fetch('https://api.perplexity.ai/chat/completions', { method:'POST', headers:{'Authorization':`Bearer ${process.env.PERPLEXITY_API_KEY}`,'Content-Type':'application/json'}, body:JSON.stringify({model:providers.perplexity.model,messages:[{role:'system',content:system+' Use web search for current facts and include useful source links.'},...messages],temperature:.2}) });
  const data = await r.json(); if (!r.ok) throw new Error(data.error?.message || 'Perplexity request failed');
  return { text:data.choices?.[0]?.message?.content || '', citations:data.citations || [] };
}

export default async function handler(req, res) {
  Object.entries(cors).forEach(([k,v])=>res.setHeader(k,v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Use POST /api/chat'});
  const {provider='openai', prompt, history=[]} = req.body || {};
  if (!prompt || String(prompt).trim().length < 1) return res.status(400).json({error:'A prompt is required.'});
  if (!providers[provider]) return res.status(400).json({error:'Unknown provider.'});
  const envKey = {openai:'OPENAI_API_KEY',anthropic:'ANTHROPIC_API_KEY',gemini:'GOOGLE_GENERATIVE_AI_API_KEY',perplexity:'PERPLEXITY_API_KEY'}[provider];
  if (!process.env[envKey]) return res.status(503).json({error:`${providers[provider].label} is not configured yet. Add ${envKey} in Vercel Project Settings → Environment Variables.`});
  try {
    const messages=messagesFor(history,prompt);
    const result = provider==='openai' ? await callOpenAI(messages) : provider==='anthropic' ? await callAnthropic(messages) : provider==='gemini' ? await callGemini(messages) : await callPerplexity(messages);
    return res.status(200).json({provider,model:providers[provider].model,...result});
  } catch (error) { return res.status(502).json({error:error.message || 'Provider request failed.'}); }
}
