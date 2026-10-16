# Tallal AI — Multi-Model Chatbot

A standalone AI chatbot website with secure server-side adapters for **OpenAI, Claude, Gemini and Perplexity Search**.

## Important model note

This project does not copy or retrain proprietary models. It gives one interface to provider APIs and keeps each secret on the server. Provider usage may incur charges according to each provider's account and model pricing.

## Features

- Model selector: OpenAI, Claude, Gemini and Perplexity Search.
- General-purpose assistant mode.
- Perplexity current-information/search mode with citations.
- Conversation history sent only to the selected provider.
- Serverless `/api/chat` router.
- No provider key in frontend or Git history.
- Mobile responsive standalone website.
- Easy iframe/embed path for other websites.

## Required Vercel environment variables

Add these in **Vercel Project Settings → Environment Variables**:

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GOOGLE_GENERATIVE_AI_API_KEY
PERPLEXITY_API_KEY
```

Use Production (and Preview if desired). Redeploy after saving variables.

## Run locally

```bash
npm install
npx vercel dev
```

Copy `.env.example` to `.env.local`, add keys locally, and never commit that file.

## Deploy

This repository is Vercel-ready. The API route is `api/chat.js` and the standalone UI is `index.html`.

## Embed on another website

After deployment, add a link or iframe to the standalone URL. For a production embed, use an iframe with a minimum height of 700px:

```html
<iframe src="https://YOUR-CHATBOT-DOMAIN.vercel.app" title="Tallal AI" style="width:100%;min-height:700px;border:0;border-radius:16px"></iframe>
```

Do not put provider keys in the embedding website.
