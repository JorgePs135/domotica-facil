// Portada: el traductor en vivo, el índice de plantillas, los tres pasos y las entradas al hacer scroll.
// Sin este script la página sigue completa: el YAML del ejemplo y todas las plantillas ya vienen en el HTML.
import { TEMPLATES, generate } from './generator.js';
import { highlightYaml } from './highlight.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// 1. Traductor: la frase de la portada genera el YAML real con la plantilla A.
const form = $('#translator');
if (form) {
  const out = $('#t-yaml');
  const err = $('#t-error');
  const copy = $('#t-copy');
  const labels = { sensor: 'el sensor', target: 'la luz', minutes: 'los minutos' };
  const update = () => {
    const v = Object.fromEntries(new FormData(form));
    const r = generate('movimiento', { ...TEMPLATES.movimiento.example, ...v, brightness: '', onlyDark: false });
    for (const name of Object.keys(labels)) form.elements[name].toggleAttribute('aria-invalid', Boolean(r.errors[name]));
    const first = Object.keys(labels).find((k) => r.errors[k]);
    err.textContent = first ? `Revisa ${labels[first]}: ${r.errors[first]}` : '';
    copy.disabled = !r.ok;
    if (r.ok) out.innerHTML = highlightYaml(r.yaml.trimEnd()); // highlightYaml escapa el texto
    out.closest('pre').classList.toggle('stale', !r.ok);
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(out.textContent + '\n');
      copy.textContent = 'Copiado';
    } catch {
      copy.textContent = 'Selecciona y copia';
    }
    setTimeout(() => { copy.textContent = 'Copiar'; }, 2000);
  });
}

// 2. Índice de plantillas: cada nombre muestra su hoja.
const tabs = $$('[data-sheet]');
const show = (tab) => {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $(`#sheet-${t.dataset.sheet}`).toggleAttribute('data-off', !on);
  }
};
tabs.forEach((t, i) => {
  t.addEventListener('click', () => show(t));
  t.addEventListener('keydown', (e) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const next = tabs[(i + d + tabs.length) % tabs.length];
    show(next);
    next.focus();
  });
});
if (tabs.length) show(tabs[0]);

// 3. Tres pasos: el fragmento fijo cambia según el paso que está en el centro de la pantalla.
const mini = $('#mini');
const steps = $$('.step');
if (mini && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      steps.forEach((s) => s.classList.toggle('active', s === e.target));
      mini.dataset.state = e.target.dataset.step;
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));
  steps[0]?.classList.add('active');
}

// 4. Entradas una sola vez al aparecer (receta de taste-skill; nunca deja contenido oculto).
const targets = $$('[data-reveal]');
if (!('IntersectionObserver' in window)) targets.forEach((el) => el.classList.add('is-in'));
else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => targets.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
  }), 2500));
}

// 5. Propuesta de plantilla: el título de la incidencia lleva un prefijo para clasificarla.
const ask = $('#ask');
ask?.addEventListener('submit', () => {
  const input = $('#ask-input');
  const idea = input.value.trim();
  if (idea && !idea.startsWith('Plantilla:')) input.value = `Plantilla: ${idea}`;
  setTimeout(() => { input.value = idea; }, 0);
});
