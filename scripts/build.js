// Genera las páginas estáticas a partir de src/ (config, generador y tutoriales).
// Uso: node scripts/build.js   (sin dependencias; la salida se publica tal cual)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../src/config.js';
import { TEMPLATES, WEEKDAYS } from '../src/generator.js';
import { TUTORIALS, VERIFICATION } from '../src/content.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fecha = (iso) => iso.split('-').reverse().join('/');

const ICON = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  shield: '<path d="M12 3 19 6v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/>',
  external: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
};
const svg = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;

const NAV = [['', 'Inicio'], ['generador/', 'Generador'], ['tutoriales/', 'Tutoriales'], ['sobre/', 'Sobre el proyecto'], ['contacto/', 'Contacto']];

function layout({ path, title, description, body, scripts = '', noindex = false }) {
  const base = path.endsWith('.html') ? '' : '../'.repeat(path.split('/').filter(Boolean).length);
  const fullTitle = path === '' ? title : `${title} | ${SITE.name}`;
  const nav = NAV.map(([p, label]) =>
    `<a href="${base}${p}"${p === path || (p && path.startsWith(p)) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE.url}/${path}">`}
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE.url}/${path}">
<meta name="color-scheme" content="light dark">
${path === '' ? SITE.googleVerification.map((v) => `<meta name="google-site-verification" content="${esc(v)}">\n`).join('') : ''}<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}style.css">
</head>
<body>
<a class="skip" href="#main">Saltar al contenido</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="${base || './'}">${svg('home', 'icon brand-mark')}<span>${esc(SITE.name)}</span></a>
    <nav class="nav" aria-label="Principal">${nav}</nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p>${esc(SITE.name)} es un proyecto independiente y no está afiliado a Home Assistant ni a la Open Home Foundation. Revisa siempre el código antes de usarlo en tu instalación.</p>
    <p class="meta">Revisado el ${fecha(SITE.revisado)} · <a href="${base}privacidad/">Privacidad</a> · <a href="${base}contacto/">Contacto</a> · <a href="${SITE.repo}">Código fuente</a></p>
  </div>
</footer>
${scripts}
</body>
</html>
`;
}

const tutorialCards = (base) => TUTORIALS.map((t) => `
    <li class="card">
      <h3><a href="${base}tutoriales/${t.slug}/">${esc(t.title)}</a></h3>
      <p>${esc(t.summary)}</p>
    </li>`).join('');

function home() {
  const tpls = Object.entries(TEMPLATES).map(([id, t]) => `
      <li class="card">
        <span class="tag">Plantilla ${t.letter}</span>
        <h3><a href="generador/?plantilla=${id}">${esc(t.title)}</a></h3>
        <p>${esc(t.short)}</p>
      </li>`).join('');
  const body = `<section class="hero">
  <div class="wrap">
    <h1>Automatizaciones de Home Assistant sin pelearte con el YAML</h1>
    <p class="lead">Rellena un formulario con tus entidades y obtén una automatización lista para pegar, con la sintaxis actual, explicada paso a paso y con lo que necesitas tener configurado. Gratis y sin registrarte.</p>
    <p class="actions"><a class="button primary" href="generador/">Abrir el generador${svg('arrow')}</a><a class="button secondary" href="tutoriales/">Ver tutoriales</a></p>
    <p class="privacy">${svg('shield')}<span>El generador funciona en tu navegador: no se envía ni se guarda nada de lo que escribes.</span></p>
  </div>
</section>
<div class="wrap">
  <section aria-labelledby="t-plantillas">
    <h2 id="t-plantillas">Qué puedes generar</h2>
    <ul class="cards">${tpls}
    </ul>
  </section>
  <section aria-labelledby="t-por-que">
    <h2 id="t-por-que">Por qué otro generador</h2>
    <ul class="points">
      <li><strong>Sintaxis vigente.</strong> Muchos ejemplos de foros usan <code>platform:</code> y <code>service:</code>. El generador usa la sintaxis actual (<code>trigger:</code>, <code>action:</code>) y cada plantilla se valida con Home Assistant ${esc(SITE.haVersion)}.</li>
      <li><strong>Sin sorpresas.</strong> El código sale de plantillas fijas y revisadas, no de una IA: los mismos datos dan siempre el mismo resultado.</li>
      <li><strong>Te dice lo que falta.</strong> Requisitos, integraciones necesarias, advertencias y enlaces a la documentación oficial de cada parte.</li>
      <li><strong>En español y sin cuentas.</strong> Pensado para quien empieza, sin anuncios ni seguimiento.</li>
    </ul>
  </section>
  <section aria-labelledby="t-tutoriales">
    <h2 id="t-tutoriales">Tutoriales</h2>
    <ul class="cards">${tutorialCards('')}
    </ul>
  </section>
