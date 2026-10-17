import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { build, productsHtml } from '../scripts/build.js';

const out = mkdtempSync(join(tmpdir(), 'df-'));
const pages = build(out);
for (const f of ['style.css', 'favicon.svg', 'src', 'fonts', 'img']) cpSync(f, join(out, f), { recursive: true });
const html = (p) => readFileSync(join(out, p, 'index.html'), 'utf8');
test.after(() => rmSync(out, { recursive: true, force: true }));

test('genera las páginas mínimas', () => {
  for (const p of ['', 'generador/', 'tutoriales/', 'sobre/', 'contacto/', 'privacidad/']) assert.ok(pages.includes(p), p);
  assert.ok(pages.filter((p) => p.startsWith('tutoriales/') && p !== 'tutoriales/').length >= 3);
  assert.ok(existsSync(join(out, '404.html')));
});

test('cada página tiene título único, descripción y canonical', () => {
  const titles = new Set();
  for (const p of pages) {
    const h = html(p);
    const title = h.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `título único en /${p}`);
    titles.add(title);
    const desc = h.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(desc && desc.length >= 70 && desc.length <= 200, `descripción de /${p} (${desc?.length})`);
    assert.match(h, /<link rel="canonical" href="https:\/\/[^"]+">/);
    assert.equal((h.match(/<h1[ >]/g) ?? []).length, 1, `un solo h1 en /${p}`);
  }
});

test('todos los enlaces y recursos internos existen', () => {
  for (const p of [...pages, '404.html']) {
    const file = p.endsWith('.html') ? join(out, p) : join(out, p, 'index.html');
    const h = readFileSync(file, 'utf8');
    for (const [, href] of h.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      if (/^(https?:|mailto:)/.test(href)) continue;
      const clean = href.split('?')[0];
      if (clean === '') continue; // ?plantilla=… sobre la página actual
      const target = clean.startsWith('/') ? join(out, clean) : resolve(dirname(file), clean);
      const ok = existsSync(target) && (!clean.endsWith('/') || existsSync(join(target, 'index.html')));
      assert.ok(ok, `/${p} enlaza a ${href}, que no existe`);
    }
  }
});

test('el generador tiene un formulario por plantilla y los botones anunciados', () => {
  const h = html('generador/');
  for (const id of ['movimiento', 'umbral', 'horario']) assert.match(h, new RegExp(`id="form-${id}"`));
  for (const id of ['copy', 'download', 'yaml', 'summary', 'requirements', 'warnings', 'docs']) assert.match(h, new RegExp(`id="${id}"`));
  assert.match(h, /<script type="module" src="\.\.\/src\/app\.js">/);
});

test('sin seguimiento ni publicidad, y sitemap/robots coherentes', () => {
  for (const p of pages) assert.doesNotMatch(html(p), /googletagmanager|google-analytics|adsbygoogle|gtag\(|facebook\.net/);
  const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, pages.length);
  assert.match(readFileSync(join(out, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/.+\/sitemap\.xml/);
});

test('recomendaciones: vacío no pinta nada; con afiliado muestra aviso y rel=sponsored', () => {
  assert.equal(productsHtml([]), '');
  const normal = productsHtml([{ name: 'A', url: 'https://example.org', why: 'x' }]);
  assert.doesNotMatch(normal, /afiliado/i);
  const aff = productsHtml([{ name: 'B', url: 'https://example.org/b', why: 'y', affiliate: true }]);
  assert.match(aff, /Enlaces de afiliado/);
  assert.match(aff, /rel="sponsored noopener"/);
});
