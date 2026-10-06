# Chahos AI Lab

Three working engineering prototypes by Ahmad Chahal for Chahos Agency. They share a fictional gym dataset and a small framework-free runtime so reviewers can inspect the complete request path. This is a portfolio foundation, not a production SaaS or a client success story.

## Run locally

Requires Node 24. No npm installation or third-party runtime dependencies.

```sh
cd projects/ai-lab
npm test
npm start
```

Open `http://127.0.0.1:8787/ai-lab/`. Expand **Connect the local backend** and paste the token printed at startup. Without connecting, the page intentionally remains in its stateless browser demo mode. The server is bound to localhost and refuses non-local Host headers.

### Optional real LLM

Copy `.env.example` to `.env`. Set `LLM_API_KEY`, `LLM_MODEL`, and the complete HTTPS chat-completions URL in `LLM_ENDPOINT`. Your provider/model must support chat completions; LeadFlow also requires function/tool calling. Then run:

```sh
node --env-file=.env server.mjs
```

Secrets stay in the backend. Live provider requests can incur charges. No provider credentials were supplied for this version, so **live model quality and compatibility have not been verified**. Provider behavior is tested using deterministic stubs. A provider failure is shown as an error, not silently presented as a successful model answer.

## The three projects

| Project | Implemented | Evidence to show a reviewer |
|---|---|---|
| SourceDesk | TXT/Markdown ingestion, overlapping chunks, SHA-256 library versions, BM25 multilingual keyword retrieval, versioned corpus, cited extracts, abstention, optional grounded LLM response | Ask supported/unsupported questions; inspect source IDs and scores; compare extractive and model modes |
| LeadFlow | Optional LLM tool selection, allowlisted read-only handlers, argument validation, consent, expiring approval plans, transactional SQLite CRM/booking, unique slots, idempotency, follow-up draft outbox | Show that plan creation does not book, explicit confirmation does, repeat confirmation creates no duplicate |
| TrustBench | 18 deterministic evaluation cases, measured request latency/p95, metadata-only traces, bounded retention, downloadable reports, CI regression tests | Run the evaluation suite, inspect failures, trace blocked/unknown requests, inspect CI test evidence |

### Architecture

`public/ai-lab/core.mjs` holds deterministic retrieval and policy primitives shared between the browser and backend. `knowledge.mjs` is the versioned fictional corpus. `cases.mjs` holds the small evaluation dataset. `app.mjs` is the accessible demo UI. `server.mjs` serves local assets and authenticated API endpoints. `provider.mjs` handles optional grounded generation. `agent.mjs` selects and validates exactly one tool. `store.mjs` owns SQLite transactions and persistence.

### API

All API calls require `Authorization: Bearer <startup-token>`. POST requests require JSON. No cross-origin access.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Current mode and dataset/policy versions |
| POST | `/api/ask` | `{ "query": "boxing classes" }` |
| POST | `/api/agent` | `{ "message": "I want a boxing trial" }`; selects one safe tool |
| GET | `/api/slots` | Fictional future slot instants |
| POST | `/api/plan` | `{lead:{name,email,interest,consent,followUp},slot}`; 10-minute approval |
| POST | `/api/confirm` | `{planId,confirmed:true}`; atomic, idempotent write |
| GET | `/api/records` | Latest 100 confirmed demo CRM records |
| GET | `/api/outbox` | Latest 100 follow-up drafts; nothing is sent |
| GET | `/api/traces` | Latest 500 metadata-only request traces |
| POST | `/api/evals` | Run fixed deterministic evaluations |

## Evaluation and safety

```sh
node projects/ai-lab/evaluate.mjs > report.json
node --test projects/ai-lab/tests/*.test.mjs
```

The CI workflow uses the same commands. The 18-case browser suite checks known source retrieval, unknown topics, injection phrases, privacy requests, medical handoff, blank input and length limits. The server tests additionally cover auth, origin checks, malformed/oversized input, persistence, idempotency, consent, output citation checks and provider failures. See `SAFETY.md` for the trust boundaries.

**Do not interpret 100% on this small fixed suite as general accuracy or safety.** The suite does not evaluate live model hallucinations, prompt-injection robustness across paraphrases, semantic grounding, model drift, or production uptime. There is no independent held-out dataset yet. Add real business questions and human-graded model outputs before making quality claims.

## Website integration

The existing Chahos home page's Selected Work section now links to the three demo views. All portfolio descriptions explicitly identify prototypes. The static Vercel configuration is preserved: deploying it serves the browser demos, **not the Node/SQLite API**. Do not paste API keys into the static site. The optional local backend must be deployed separately only after proper production hardening; it is intentionally localhost-only here.

## n8n / CRM / WhatsApp boundary

`n8n/booking-receipt.json` is an **inactive workflow scaffold**, not a connected production integration. It accepts a synthetic `booking.confirmed` event, validates consent, and returns a receipt. It has no send-message, CRM, or calendar nodes. The local outbox can be exported manually and reviewed. Import compatibility was not tested against a live n8n instance.

To connect real systems: configure authenticated webhooks, a durable idempotency ledger, a real calendar adapter, approved messaging credentials/templates, opt-out handling, delivery retries and dead-letter alerts. Keep the human approval boundary. Do not expose the scaffold's webhook without authentication.

## What remains before a production SaaS claim

User accounts, tenant isolation, role permissions, persistent hosted storage/backups, encryption/retention/deletion policy, distributed rate limiting, hosted secrets, abuse protection, production deployment, semantic/vector retrieval, PDF ingestion/version rollback, a larger held-out evaluation dataset and live provider verification. Billing, real WhatsApp delivery and client results are not implemented.

The source is deliberately structured as a monorepo of three related projects. They are not three separately deployed SaaS products. See `PORTFOLIO.md` for accurate case-study wording and a demonstration script.

## Custom knowledge libraries

SourceDesk accepts up to five UTF-8 TXT or Markdown files, 32 KiB per file and 96 KiB combined. It creates overlapping passages up to 900 characters and assigns a SHA-256-derived version. Known instruction patterns quarantine individual passages; this heuristic can miss attacks and does not prove safety. Review your files before use. PDFs and embeddings are not supported.

In browser mode, text stays in memory and disappears on refresh. In local backend mode, POST `/api/knowledge` with `{files:[{name,text}]}` validates and persists the replacement library in SQLite; GET reads it, and POST `{reset:true}` restores the built-in dataset. Failed imports preserve the previous library. Retrieved passages are sent to the configured provider when LLM generation is enabled; the interface discloses this. Use non-sensitive demo files. LeadFlow and the fixed evaluation suite remain scoped to the gym dataset.
