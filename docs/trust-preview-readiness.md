# Chahos Agency — Portfolio / Trust / SEO readiness (Preview only)

This checklist controls what can be truthfully published if the owner later approves a merge. **Nothing in this Preview branch is authorization to publish to Production or to contact people.**

## Project evidence and consent

| Entry | What can currently be shown | Approval / follow-up before claiming client results |
|---|---|---|
| Motiva | Commerce storefront prototype; products, prices, ordering flow | Confirm whether the customer has accepted the work, provide owner-approved screenshots and a currently working URL. The old public preview may have expired. |
| Step by Step Gym | Responsive fitness website and front-end member/admin concept, classes, subscriptions and digital cards | Confirm client status, screenshots, production backend status, and permission to use gym branding. |
| MATAR Construction | Presented HTML concept with services, construction portfolio and contact | Replace placeholder images and fake project names before portraying it as a real delivered client project. Consent for the Matar brand needed before public customer case study. |
| Chahos AI Lab | Three engineering demos: knowledge retrieval, lead review, reliability evaluations | Use **Technical demo**, not a live customer automation deployment or a CRM performance result. |

Measured outcomes like "+X% sales", "saved Y hours" or confirmed conversion impact **must not appear** without supporting evidence.

## Testimonials — owner-controlled outreach (not sent)

Ask up to three relevant project contacts for a brief *optional* review, only if there was a real engagement. Do not represent a concept recipient as an existing paying client.

Suggested message:

> Hello! I’m putting together a small Chahos Agency portfolio. If you’re comfortable, could you share one or two sentences about your experience with our work and what was useful? I would only display your quote with your approval, alongside the business name or attribution you choose. No pressure.

Before publishing verify the **exact wording**, permission, attribution, and business relationship. Leave client testimonial sections hidden until at least one permissioned quote exists.

## Pricing decision

**Not yet owner-approved:** prices, currencies, scopes, maintenance terms, or discounts.

Preview text uses **Custom quote after project brief**, not invented starting prices. Before publishing price floors, collect an owner-approved price floor per service, what the price includes, and disclaimers for extra integrations / support. Do not publish a "$X starting from" number without sign-off.

## Arabic pages

- `/ar.html` translates homepage content in readable professional Arabic.
- `/services-ar.html` translates service examples. Links lead to the existing interactive demos (currently mainly English).
- Arabic booking form and AI Lab demo content are **not** fully translated in this phase. Arabic chat input and replies remain supported where the assistant supports them.
- Review with a native speaker before a live release; avoid machine-translated marketing clichés.

## Analytics / SEO

- Vercel Web Analytics pageview snippet is **staged in Preview only** for homepage, examples, portfolio, Arabic pages and booking.
- **Activation not confirmed.** Vercel project owner must enable Web Analytics in the dashboard, then check that `/_vercel/insights/script.js` loads and pageview events appear. Do not claim live traffic tracking yet.
- No Google Analytics tracking IDs or cookies were added. Do not include private secrets or personal data in analytics events.
- Sitemap preview includes `/work.html`, `/ar.html`, `/services-ar.html`. Canonical and hreflang tags should be inspected.
- Mobile and desktop tests (390px / 768px / 1440px) check new navigation, no overflow, interactive examples, and booking hand-off.

## Release gate

- Keep PR **Draft**, base main; do not merge or promote.
- QA: site-integrity, premium-ui static + browser, AI Lab regression.
- Obtain owner approval to publish portfolio statuses, quotes, any prices, and Arabic text.
- Only then review Production SEO / tracking configuration separately.
