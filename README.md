# Chahos Agency — Vercel-ready website

Complete independent static website: HTML, CSS, JavaScript and optimized WebP images.
No ChatGPT account, API key, database, npm dependencies or build step is required to run the website.

## Deploy with GitHub + Vercel

1. Extract this ZIP.
2. Create a GitHub repository. Upload the CONTENTS of the Chahos-Agency-Vercel folder: public/, vercel.json, README.md and IMAGE-CREDITS.json. Do not upload only the ZIP.
3. In Vercel, create a new project and import that repository.
4. Keep the Root Directory at the folder containing vercel.json.
5. Framework Preset: Other. Build Command: empty. Install Command: empty. Output Directory: public. These are already configured in vercel.json.
6. Select Deploy. Vercel provides the hosted URL after successful deployment.

If you uploaded the enclosing folder too, select Chahos-Agency-Vercel as the Root Directory.

## Alternatively: deploy from your computer

Install Node.js, open a terminal in this folder, then run:

```sh
npx vercel --prod
```

Sign in when asked and follow the project prompts. The configuration is included.

## Preview locally

From this folder, with Python installed:

```sh
python -m http.server 8000 --directory public
```

Open http://localhost:8000 in your browser. This is a local preview, not a public deployment.

## Included

- Home, services gallery and project request page.
- Eight independent sample websites: fitness, clinic, architecture, design, fashion, pharmacy, food and gifts.
- Responsive layouts, optimized images and return navigation.
- Project request form that prepares a WhatsApp message to Ahmad Chahal, +961 71 727 712.

The visitor must press Send inside WhatsApp to deliver the request. There is no automatic email delivery or server-side request storage.
Sample booking, membership and shopping interactions are illustrative; they do not place real orders or take payments.

## Editing

Home: public/index.html and public/style.css.
Services: public/services.html and public/gallery.css.
Project form: public/book-project.html, public/booking.js and public/booking.css.
Samples: public/samples/<industry>/index.html, public/samples/data.js, sample.js and sample.css.
Photos: public/assets/. Photo source information is in IMAGE-CREDITS.json.

Keep the directory structure intact. Each sample uses relative asset links.
Do not enable clean URLs without updating the page links. Keep trailingSlash enabled for sample directories.
This export does not change or delete the existing hosted Chahos Site.

## خطوات سريعة بالعربي

فك ضغط الملف، وارفع الملفات والمجلد public على GitHub، مش ملف ZIP نفسه.
اربط الـrepository مع Vercel واختار Other، وخلي Output Directory = public.
ما في Build Command ولا API keys مطلوبة. الإعدادات موجودة بملف vercel.json.
طلبات المشاريع بتوصل على واتساب بعد ما الزبون يكبس Send بواتساب.

## Deployment references

https://vercel.com/docs/builds/configure-a-build
https://vercel.com/docs/project-configuration/vercel-json
https://vercel.com/docs/deployments/overview


## Website updates — September 2026

The connected hero, mobile project actions, solution concepts, and share/SEO metadata are in `public/`. No build step or new dependencies are required.

Client proof is intentionally unpublished until real content is supplied. Edit `public/proof-content.js` to add approved projects (`name`, `type`, `work`, `result`, optional `url`) and testimonials (`quote`, `name`, `business`). Empty sections remain hidden. Describe only delivered work and substantiated results; obtain permission for public quotations and client names.

Canonical URLs, Open Graph metadata, robots.txt and sitemap.xml currently use https://chahosagency.vercel.app. Update those URLs when adopting a custom domain. The sharing image is public/assets/chahos-social.png (1200 × 630).

The hero supports keyboard navigation, manual pause and reduced-motion preferences. The mobile action bar preserves the existing back button and hides while sample dialogs are open. Concepts remain explicitly labeled as demos, with no live backend claims.
