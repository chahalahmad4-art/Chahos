# Portfolio case studies — accurate first-version wording

## SourceDesk — Evidence-backed business assistant

**Problem:** Small-business enquiries need answers tied to actual service information.

**Built:** A BM25 retrieval pipeline over a versioned fictional business corpus, source inspection, unknown-topic abstention and an optional server-side LLM generator with citation checks. Supports English, Arabic and selected Arabizi keywords; not comprehensive multilingual understanding.

**Engineering evidence:** Inspect retrieved passages and source IDs; demonstrate unknown-question abstention; run retrieval regression cases.

**Limits:** Five seed documents, lexical search, no uploads or embedding/vector database. Live model behavior not yet verified.

## LeadFlow — Human-approved AI sales workflow

**Problem:** Turning enquiries into bookings requires reliable actions, consent and duplicate prevention.

**Built:** Optional bounded LLM tool selection, deterministic validation and qualification, expiring approval plans, a SQLite demo CRM, transactional booking, idempotent confirmation and follow-up drafts. Browser mode uses a rule-based router.

**Engineering evidence:** Submit an enquiry: there is no booking yet. Review and confirm: one CRM record appears. Replay confirmation: no duplicate. Competing booking: rejected.

**Limits:** Fictional availability; no live calendar, WhatsApp or external CRM. n8n receipt scaffold provided but not live-tested. No actual outbound messages.

## TrustBench — Evaluation and safety workbench

**Problem:** AI features need reproducible checks and visible failures.

**Built:** An 18-case deterministic regression suite with actual pass/fail calculation, request metadata traces, measured p95 latency, safety interventions, downloadable reports and CI tests for backend controls.

**Engineering evidence:** Run the suite yourself, compare expected/observed outputs, inspect request traces, review test source and CI logs.

**Limits:** A small authored dataset, not a held-out benchmark; no live-model quality evaluation, distributed telemetry or production SLA.

## 90-second demo

1. SourceDesk: ask “gym membership price”; open its source. Ask an unrelated question and show abstention.
2. LeadFlow: request a boxing trial, fill fictional details, review the proposed actions and confirm. Show the CRM record and that no follow-up was sent.
3. TrustBench: run the 18 cases and inspect the results. Show query traces and source IDs.
4. Open the backend tests and explain idempotency, consent and the no-write-tools boundary.

CV wording: “Built three connected AI portfolio prototypes covering source-grounded retrieval, human-approved agent workflows, SQLite persistence, regression evaluations and safety controls; implemented optional server-side LLM adapters and CI tests.”

Do not claim client revenue uplift, production readiness, guaranteed safety or live deployments of the backend. Add those claims only when independently demonstrated. Understand the implementation and its trade-offs before presenting it in interviews.
