# Chahos Agency assistant

Separate, deployable agency assistant at `/assistant/`. It leaves the homepage and eight fictional AI Lab experiences intact. The agency's real service descriptions live in `public/assistant/knowledge.mjs`; no fictional gym prices become agency facts.

## Delivered

- Natural Lebanese/Arabizi/English prompt, bounded conversation history and grounded Gemini chat adapter.
- A compact seven-document library supplied in full to the model. This is **full-context grounding, not semantic/vector RAG**. Existing AI Lab remains the lexical retrieval demonstration.
- A server-side Vercel function (`api/agency.mjs`), with no frontend credentials.
- HubSpot adapter: look up an email, create a missing contact, attach a reviewed enquiry as a note. Existing contact properties are not overwritten. Sender identity is unverified; staff must verify consequential requests.
- Separate consent and confirmation. Chat has no CRM tools or autonomous writes. No appointment creation, marketing enrolment or outbound messaging.
- Redis atomic daily global/per-IP caps and seven-day submission deduplication. Timeout/uncertain external writes remain locked; staff should inspect by request reference before retrying. A new request ID can create a new enquiry, so this does not claim identity-level deduplication forever.
- Metadata-only rolling telemetry (500 entries, seven-day TTL), privacy disclosure and offline fallback clearly labelled.

## What is NOT yet verified

No live Google, HubSpot or Upstash account has been connected in this development session. Provider contracts are tested with fakes. Deploying the code does not activate those services. No live-model accuracy result is available. The earlier 90–95% objective is not a measured achievement.

No embeddings/vector store, production admin dashboard, distributed abuse-proof identity system or automated CRM retention deletion is included. Prompt/citation heuristics do not prove factual correctness or complete resistance to injection.

## Activation checklist

1. In the Vercel project serving `chahosagency.vercel.app`, add the variables in `.env.example` as encrypted server environment variables. Never put them in `public/`, GitHub commits, screenshots or chat.
2. Google AI Studio: enable an appropriate Gemini API project and choose an available text model with JSON output support. Set `GEMINI_API_KEY` and `GEMINI_MODEL`. Check account eligibility, provider data handling and quotas. A consumer subscription should not be assumed to supply API credits.
3. HubSpot: create an account/private app; grant only the contacts/notes permissions required by the current HubSpot app UI (contacts read/write and note creation). Do not enable marketing permissions or workflows for this assistant. Set its private app token. Review the privacy disclosure and the CRM retention procedure before accepting public leads.
4. Upstash Redis: set the database REST URL/token; use a dedicated database or restricted credential. Generate `ASSISTANT_HASH_SECRET` with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` privately. Do not print it in an assistant session.
5. Start with `ASSISTANT_DAILY_REQUEST_LIMIT=100`. This caps request count, not money; configure provider-side quotas/billing controls as available. Input and output token limits are also bounded. Hosting/storage costs are separate.
6. Turn on `ASSISTANT_CHAT_ENABLED=true` and redeploy. The UI should show LIVE AI only after its readiness endpoint reports all required configuration. Check an actual successful provider request; readiness is configuration state, not a provider health guarantee.
7. Verify HubSpot in a test account with fictional details. Confirm exactly one associated note, repeat the same request reference, and confirm no duplicate note. Then enable CRM on the intended account (`ASSISTANT_CRM_ENABLED=true`) and redeploy. No automatic external messages should be configured on these records.
8. Test in public UI: Lebanese, Arabizi and mixed language; unknown prices; malicious prompts; consent missing; provider unavailable; retries; daily cap. Verify the original site and mobile form.
9. Before advertising an accuracy percentage, run a held-out, manually reviewed live-model benchmark. Report sample size, rubric, model, prompt/library versions, factual correctness and workflow success separately. Unit tests are not an LLM quality benchmark.

## Operations

- Kill switches: either enable variable set to false, followed by redeploy. Provider errors fail closed; CRM never reports success unless its note write is confirmed.
- `/api/agency` GET exposes only enabled flags and knowledge version. POST requires the configured Origin, validates size/schema/consent, then consumes a shared quota. Origin is not authentication; bots can reproduce it, so Redis caps remain essential and public users must not gain access to CRM reads.
- Redis keys: `chahos:<UTC-date>:global`, action/IP keyed hashes, `chahos:enquiry:<keyed-hash>` and `chahos:telemetry`. No raw chat/contact fields are written there. Request fingerprints are hashes. Vercel/provider infrastructure can still keep its own logs under account policy.
- Model output is textContent-only in the UI. CRM notes escape HTML. Known source IDs are validated, but source support must still be reviewed.
- Enquiries are not bookings or contractual quotes. Contact Ahmad for access/correction/deletion. Manual CRM deletion is required; there is no implemented retention scheduler.

## Verification

`node --test projects/ai-lab/tests/*.test.mjs projects/agency-assistant/tests/*.test.mjs`

Tests exercise missing setup, explicit consent, invalid payloads, grounded output validation, industry regression, limits, CRM replay/failure behavior and safe note formatting. Fake provider responses validate integration contracts only.
