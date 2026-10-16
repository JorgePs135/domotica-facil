// Interfaz del generador. Todo ocurre en el navegador: no se envía nada a ningún servidor.
import { TEMPLATES, generate } from './generator.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const tool = $('#generator');
const output = $('#output');
const touched = new Set();
let current = null;
let result = null;
const ids = {}; // id estable por plantilla mientras la página esté abierta (formato de archivo propio)

const form = (tpl) => $(`#form-${tpl}`);
const fieldEl = (tpl, name) => $(`[name="${name}"]`, form(tpl));

function readValues(tpl) {
  const raw = {};
  for (const f of TEMPLATES[tpl].fields) {
    if (f.type === 'checkbox') raw[f.name] = fieldEl(tpl, f.name).checked;
    else if (f.type === 'weekdays') raw[f.name] = $$(`[name="${f.name}"]:checked`, form(tpl)).map((i) => i.value);
    else raw[f.name] = fieldEl(tpl, f.name).value;
  }
  return raw;
}

function writeValues(tpl, values) {
  for (const f of TEMPLATES[tpl].fields) {
    const v = values[f.name];
    if (f.type === 'checkbox') fieldEl(tpl, f.name).checked = Boolean(v);
    else if (f.type === 'weekdays') $$(`[name="${f.name}"]`, form(tpl)).forEach((i) => { i.checked = (v ?? []).includes(i.value); });
    else fieldEl(tpl, f.name).value = v ?? '';
  }
}

const fmt = () => $('input[name="format"]:checked').value;

function list(el, items, render) {
  el.replaceChildren(...items.map((it) => { const li = document.createElement('li'); render(li, it); return li; }));
  el.closest('[data-hide-empty]')?.toggleAttribute('hidden', !items.length);
}

function render({ showAll = false } = {}) {
  const tpl = current;
  const values = readValues(tpl);
  result = generate(tpl, values, { id: (ids[tpl] ??= `domotica_facil_${Date.now()}`) });
  const v = result.values;

  // Campos condicionales (p. ej. la entidad notify solo para el aviso al móvil).
  for (const f of TEMPLATES[tpl].fields) {
    if (!f.showIf) continue;
    const wrap = $(`[data-field="${f.name}"]`, form(tpl));
    wrap.hidden = v[f.showIf[0]] !== f.showIf[1];
  }
  // Errores junto a cada campo: solo en los que ya se han tocado, salvo al pulsar «Generar».
  for (const f of TEMPLATES[tpl].fields) {
    const msg = result.errors[f.name];
    const show = msg && (showAll || touched.has(`${tpl}.${f.name}`));
    const err = $(`#err-${tpl}-${f.name}`);
    if (!err) continue;
    err.textContent = show ? msg : '';
    $$('input, select', $(`[data-field="${f.name}"]`, form(tpl))).forEach((i) => i.toggleAttribute('aria-invalid', Boolean(show)));
  }

  const ok = result.ok;
  $('#out-ok').hidden = !ok;
  $('#out-pending').hidden = ok;
  $('#copy').disabled = !ok;
  $('#download').disabled = !ok;
  $$('[data-format]').forEach((el) => { el.hidden = el.dataset.format !== fmt(); });
  if (!ok) {
    const labels = TEMPLATES[tpl].fields.filter((f) => result.errors[f.name]).map((f) => f.label);
    $('#pending-list').replaceChildren(...labels.map((l) => Object.assign(document.createElement('li'), { textContent: l })));
    $('#yaml').textContent = '';
    return;
  }
  $('#yaml').textContent = fmt() === 'archivo' ? result.listYaml : result.yaml;
  $('#summary').textContent = result.summary;
  list($('#requirements'), result.requirements, (li, t) => { li.textContent = t; });
  list($('#warnings'), result.warnings, (li, t) => { li.textContent = t; });
  list($('#docs'), result.docs, (li, d) => {
    const a = Object.assign(document.createElement('a'), { href: d.url, textContent: d.label, rel: 'noopener' });
    li.append(a);
  });
}

function select(tpl, { focus = false } = {}) {
  current = tpl;
  $$('.tpl-form').forEach((f) => { f.hidden = f.id !== `form-${tpl}`; });
  $(`input[name="template"][value="${tpl}"]`).checked = true;
  $('#out-title').textContent = `Plantilla ${TEMPLATES[tpl].letter}: ${TEMPLATES[tpl].title}`;
  const url = new URL(location.href);
  url.searchParams.set('plantilla', tpl);
  history.replaceState(null, '', url);
  render();
  if (focus) $('input, select', form(tpl))?.focus();
}

function flash(btn, text) {
  const status = $('#action-status');
  status.textContent = text;
  btn.classList.add('done');
  setTimeout(() => { btn.classList.remove('done'); status.textContent = ''; }, 2500);
}

async function copy() {
  const text = $('#yaml').textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Sin permiso de portapapeles (p. ej. página abierta como archivo): copia seleccionando el texto.
    const range = document.createRange();
    range.selectNodeContents($('#yaml'));
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    if (!document.execCommand('copy')) return flash($('#copy'), 'No se pudo copiar: selecciona el código y pulsa Ctrl+C.');
    getSelection().removeAllRanges();
  }
  flash($('#copy'), 'Código copiado al portapapeles.');
}

function download() {
  const slug = result.values.alias.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'automatizacion';
  const name = fmt() === 'archivo' ? 'automatizaciones_domotica_facil.yaml' : `${slug}.yaml`;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([$('#yaml').textContent], { type: 'text/yaml;charset=utf-8' })),
    download: name,
  });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  flash($('#download'), `Descargado ${name}.`);
}

tool.addEventListener('input', (e) => {
  if (e.target.name === 'template') return select(e.target.value);
  if (e.target.name === 'format') return render();
  if (e.target.closest('.tpl-form') && e.type === 'input' && e.target.type !== 'text') touched.add(`${current}.${e.target.name}`);
  render();
});
tool.addEventListener('focusout', (e) => {
  if (!e.target.closest?.('.tpl-form')) return;
  touched.add(`${current}.${e.target.name}`);
  render();
});
$$('.tpl-form').forEach((f) => f.addEventListener('submit', (e) => {
  e.preventDefault();
  render({ showAll: true });
  if (result.ok) output.focus();
  else $('[aria-invalid]', form(current))?.focus();
}));
$$('[data-action="example"]').forEach((b) => b.addEventListener('click', () => {
  writeValues(current, TEMPLATES[current].example);
  render({ showAll: true });
}));
$$('[data-action="reset"]').forEach((b) => b.addEventListener('click', () => {
  writeValues(current, Object.fromEntries(TEMPLATES[current].fields.map((f) => [f.name, f.default ?? (f.type === 'weekdays' ? [] : '')])));
  [...touched].filter((k) => k.startsWith(current + '.')).forEach((k) => touched.delete(k));
  render();
}));
$('#copy').addEventListener('click', copy);
$('#download').addEventListener('click', download);

const initial = new URLSearchParams(location.search).get('plantilla');
select(TEMPLATES[initial] ? initial : 'movimiento');
