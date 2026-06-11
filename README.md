# Muhammad Arslan Riaz — Portfolio with RAG AI Assistant

A corporate-professional portfolio built with **Next.js 14**, featuring a live **RAG chatbot** powered by an **Express.js** backend, **Google Gemini** and **Qdrant**.

```
arslan-portfolio/
├── frontend/                  Next.js 14 (App Router, TypeScript, Tailwind)
│   ├── src/data/              ★ ALL website content lives here — edit these JSON files only
│   │   ├── site.json          name, tagline, nav, contact, SEO
│   │   ├── profile.json       about text, stats, AI focus section
│   │   ├── skills.json        skill groups
│   │   ├── experience.json    jobs + education
│   │   └── projects.json      featured + more projects
│   ├── src/components/        one component per section
│   │   └── chat/ChatWidget.tsx  floating RAG chat UI
│   ├── src/lib/chatBus.ts     lets any button open the chat
│   └── public/                CV pdf, images
│
└── backend/                   Express RAG API
    ├── src/
    │   ├── index.js           server entry
    │   ├── config.js          ★ all settings (models, topK, rate limits)
    │   ├── routes/            /api/chat (rate-limited)
    │   ├── controllers/       request validation
    │   ├── services/
    │   │   ├── gemini.service.js   embeddings + generation
    │   │   ├── qdrant.service.js   vector store
    │   │   └── rag.service.js      retrieval → prompt → answer + history
    │   ├── middleware/        error handler
    │   └── utils/chunker.js   text chunking
    ├── scripts/ingest.js      ★ builds the knowledge base
    └── knowledge/*.md         ★ extra free-text knowledge for the bot
```

## How the RAG pipeline works

1. **Ingest** (`npm run ingest`): reads the *same JSON files that render the website* plus any markdown in `backend/knowledge/`, converts them to natural-language documents, chunks them, embeds each chunk with Gemini `text-embedding-004`, and stores vectors in a Qdrant collection.
2. **Ask**: the chat widget POSTs to `/api/chat`. The backend embeds the question, retrieves the top-5 most similar chunks from Qdrant, builds a grounded system prompt, and asks `gemini-2.0-flash` to answer **only from that context**. Per-session chat history is kept in memory.

Because the knowledge base is generated from the website's own data files, **updating your portfolio updates your chatbot** — just re-run the ingest script.

## Setup

### 1. Qdrant (pick one)

**Local (Docker):**
```bash
docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Cloud (free tier):** create a cluster at https://cloud.qdrant.io and note the URL + API key.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env       # add your GEMINI_API_KEY (free: https://aistudio.google.com/apikey)
npm run ingest             # build the knowledge base (run again after content changes)
npm run dev                # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # points to http://localhost:4000 by default
npm run dev                  # http://localhost:3000
```

## How to change things

| I want to change…            | Edit…                                            |
|------------------------------|--------------------------------------------------|
| Name, tagline, links, nav    | `frontend/src/data/site.json`                    |
| About text, stats, AI section| `frontend/src/data/profile.json`                 |
| Skills                       | `frontend/src/data/skills.json`                  |
| Jobs / education             | `frontend/src/data/experience.json`              |
| Projects                     | `frontend/src/data/projects.json`                |
| What the chatbot knows extra | add `.md` files in `backend/knowledge/`          |
| Colors / fonts               | `frontend/tailwind.config.ts` + `src/app/layout.tsx` |
| LLM model, topK, rate limit  | `backend/src/config.js`                          |

**After any content change**, run `cd backend && npm run ingest` so the chatbot learns it.

## Deployment

- **Frontend** → Vercel (set `NEXT_PUBLIC_API_URL` to your backend URL).
- **Backend** → Railway / Render / a VPS / AWS. Set `GEMINI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, and `CORS_ORIGINS=https://your-domain.com`.
- **Qdrant** → Qdrant Cloud free tier is the easiest for production.

## API

`POST /api/chat`
```json
{ "message": "What AI projects has Arslan built?", "sessionId": "abc123" }
```
Response:
```json
{ "answer": "…", "sources": ["project: Portfolio AI Assistant", "ai-expertise"] }
```

`GET /health` → `{ "status": "ok" }`
