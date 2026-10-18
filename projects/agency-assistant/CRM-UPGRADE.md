# Reviewed CRM enquiries — activation runbook

## Audit and scope
Audited origin/main 6bc9ddd. Existing: Gemini Lebanese/Arabizi/English chat, verified service context, Start Your Project CTA, consent/review form inside assistant, HubSpot contact lookup/create + associated note, Redis atomic locks, rate limits and privacy-safe telemetry. The booking page previously prepared WhatsApp only. These are extended, not rebuilt. No vector database or autonomous outbound agent is introduced.

Connected HubSpot read-only audit: portal 149509587 exposes contacts, notes and deals; Sales Pipeline `default` already exists. Portal reports onboarding incomplete. Connector access is NOT the website runtime token. Vercel environment-name inspection returned 403 for team chaho-s-projects; deployed flags/scopes cannot be certified. No secrets were read and no CRM records/configuration changed.

## New behavior
Booking offers a separate four-field review, explicit storage/contact consent and final confirmation. Nothing from chat is transferred. Existing manual WhatsApp remains independent. Both CRM UIs validate a matching received receipt, retain only reference/status in sessionStorage, and stop automatic retries after uncertain writes. Refresh within a tab does not create another request. Editing before confirmation invalidates review. A fresh tab/device can still submit a new enquiry: idempotency protects a request reference, not all possible repeated customer intent. Redis locks last seven days; do not manually retry old references without reconciliation.

Server fingerprints now use HMAC. Legacy outstanding fingerprints fail closed with conflict; reconcile those in HubSpot rather than replaying. Production CRM additionally requires explicit approval flag. Existing chat readiness is unchanged. Optional deal mode creates a native contact-associated deal instead of a note. Existing contact properties are never changed; submitted name is recorded in the enquiry. Sender identity is unverified. Consent is enquiry contact/storage only, not marketing subscription.

## Owner decisions and permissions (before live writes)
1. Authorize a separate HubSpot test portal/token and isolated Preview Redis. Do not use production records for tests. Finish portal onboarding only with owner authorization if needed.
2. Runtime token needs contacts read/write and (note mode) the permissions required by the notes endpoint; deal mode needs deals read/write plus pipeline read access. Confirm scopes in the private-app UI; connected ChatGPT permissions do not provision runtime credentials. Enter secrets only in Vercel secret settings, never chat, git or screenshots.
3. Approve the native pipeline/stage choice. Current default stages: appointmentscheduled, qualifiedtobuy, presentationscheduled, decisionmakerboughtin, contractsent, closedwon, closedlost. No stages were renamed. Do not treat Appointment Scheduled as New Lead. Recommended: owner-approved dedicated New Lead and Contacted stages in existing pipeline; retain Qualified To Buy / Presentation Scheduled / Contract Sent etc as appropriate, or approve renaming after reviewing existing deals and reports. Won/Lost already exist. No custom properties or extra CRM infrastructure required.
4. Grant the connected Vercel app access to team chaho-s-projects/project chahos-agency if deployment configuration assistance is wanted. Current API returns 403. Do not remove/reconnect unrelated accounts.

## Preview setup
Keep CRM disabled until credentials are verified as test-only. Use branch-scoped Preview values: ASSISTANT_CRM_ENABLED=true, ASSISTANT_CRM_TARGET=test; separate test HubSpot token, Redis and hash secret; HUBSPOT_ENQUIRY_MODE=deal; approved HUBSPOT_ENQUIRY_PIPELINE_ID and HUBSPOT_ENQUIRY_STAGE_ID. Existing note mode remains default when mode is absent. The target flag is an operator declaration, not proof of token ownership. Preview origin is exact VERCEL_URL, so use the deployment-specific URL for POST tests.

Run fictional test contact creation and association, existing-contact preservation, duplicate confirmation, failure/timeout and mobile flows in the test portal. Record reference IDs and clean test records only with authorized cleanup. The automated suite uses fake transports and Redis only; it does not prove real HubSpot authorization or production reliability.

## Production activation checklist
- [ ] Review and approve PR and Preview UI; confirm existing assistant/WhatsApp behavior.
- [ ] Complete test-portal end-to-end verification and reconcile all uncertain references.
- [ ] Approve native pipeline/stages and runtime token permissions; no marketing workflows.
- [ ] Verify production-only secrets and limits; never share test and production Redis.
- [ ] Owner explicitly approves enabling production CRM writes.
- [ ] Set ASSISTANT_CRM_PRODUCTION_APPROVED=true and ASSISTANT_CRM_ENABLED=true with validated mode/pipeline settings; redeploy approved revision.
- [ ] Check readiness, then perform an owner-approved controlled submission, verify CRM reference/contact association and no duplicate.
- [ ] Rollback: set CRM enabled false and redeploy; keep working chat and WhatsApp. Reconcile uncertain requests manually by reference; do not blindly replay.

## Operational limitations / analytics next
No automated WhatsApp, marketing enrollment or follow-up sending. Staff manage the native CRM stages manually. Review access/retention policy before launch; HubSpot records persist until staff delete them, while Redis telemetry expires in seven days. Session receipt stores only an opaque reference/status. A timeout can leave contact created without a deal/note; reconcile by reference and email privately in CRM. Origin checking is not authentication; public submissions are rate-limited unverified enquiries.

Later track only aggregate events: project CTA clicked, review opened, confirmation attempted, received, failed, and WhatsApp opened (NOT WhatsApp sent). Never include form fields, transcript, email, phone or reference in analytics. Respect consent requirements; no analytics vendor added here.

## Verification
Run: node --test projects/agency-assistant/tests/*.test.mjs projects/ai-lab/tests/*.test.mjs
Tests cover fake contact/note/deal creation, contact conflict, no overwrite, invalid pipelines, consent, concurrent duplicates, timeout/failure, false acknowledgements, origin/input checks, production gating, and existing Lebanese chat/CTA regressions. Real external CRM and Gemini behavior require separately authorized configured Preview verification.

Browser smoke: with Playwright and Chromium installed, run `node scripts/crm-browser-smoke.cjs` from repository root. It uses only localhost and mocked CRM; checks mobile consent/edit/submit, receipt refresh, cross-page guard, overflow, browser errors and manual WhatsApp. Local execution is blocked when Chromium is unavailable; installing it in this environment returned a corrupt/blocked download. Do not report this check as passed until it runs.
