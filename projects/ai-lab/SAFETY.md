# Safety model and limits

## Trust boundaries

- Browser requests are untrusted. The backend repeats validation and requires a random session token. Same-origin checks supplement token authentication; there is no public login system.
- The LLM has no database credentials or write tools. Its one tool call is checked against an allowlist; unrecognized names or invalid arguments fail closed. Trial suggestions only populate a review form.
- Booking is a separate deterministic endpoint with server-created approval IDs. Plans expire after 10 minutes. User confirmation is mandatory. SQLite enforces one booking per slot and per approval plan in a transaction.
- Customer input never enters the HTML via `innerHTML`; the UI uses text nodes. Provider credentials never enter the frontend. Request traces retain IDs, statuses, source IDs, token usage (if supplied) and latency; they do not retain raw prompts or customer names/email.
- The backend database DOES retain demo names/email and consent for CRM records, plans and follow-up drafts. Use fictional data. It is not encrypted and has no automated record-retention policy; do not collect real customer data in this version.
- The outbox is a draft queue only. No email, WhatsApp or external webhook is invoked by this code.

## Controls are limited

The prompt-injection/privacy patterns are heuristics and are easy to evade with sufficiently different wording. They do not replace architectural isolation. The output validator checks citation presence and known IDs, not whether every claim follows from the evidence. A generated answer with valid citations can still be wrong. BM25 can retrieve irrelevant overlapping words; its score is not a confidence percentage. Model behavior must be evaluated separately.

The demo is single-user. A shared bearer token is not tenant isolation. Rate limits are in-process and appropriate only for localhost development. API bodies are capped at 8 KiB and questions at 1,500 characters; LLM calls have an 18-second timeout and output budgets. Traces retain the latest 500 records; expired unconfirmed plans are removed when a new plan is created.

## Suggested adversarial review before any deployment

Test indirect instructions in ingested documents, Unicode/encoded attacks, partial-grounding questions, unsupported discount/refund claims, concurrent slot claims, repeated confirmations, expired plans, provider timeouts, opt-out/deletion requests and cross-account access. Tests in this repo cover only a subset. Use a held-out dataset and human review, record actual failure rates, and document residual risks.

Custom document text and quarantined passages are also stored in the local SQLite database when backend mode is connected. Browser mode retains them in memory only. Filenames and text render through text nodes, never executable HTML. Library replacement is validated before persistence. The SHA-256-derived version is a content provenance label, not an access-control mechanism. Upload quarantine is a heuristic; no claim of complete prompt-injection detection is made.