</div>`;
  return layout({ path: '', title: `${SITE.name}: generador de automatizaciones para Home Assistant`,
    description: 'Generador gratuito de automatizaciones para Home Assistant en español: luz con sensor de movimiento, avisos por umbral y acciones a una hora. YAML con la sintaxis actual, explicado y listo para pegar.', body });
}

function fieldHtml(tpl, f) {
  const id = `f-${tpl}-${f.name}`;
  const req = f.required ? ' <span class="req" aria-hidden="true">*</span>' : '';
  const help = f.help ? `<span class="help" id="h-${id}">${esc(f.help)}</span>` : '';
  const describedby = `err-${tpl}-${f.name}${f.help ? ` h-${id}` : ''}`;
  const err = `<span class="error" id="err-${tpl}-${f.name}" aria-live="polite"></span>`;
  const common = `id="${id}" name="${f.name}" aria-describedby="${describedby}"${f.required ? ' required' : ''}`;
  let control;
  if (f.type === 'checkbox') {
    return `<div class="field check" data-field="${f.name}"><input type="checkbox" ${common}${f.default ? ' checked' : ''}><label for="${id}">${esc(f.label)}</label>${help}${err}</div>`;
  }
  if (f.type === 'weekdays') {
    const boxes = WEEKDAYS.map(([k, short, long]) =>
      `<label class="day"><input type="checkbox" name="${f.name}" value="${k}"><span aria-hidden="true">${short}</span><span class="sr-only">${long}</span></label>`).join('');
    return `<fieldset class="field" data-field="${f.name}"${f.help ? ` aria-describedby="h-${id}"` : ''}><legend>${esc(f.label)}</legend><div class="days">${boxes}</div>${help}${err}</fieldset>`;
  }
  if (f.type === 'select') {
    control = `<select ${common}>${f.options.map(([k, l]) => `<option value="${k}"${k === f.default ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  } else {
    const attrs = {
      entity: `type="text" spellcheck="false" autocapitalize="off" autocomplete="off" class="mono"`,
      number: `type="text" inputmode="decimal" autocomplete="off"`,
      time: 'type="time"',
      text: `type="text" autocomplete="off"${f.max ? ` maxlength="${f.max}"` : ''}`,
    }[f.type];
    control = `<input ${attrs} ${common}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}${f.default != null ? ` value="${esc(f.default)}"` : ''}>`;
  }
  return `<div class="field" data-field="${f.name}"${f.showIf ? ' hidden' : ''}><label for="${id}">${esc(f.label)}${req}</label>${control}${help}${err}</div>`;
}

function generator() {
  const chooser = Object.entries(TEMPLATES).map(([id, t], i) => `
      <label class="choice"><input type="radio" name="template" value="${id}"${i === 0 ? ' checked' : ''}><span><strong>${t.letter}. ${esc(t.title)}</strong><small>${esc(t.short)}</small></span></label>`).join('');
  const forms = Object.entries(TEMPLATES).map(([id, t], i) => `
    <form class="tpl-form panel" id="form-${id}" novalidate${i ? ' hidden' : ''} aria-label="Datos de la plantilla ${t.letter}">
      ${t.fields.map((f) => fieldHtml(id, f)).join('\n      ')}
      <p class="req-note"><span aria-hidden="true">*</span> Obligatorio. Las entidades se copian de Herramientas para desarrolladores → Estados.</p>
      <div class="row">
        <button type="submit" class="primary">Generar YAML</button>
        <button type="button" class="secondary" data-action="example">Cargar ejemplo</button>
        <button type="button" class="ghost" data-action="reset">Vaciar</button>
      </div>
    </form>`).join('');
  const body = `<div class="wrap">
  <section class="intro">
    <h1>Generador de automatizaciones para Home Assistant</h1>
    <p class="lead">Elige una plantilla, escribe tus entidades y copia el YAML. Debajo del código tienes qué hace, qué necesitas y cómo añadirlo.</p>
  </section>
  <div id="generator" class="generator">
    <div class="gen-input">
      <fieldset class="chooser">
        <legend>1. Elige una plantilla</legend>${chooser}
      </fieldset>
      <h2 class="step-title">2. Rellena tus datos</h2>
      ${forms}
    </div>
    <section id="output" class="gen-output panel" tabindex="-1" aria-labelledby="out-h">
      <h2 id="out-h" class="step-title">3. Tu automatización</h2>
      <p id="out-title" class="muted"></p>
      <fieldset class="format">
        <legend>Formato</legend>
        <label><input type="radio" name="format" value="editor" checked> Editor de Home Assistant (recomendado)</label>
        <label><input type="radio" name="format" value="archivo"> Archivo YAML propio (avanzado)</label>
      </fieldset>
      <div id="out-pending" class="pending" role="status">
        <p>Completa o corrige estos campos para ver el código:</p>
        <ul id="pending-list"></ul>
      </div>
      <div id="out-ok" hidden>
        <pre class="code" tabindex="0" aria-label="Código YAML generado"><code id="yaml"></code></pre>
      </div>
      <div class="row">
        <button id="copy" type="button" class="primary" disabled>${svg('copy')}Copiar</button>
        <button id="download" type="button" class="secondary" disabled>${svg('download')}Descargar .yaml</button>
        <span id="action-status" class="muted" role="status"></span>
      </div>
    </section>
  </div>
  <section class="howto" aria-labelledby="t-explica">
    <h2 id="t-explica">Qué hace</h2>
    <p id="summary" class="muted">Rellena el formulario para ver la explicación.</p>
    <div class="cols">
      <div data-hide-empty hidden><h3>Lo que necesitas tener</h3><ul id="requirements"></ul></div>
      <div data-hide-empty hidden><h3>Advertencias</h3><ul id="warnings" class="warn"></ul></div>
    </div>
    <h2>Cómo añadirla a Home Assistant</h2>
    <ol class="steps-list" data-format="editor">
      <li>Ve a <strong>Ajustes → Automatizaciones y escenas → Crear automatización → Crear nueva automatización</strong>.</li>
      <li>En el menú <strong>⋮</strong> elige <strong>Editar en YAML</strong>, borra el contenido y pega el código.</li>
      <li>Pulsa <strong>Guardar</strong>. Para probarla sin esperar al disparador: <strong>⋮ → Ejecutar acciones</strong>; para ver qué ha pasado: <strong>⋮ → Trazas</strong>.</li>
    </ol>
    <ol class="steps-list" data-format="archivo" hidden>
      <li>Guarda el código como <code>automatizaciones_domotica_facil.yaml</code> junto a <code>configuration.yaml</code>. Si ya tienes ese archivo, añade la automatización al final.</li>
      <li>Añade a <code>configuration.yaml</code> la línea <code>automation domotica_facil: !include automatizaciones_domotica_facil.yaml</code>, sin borrar la de <code>automations.yaml</code>.</li>
      <li><strong>Herramientas para desarrolladores → YAML → Comprobar configuración</strong>. La primera vez reinicia; después basta con recargar las automatizaciones.</li>
    </ol>
    <p>Guía detallada, con errores frecuentes: <a href="../tutoriales/anadir-automatizacion-yaml-home-assistant/">Cómo añadir una automatización en YAML</a>.</p>
    <div data-hide-empty hidden><h3>Documentación oficial</h3><ul id="docs"></ul></div>
    <p class="note">Validación: el YAML de cada plantilla se ha comprobado con el validador de configuración de Home Assistant ${esc(SITE.haVersion)} y su comportamiento se ha simulado con entidades ficticias. No se ha probado con dispositivos físicos. Revisa siempre el código antes de usarlo.</p>
  </section>
  <section aria-labelledby="t-ejemplos">
    <h2 id="t-ejemplos">Ejemplos</h2>
    <dl class="params">
      ${Object.entries(TEMPLATES).map(([id, t]) => `<dt>${t.letter}. ${esc(t.title)}</dt><dd>${esc(exampleText(id))} <a href="?plantilla=${id}">Abrir la plantilla</a> y pulsar «Cargar ejemplo».</dd>`).join('\n      ')}
    </dl>
  </section>
</div>`;
  return layout({ path: 'generador/', title: 'Generador de automatizaciones para Home Assistant',
    description: 'Crea automatizaciones de Home Assistant sin escribir YAML: luces con sensor de movimiento, avisos cuando un sensor supera un valor y acciones a una hora. Copia o descarga el código.',
    body, scripts: '<script type="module" src="../src/app.js"></script>' });
}

function exampleText(id) {
  const e = TEMPLATES[id].example;
  if (id === 'movimiento') return `Con ${e.sensor} y ${e.target}, ${e.minutes} min y brillo ${e.brightness} %: enciende al detectar movimiento de noche y apaga 2 min después de que el sensor vuelva a «off».`;
  if (id === 'umbral') return `Con ${e.sensor} por encima de ${e.threshold} durante ${e.forMinutes} min: crea una notificación en Home Assistant con el valor actual.`;
  return `Con ${e.target} a las ${e.time}: la apaga todos los días a medianoche.`;
}

function tutorialsIndex() {
  const body = `<div class="wrap">
  <section class="intro">
    <h1>Tutoriales de Home Assistant</h1>
    <p class="lead">Guías cortas para problemas concretos, con el código explicado, errores frecuentes y cómo comprobar el resultado.</p>
  </section>
  <ul class="cards">${tutorialCards('../')}
  </ul>
</div>`;
  return layout({ path: 'tutoriales/', title: 'Tutoriales de Home Assistant en español',
    description: 'Tutoriales de Home Assistant para principiantes: cómo añadir automatizaciones YAML, luz con sensor de movimiento y cómo probar automatizaciones sin dispositivos.', body });
}

/** Recomendaciones de productos (vacías por ahora). Si alguna es de afiliado, se muestra el aviso obligatorio. */
export function productsHtml(products = []) {
  if (!products.length) return '';
  const affiliate = products.some((p) => p.affiliate);
  return `<aside class="products" aria-labelledby="t-productos">
  <h2 id="t-productos">Material que puede servirte</h2>
  ${affiliate ? '<p class="disclosure"><strong>Enlaces de afiliado:</strong> si compras a través de los enlaces marcados, este sitio puede recibir una comisión, sin coste adicional para ti. No cambia lo que recomendamos.</p>' : ''}
  <ul>${products.map((p) => `<li><a href="${esc(p.url)}" rel="${p.affiliate ? 'sponsored noopener' : 'noopener'}">${esc(p.name)}</a>${p.affiliate ? ' <span class="tag">afiliado</span>' : ''}: ${esc(p.why)}</li>`).join('')}</ul>
</aside>`;
}

function tutorialPage(t) {
  const path = `tutoriales/${t.slug}/`;
  const body = `<div class="wrap">
  <article class="article">
    <p class="crumbs"><a href="../../tutoriales/">Tutoriales</a></p>
    <h1>${esc(t.title)}</h1>
    <p class="meta">Revisado el ${fecha(SITE.revisado)} · Home Assistant ${esc(SITE.haVersion)}</p>
    <p class="note verify">${esc(VERIFICATION[t.verification].replace('{ha}', SITE.haVersion))}</p>
    ${t.body()}
    ${productsHtml(t.products)}
    <p class="cta"><a class="button primary" href="../../generador/">Abrir el generador${svg('arrow')}</a></p>
  </article>
</div>`;
  return layout({ path, title: t.title, description: t.description, body });
}

function simplePage(path, title, description, inner, opts = {}) {
  return layout({ path, title, description, ...opts, body: `<div class="wrap"><article class="article">\n<h1>${esc(title)}</h1>\n${inner}\n</article></div>` });
}

const about = () => simplePage('sobre/', 'Sobre el proyecto', `Qué es ${SITE.name}, cómo se generan y validan las automatizaciones y qué significa cada nivel de verificación.`, `
<p>${esc(SITE.name)} es un proyecto personal para que quien empieza con Home Assistant pueda crear automatizaciones habituales sin aprender YAML desde cero, y entienda lo que está pegando.</p>
<h2>Cómo se genera el código</h2>
<p>El generador no usa inteligencia artificial ni servicios externos. Cada plantilla es un conjunto de reglas fijas escritas a partir de la documentación oficial de Home Assistant: los mismos datos producen siempre el mismo YAML. Se ejecuta entero en tu navegador.</p>
<h2>Qué significa «verificado» aquí</h2>
<p>Distinguimos tres niveles y cada página dice cuál aplica:</p>
<dl class="params">
  <dt>Revisado con la documentación</dt><dd>El texto y el código se han contrastado con la documentación oficial vigente.</dd>
  <dt>Validado y simulado</dt><dd>El YAML ha pasado el comprobador de configuración de Home Assistant y se ha ejecutado en Home Assistant con entidades ficticias, cambiando sus estados y comprobando qué acciones se llaman. Así se comprueba la lógica, no el dispositivo.</dd>
  <dt>Probado con dispositivos</dt><dd>Probado en una instalación real con el hardware indicado. <strong>Ahora mismo ninguna página tiene este nivel</strong>; cuando lo tenga, se indicará qué dispositivo y qué versión.</dd>
</dl>
<h2>Independencia</h2>
<p>No hay relación con Home Assistant, la Open Home Foundation ni ningún fabricante. El sitio no tiene publicidad ni enlaces de afiliado. Si algún día los tiene, se indicará en cada enlace y en la <a href="../privacidad/">política de privacidad</a>.</p>
<h2>Código abierto a revisión</h2>
<p>El código del sitio está en <a href="${SITE.repo}">GitHub</a>. Si ves un error, <a href="../contacto/">avísanos</a>.</p>`);

const contact = () => simplePage('contacto/', 'Contacto', `Cómo comunicar errores, proponer plantillas o hacer preguntas sobre ${SITE.name}.`, `
<p>No hay formulario ni correo: los mensajes se gestionan en el repositorio público de GitHub, así cualquiera puede ver las respuestas y no tenemos que guardar datos personales. Necesitas una cuenta gratuita de GitHub.</p>
<div class="cards two">
  <div class="card"><h2>Errores y propuestas</h2><p>Un YAML que no funciona, un enlace roto o una plantilla que echas de menos.</p><p><a class="button primary" href="${SITE.repo}/issues/new">Abrir una incidencia${svg('external')}</a></p></div>
  <div class="card"><h2>Ver lo ya comunicado</h2><p>Antes de escribir, comprueba si alguien ya lo ha comentado.</p><p><a class="button secondary" href="${SITE.repo}/issues">Ver incidencias abiertas${svg('external')}</a></p></div>
</div>
<p class="note">Lo que escribas en GitHub es público. No pegues contraseñas, tokens, direcciones ni la URL de tu Home Assistant: sustituye los nombres de tus entidades si lo prefieres.</p>`);

const privacy = () => simplePage('privacidad/', 'Privacidad y cookies', `Qué datos trata ${SITE.name}: ninguno propio, sin cookies ni analítica.`, `
<p class="meta">Última actualización: ${fecha(SITE.revisado)}</p>
<h2>Resumen</h2>
<ul>
  <li>Este sitio <strong>no usa cookies</strong>, ni analítica, ni publicidad, ni píxeles de seguimiento.</li>
  <li>El generador funciona en tu navegador. <strong>Lo que escribes no se envía ni se guarda</strong> en ningún servidor.</li>
  <li>No hay cuentas de usuario, formularios ni lista de correo.</li>
</ul>
<h2>Responsable</h2>
<p>${esc(SITE.owner)}, autor del sitio. Contacto a través de la <a href="../contacto/">página de contacto</a>.</p>
<h2>Alojamiento</h2>
<p>El sitio se sirve desde Cloudflare Pages. Como cualquier servidor web, Cloudflare procesa datos técnicos de la conexión (dirección IP, navegador, página pedida) para entregar las páginas y protegerlas de abusos. Ese tratamiento lo hace Cloudflare según su <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">política de privacidad</a>; este sitio no recibe ni consulta esos datos. No hemos activado Cloudflare Web Analytics.</p>
<h2>Enlaces externos</h2>
<p>Las páginas enlazan a la documentación de Home Assistant y a GitHub. Al seguir un enlace, se aplica la política de privacidad de ese sitio.</p>
<h2>Cambios</h2>
<p>Si en el futuro se añade analítica, publicidad o enlaces de afiliado, esta página se actualizará <strong>antes</strong> de activarlos y, cuando la ley lo exija, se pedirá tu consentimiento antes de instalar cookies no necesarias.</p>`);

const notFound = () => layout({ path: '404.html', noindex: true, title: 'Página no encontrada', description: 'La página que buscas no existe.',
  body: `<div class="wrap"><article class="article"><h1>Página no encontrada</h1><p>La dirección no existe o ha cambiado.</p><p class="actions"><a class="button primary" href="/generador/">Ir al generador</a><a class="button secondary" href="/tutoriales/">Ver tutoriales</a></p></article></div>` })
  // 404.html se sirve en cualquier ruta: usa rutas absolutas.
  .replace(/href="(?!\/|https?:|#)([^"]*)"/g, 'href="/$1"');

export function build(outDir = ROOT) {
  const pages = [];
  const write = (path, html, { sitemap = true } = {}) => {
    const file = path.endsWith('.html') ? join(outDir, path) : join(outDir, path, 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    if (sitemap) pages.push(path);
  };
  write('', home());
  write('generador/', generator());
  write('tutoriales/', tutorialsIndex());
  for (const t of TUTORIALS) write(`tutoriales/${t.slug}/`, tutorialPage(t));
  write('sobre/', about());
  write('contacto/', contact());
  write('privacidad/', privacy());
  write('404.html', notFound(), { sitemap: false });
  writeFileSync(join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE.url}/${p}</loc><lastmod>${SITE.revisado}</lastmod></url>`).join('\n')}
</urlset>
`);
  writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
  return pages;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pages = build();
  console.log(`${pages.length} páginas generadas (+404.html):\n` + pages.map((p) => `  /${p}`).join('\n'));
}
