# Chahos Agency — Preview review checklist

This branch is **PREVIEW ONLY**. Do not merge to `main` without the owner's approval.

## Implemented
- Fixed `Projects` shortcut by replacing it with **Our Work**, leading to `/work.html`.
- Kept a consistent **Chahos Agency** wordmark and copy.
- Refined homepage benefit-led service descriptions.
- Added three compact featured work entries to homepage, a fourth MATAR project on the dedicated portfolio, and an editorial case-study page.
- Clearly label prototype/demo status and refrain from inventing metrics, customers or live integrations.
- Added short **Discover → Design & build → Launch** flow on homepage.
- Kept pricing **scope-based** until actual approved rate floors exist.
- Created professional Arabic homepage and Arabic services showcase with proper `lang`, `dir`, and alternate URLs.
- Added canonical/sitemap entries, mobile and keyboard tests.
- Staged first-party Vercel Analytics script on marketing pages (NOT on AI chat page).

## Owner input required before merge
1. **Motiva:** final storefront URL or screenshot, customer approval if applicable, current deployed status, and any publishable results.
2. **Gym system:** previous preference was not to name the gym publicly. The preview uses **Gym membership system** without a client's name. Confirm any public screenshots/approval before adding them.
3. **MATAR:** supplied source is a construction **concept** with third-party placeholder imagery. Obtain permission for real photos before treating it as commissioned client work.
4. **LeadFlow:** clearly a demo with fictional records; no production CRM or client outcome is claimed.
5. **Testimonials:** request 2–3 actual client quotes, name, business type, and written consent. None are on site because no approved quotes were supplied.
6. **Prices:** choose real `starting from` prices and scope assumptions. No prices are invented or displayed in this preview.
7. **Analytics:** first-party tag is staged, but **Vercel Web Analytics must be enabled and checked in the Vercel dashboard**. Analytics API verification was not authorized with the connected scope. Do not claim pageview collection until confirmed.
8. **Arabic:** Arabic pages cover home and services. Inquiry form and demo pages remain linked in English. Decide if they should be translated in a later phase.
9. **Before publish:** test iPhone 390px, tablet 768px, desktop 1440px, home shortcuts, `/work.html`, Arabic switch, booking-to-WhatsApp. Obtain owner sign-off.

## Analytics and privacy
Only marketing pages load `/_vercel/insights/script.js`. Conversational/AI pages do not add this new tag. Any broader analytics instrumentation and privacy review require approval.

## SEO
Canonical host: https://chahosagency.vercel.app. Sitemap adds `/work.html`, `/ar/`, and `/ar/services.html`. Preview will not replace Production until merged.

No CRM environment variable, HubSpot adapter, agent runtime, or service token changed in this branch.
