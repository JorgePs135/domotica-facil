// Resaltado mínimo del YAML que produce el generador (claves, cadenas, números y plantillas).
// shortcut: solo cubre el subconjunto de YAML que generamos; si se añade YAML arbitrario, usar una librería.
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function value(v) {
  if (/^".*"$/.test(v)) return `<span class="y-str">${esc(v).replace(/\{\{.*?\}\}/g, (t) => `<span class="y-tpl">${t}</span>`)}</span>`;
  if (/^-?\d+(\.\d+)?$/.test(v)) return `<span class="y-num">${v}</span>`;
  return esc(v);
}

/** Devuelve HTML seguro (escapado) con <span> por tipo de token. */
export function highlightYaml(yaml) {
  return yaml.split('\n').map((line) => {
    const m = line.match(/^(\s*)(- )?([A-Za-z_][\w]*)(:)( ?)(.*)$/);
    if (m) {
      const [, ind, dash = '', key, colon, sp, rest] = m;
      return `${ind}${dash ? '<span class="y-dash">- </span>' : ''}<span class="y-key">${key}</span>${colon}${sp}${value(rest)}`;
    }
    const d = line.match(/^(\s*)- (.*)$/);
    if (d) return `${d[1]}<span class="y-dash">- </span>${value(d[2])}`;
    return esc(line);
  }).join('\n');
}
