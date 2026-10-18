# Chahos Agency — site audit & safe rollout (2026-10-18)

## Verified from GitHub / Vercel metadata

- Production Git commit before these changes: `6bc9ddd03af5d30ea631690aecd8a7cab16167a9` on `main`; Vercel deployment was `READY`.
- Git comparison with the pre-assistant main commit confirmed the homepage and base booking page were unchanged by the assistant rollout.
- The CRM deal workflow remains in separate draft PR #10 (`feat/reviewed-crm-enquiries`), not merged into production.
- Vercel production settings reported `ASSISTANT_CHAT_ENABLED=true` and `ASSISTANT_CRM_ENABLED=false` during audit. Configuration flags alone do not prove Gemini's live response quality.
- `public/proof-content.js` deliberately contains empty approved projects/testimonials lists. Do not publish fabricated client quotes or results.
- Automatic protected-deployment fetch returned 403, so rendered production/preview and real external integrations were **not** certified in this audit.

## Fixed in this branch

1. Correct malformed gym/fitness option in the project booking form.
2. Add public AI Projects, AI Assistant and AI Lab to the XML sitemap.
3. Add canonical URLs for those three AI pages and basic social metadata for AI Projects.
4. Distinguish browser-only AI Lab demos from the separately gated live agency assistant, CRM and manual WhatsApp flow.
5. Add a no-secret Node test and GitHub workflow to catch future form, sitemap and canonical regressions.

## Important owner-only configuration actions (not changed here)

- Vercel environment inventory included `HUBSPOT_PRIVATE_APP_TOKEN` targeting **production**, even though a test token was intended for the CRM Preview. Confirm its owner and test portal before moving it to Preview branch `feat/reviewed-crm-enquiries`; keep production CRM disabled.
- The inventory included `UPSTASH_REDIS_REST_URL` under general Preview, CRM Preview and the older `feat/industry-ai-experiences` branch. Do **not** overwrite production Redis or guess which URL each key represents.
- CRM Preview must have a **matching** branch-scoped `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ASSISTANT_HASH_SECRET` and test-only HubSpot token. The token created from the temporary Upstash database appeared in a chat screenshot; replace before accepting real customer data. Its temporary lifespan also makes it unsuitable for a production workflow.
- Keep `ASSISTANT_CRM_ENABLED=false` in production. Activate only after isolated-portal end-to-end tests, approved pipeline/stages and explicit owner approval. No secrets should be put into git, screenshots or this document.

## Work requiring real evidence, access or owner decisions

- Collect written permission for real client case studies, screenshots, measurable outcomes and testimonials. Only then fill `public/proof-content.js`. Target: problem → what we built → validated result.
- Verify deployment Preview and Production visually on desktop and mobile, plus Lebanese and Arabizi model responses, book-project WhatsApp handoff, and mobile CTA usability.
- Verify Google Search Console coverage/indexing separately; a sitemap file or verification tag does not prove indexing. Submit the updated sitemap only after deployment.
- Review CRM PR #10 and test against a **separate HubSpot developer test account** without real customer data.
- The new site-integrity tests are deterministic code checks, not browser acceptance tests or proof of paid SEO performance.

## Release order

1. Check this PR's CI and Preview visually, then merge this site-only fix separately.
2. Resolve Vercel configuration scope and credentials without touching live assistant variables.
3. Verify CRM Preview using fictional records, branch-specific secrets and an isolated datastore.
4. Fill verified case studies/testimonials and improve SEO coverage after publishing them.
