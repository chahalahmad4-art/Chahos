import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(path.join(root, name), 'utf8');
const site = 'https://chahosagency.vercel.app';

test('sitemap lists canonical public pages without duplicates or broken local targets', () => {
  const xml = read('public/sitemap.xml');
  const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.ok(xml.includes('<urlset ') && xml.includes('</urlset>'));
  assert.equal(new Set(entries).size, entries.length, 'duplicate sitemap URL');
  for (const route of ['/', '/services.html', '/book-project.html', '/ai-projects.html', '/assistant/', '/ai-lab/']) {
    assert.ok(entries.includes(site + route), 'missing sitemap route ' + route);
  }
  for (const entry of entries) {
    const url = new URL(entry);
    assert.equal(url.origin, site);
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname.endsWith('/') ? path.join(pathname, 'index.html') : pathname;
    assert.ok(existsSync(path.join(root, 'public', relative)), 'missing local file for ' + entry);
  }
});

test('industry chooser has correctly formed gym option and retains WhatsApp handoff', () => {
  const html = read('public/book-project.html');
  assert.match(html, /<option value="fitness">Gym & fitness<\/option>/);
  assert.doesNotMatch(html, /<\/option\s+[^>]+>/);
  assert.match(html, /id="project-form"/);
  assert.match(html, /Continue to WhatsApp/);
  assert.match(html, /id="whatsapp-fallback"/);
});

test('important AI pages have matching canonical URLs', () => {
  const pages = [
    ['public/ai-projects.html', '/ai-projects.html'],
    ['public/assistant/index.html', '/assistant/'],
    ['public/ai-lab/index.html', '/ai-lab/']
  ];
  for (const [file, route] of pages) {
    const html = read(file);
    const canonical = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"\s*>/g)];
    assert.equal(canonical.length, 1, file + ' needs exactly one canonical');
    assert.equal(canonical[0][1], site + route);
  }
});

test('AI Lab browser demos are not described as live CRM or AI', () => {
  const html = read('public/ai-projects.html');
  assert.match(html, /AI Lab industry demos do not make live model calls or external CRM writes/);
  assert.match(html, /separate Chahos Agency assistant shows its live AI and CRM availability/);
  assert.match(html, /href="assistant\/"/);
});

test('homepage keeps mobile booking CTA and the project form route', () => {
  const html = read('public/index.html');
  assert.match(html, /mobile-project-cta/);
  assert.match(html, /book-project.html/);
  assert.match(html, /ai-projects.html/);
});
