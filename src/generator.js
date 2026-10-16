// Generador de automatizaciones de Home Assistant a partir de plantillas fijas.
// Módulo puro (sin DOM): lo usan la página, el build y los tests.
// Sintaxis revisada contra la documentación de Home Assistant 2026.10 (claves triggers/conditions/actions,
// `trigger:` en lugar de `platform:` y `action:` en lugar de `service:`).

export const DOCS = {
  yaml: 'https://www.home-assistant.io/docs/automation/yaml/',
  editor: 'https://www.home-assistant.io/docs/automation/editor/',
  state: 'https://www.home-assistant.io/triggers/state/',
  numeric: 'https://www.home-assistant.io/triggers/numeric_state/',
  time: 'https://www.home-assistant.io/triggers/time/',
  modes: 'https://www.home-assistant.io/docs/automation/modes/',
  wait: 'https://www.home-assistant.io/building-blocks/wait_for_trigger/',
  sun: 'https://www.home-assistant.io/integrations/sun/',
  persistent: 'https://www.home-assistant.io/integrations/persistent_notification/',
  notify: 'https://www.home-assistant.io/integrations/notify/',
  companion: 'https://companion.home-assistant.io/docs/notifications/notifications-basic/',
  light: 'https://www.home-assistant.io/integrations/light/',
  switch: 'https://www.home-assistant.io/integrations/switch/',
  troubleshooting: 'https://www.home-assistant.io/docs/automation/troubleshooting/',
};

const WEEKDAYS = [['mon', 'L', 'lunes'], ['tue', 'M', 'martes'], ['wed', 'X', 'miércoles'], ['thu', 'J', 'jueves'],
  ['fri', 'V', 'viernes'], ['sat', 'S', 'sábado'], ['sun', 'D', 'domingo']];

/** Definición de cada plantilla: campos del formulario, ejemplo y textos fijos. */
export const TEMPLATES = {
  movimiento: {
    letter: 'A',
    title: 'Luz con sensor de movimiento',
    short: 'Enciende una luz al detectar movimiento y la apaga cuando deja de haberlo.',
    fields: [
      { name: 'alias', label: 'Nombre de la automatización', type: 'text', required: true, default: 'Luz del pasillo por movimiento', max: 100 },
      { name: 'sensor', label: 'Sensor de movimiento', type: 'entity', domains: ['binary_sensor'], required: true,
        placeholder: 'binary_sensor.movimiento_pasillo', help: 'Entidad que pasa a «on» al detectar movimiento.' },
      { name: 'target', label: 'Luz o enchufe que se enciende', type: 'entity', domains: ['light', 'switch'], required: true,
        placeholder: 'light.pasillo', help: 'Una entidad light.… o switch.…' },
      { name: 'minutes', label: 'Minutos sin movimiento antes de apagar', type: 'number', required: true, default: '2', min: 0, max: 240, integer: true,
        help: 'Cuenta desde que el sensor vuelve a «off». 0 = apagar en cuanto el sensor deje de detectar.' },
      { name: 'brightness', label: 'Brillo al encender (%)', type: 'number', min: 1, max: 100, integer: true, placeholder: 'opcional',
        help: 'Solo para entidades light.… Vacío = el brillo que tenga la luz.' },
      { name: 'onlyDark', label: 'Solo cuando sea de noche (el sol bajo el horizonte)', type: 'checkbox' },
    ],
    example: { alias: 'Luz del pasillo por movimiento', sensor: 'binary_sensor.movimiento_pasillo', target: 'light.pasillo', minutes: '2', brightness: '60', onlyDark: true },
  },
  umbral: {
    letter: 'B',
    title: 'Aviso cuando un sensor pasa de un valor',
    short: 'Envía un aviso cuando un sensor numérico supera (o baja de) un límite.',
    fields: [
      { name: 'alias', label: 'Nombre de la automatización', type: 'text', required: true, default: 'Aviso de temperatura alta', max: 100 },
      { name: 'sensor', label: 'Sensor numérico', type: 'entity', domains: ['sensor'], required: true,
        placeholder: 'sensor.temperatura_salon', help: 'Un sensor.… cuyo estado sea un número (temperatura, humedad, consumo…).' },
      { name: 'direction', label: 'Avisar cuando el valor', type: 'select', required: true, default: 'above',
        options: [['above', 'supere el límite'], ['below', 'baje del límite']] },
      { name: 'threshold', label: 'Límite', type: 'number', required: true, placeholder: '28', help: 'En la misma unidad que el sensor. Admite decimales (28.5).' },
      { name: 'forMinutes', label: 'Minutos que debe mantenerse pasado el límite', type: 'number', min: 0, max: 1440, integer: true, placeholder: 'opcional',
        help: 'Evita avisos por picos breves. Vacío o 0 = avisar al momento.' },
      { name: 'method', label: 'Cómo avisar', type: 'select', required: true, default: 'persistent',
        options: [['persistent', 'Notificación dentro de Home Assistant (no necesita nada más)'], ['mobile', 'Notificación en el móvil (app Home Assistant)']] },
      { name: 'notifyEntity', label: 'Entidad de notificación del móvil', type: 'entity', domains: ['notify'], placeholder: 'notify.mobile_app_mi_movil',
        help: 'Solo para el aviso al móvil. Búscala en Herramientas para desarrolladores → Estados filtrando por «notify.».', showIf: ['method', 'mobile'] },
      { name: 'title', label: 'Título del aviso', type: 'text', default: 'Aviso de Home Assistant', max: 80 },
      { name: 'message', label: 'Mensaje', type: 'text', required: true, default: 'La temperatura del salón ha pasado del límite.', max: 200 },
      { name: 'includeValue', label: 'Añadir el valor actual del sensor al mensaje', type: 'checkbox', default: true },
    ],
    example: { alias: 'Aviso de temperatura alta', sensor: 'sensor.temperatura_salon', direction: 'above', threshold: '28', forMinutes: '10',
      method: 'persistent', notifyEntity: '', title: 'Aviso de Home Assistant', message: 'La temperatura del salón ha pasado de 28 °C.', includeValue: true },
  },
  horario: {
    letter: 'C',
    title: 'Encender o apagar a una hora',
    short: 'Enciende o apaga una luz o un enchufe a una hora fija, todos los días o solo algunos.',
    fields: [
      { name: 'alias', label: 'Nombre de la automatización', type: 'text', required: true, default: 'Apagar la luz del jardín a medianoche', max: 100 },
      { name: 'time', label: 'Hora', type: 'time', required: true, default: '00:00' },
      { name: 'weekdays', label: 'Días', type: 'weekdays', help: 'Si no marcas ninguno, se ejecuta todos los días.' },
      { name: 'target', label: 'Luz o enchufe', type: 'entity', domains: ['light', 'switch'], required: true, placeholder: 'light.jardin' },
      { name: 'service', label: 'Acción', type: 'select', required: true, default: 'turn_off', options: [['turn_on', 'Encender'], ['turn_off', 'Apagar']] },
      { name: 'brightness', label: 'Brillo al encender (%)', type: 'number', min: 1, max: 100, integer: true, placeholder: 'opcional',
        help: 'Solo al encender una entidad light.…', showIf: ['service', 'turn_on'] },
    ],
    example: { alias: 'Apagar la luz del jardín a medianoche', time: '00:00', weekdays: [], target: 'light.jardin', service: 'turn_off', brightness: '' },
  },
};

export { WEEKDAYS };

// Mismo patrón que valida Home Assistant para los entity_id (homeassistant/core.py, valid_entity_id).
const ENTITY_RE = /^(?!.+__)(?!_)[\da-z_]+(?<!_)\.(?!_)[\da-z_]+(?<!_)$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const q = (s) => JSON.stringify(String(s)); // una cadena JSON es una cadena YAML válida entre comillas dobles
const domainOf = (id) => id.split('.')[0];

const visible = (field, v) => !field.showIf || v[field.showIf[0]] === field.showIf[1];

/** Normaliza (recorta espacios, entidades en minúsculas) y valida. Devuelve { values, errors }. */
export function validate(templateId, raw) {
  const tpl = TEMPLATES[templateId];
  if (!tpl) throw new Error(`Plantilla desconocida: ${templateId}`);
  const v = {};
  const errors = {};
  for (const f of tpl.fields) {
    let x = raw[f.name];
    if (f.type === 'checkbox') { v[f.name] = Boolean(x); continue; }
    if (f.type === 'weekdays') {
      v[f.name] = (Array.isArray(x) ? x : []).filter((d) => WEEKDAYS.some(([k]) => k === d));
      continue;
    }
    x = String(x ?? '').trim();
    if (f.type === 'entity') x = x.toLowerCase();
    v[f.name] = x;
  }
  for (const f of tpl.fields) {
    const x = v[f.name];
    if (f.type === 'checkbox' || f.type === 'weekdays' || !visible(f, v)) continue;
    if (x === '') {
      if (f.required) errors[f.name] = 'Este campo es obligatorio.';
      continue;
    }
    if (f.type === 'entity') {
      if (!ENTITY_RE.test(x)) errors[f.name] = 'Debe tener la forma dominio.nombre, solo con minúsculas, números y guiones bajos (p. ej. ' + f.placeholder + ').';
      else if (!f.domains.includes(domainOf(x))) errors[f.name] = `Debe empezar por ${f.domains.map((d) => d + '.').join(' o ')}`;
    } else if (f.type === 'number') {
      const n = Number(x.replace(',', '.'));
      if (!Number.isFinite(n)) errors[f.name] = 'Escribe un número.';
      else if (f.integer && !Number.isInteger(n)) errors[f.name] = 'Escribe un número entero.';
      else if (f.min != null && n < f.min) errors[f.name] = `El mínimo es ${f.min}.`;
      else if (f.max != null && n > f.max) errors[f.name] = `El máximo es ${f.max}.`;
      else v[f.name] = String(n);
    } else if (f.type === 'time') {
      if (!TIME_RE.test(x)) errors[f.name] = 'Usa el formato HH:MM (por ejemplo 07:30).';
    } else if (f.type === 'select') {
      if (!f.options.some(([k]) => k === x)) errors[f.name] = 'Elige una opción de la lista.';
    } else if (f.max && x.length > f.max) {
      errors[f.name] = `Máximo ${f.max} caracteres.`;
    }
  }
  // Reglas que dependen de varios campos.
  if (templateId === 'umbral' && v.method === 'mobile' && !v.notifyEntity && !errors.notifyEntity) {
    errors.notifyEntity = 'Para avisar al móvil indica la entidad notify.… de tu móvil.';
  }
  if (templateId === 'movimiento' && v.brightness && v.target && domainOf(v.target) !== 'light' && !errors.target) {
    errors.brightness = 'El brillo solo se puede fijar en entidades light.… Déjalo vacío para un enchufe.';
  }
  if (templateId === 'horario' && v.service === 'turn_on' && v.brightness && v.target && domainOf(v.target) !== 'light' && !errors.target) {
    errors.brightness = 'El brillo solo se puede fijar en entidades light.… Déjalo vacío para un enchufe.';
  }
  return { values: v, errors };
}

const targetBlock = (service, entity, brightness) => {
  const lines = [`  - action: ${domainOf(entity)}.${service}`, '    target:', `      entity_id: ${entity}`];
  if (brightness) lines.push('    data:', `      brightness_pct: ${brightness}`);
  return lines;
};

const BUILDERS = {
  movimiento(v) {
    const lines = [
      `alias: ${q(v.alias)}`,
      `description: ${q('Enciende ' + v.target + ' con movimiento y la apaga tras ' + v.minutes + ' min sin movimiento. Generada con Domótica Fácil.')}`,
      'mode: restart',
      'triggers:',
      '  - trigger: state',
      `    entity_id: ${v.sensor}`,
      '    from: "off"',
      '    to: "on"',
    ];
    if (v.onlyDark) lines.push('conditions:', '  - condition: state', '    entity_id: sun.sun', '    state: below_horizon');
    lines.push('actions:', ...targetBlock('turn_on', v.target, v.brightness),
      '  - wait_for_trigger:', '      - trigger: state', `        entity_id: ${v.sensor}`, '        from: "on"', '        to: "off"');
    if (Number(v.minutes) > 0) lines.push('  - delay:', `      minutes: ${v.minutes}`);
    lines.push(...targetBlock('turn_off', v.target));
    return lines;
  },
  umbral(v) {
    const word = v.direction === 'above' ? 'supera' : 'baja de';
    const lines = [
      `alias: ${q(v.alias)}`,
      `description: ${q('Avisa cuando ' + v.sensor + ' ' + word + ' ' + v.threshold + '. Generada con Domótica Fácil.')}`,
      'mode: single',
      'triggers:',
      '  - trigger: numeric_state',
      `    entity_id: ${v.sensor}`,
      `    ${v.direction}: ${v.threshold}`,
    ];
    if (Number(v.forMinutes) > 0) lines.push('    for:', `      minutes: ${v.forMinutes}`);
    const message = v.includeValue ? `${v.message} Valor actual: {{ states('${v.sensor}') }}` : v.message;
    lines.push('actions:');
    if (v.method === 'mobile') {
      lines.push('  - action: notify.send_message', '    target:', `      entity_id: ${v.notifyEntity}`, '    data:');
      if (v.title) lines.push(`      title: ${q(v.title)}`);
      lines.push(`      message: ${q(message)}`);
    } else {
      lines.push('  - action: persistent_notification.create', '    data:');
      if (v.title) lines.push(`      title: ${q(v.title)}`);
      lines.push(`      message: ${q(message)}`);
    }
    return lines;
  },
  horario(v) {
    const lines = [
      `alias: ${q(v.alias)}`,
      `description: ${q((v.service === 'turn_on' ? 'Enciende ' : 'Apaga ') + v.target + ' a las ' + v.time + '. Generada con Domótica Fácil.')}`,
      'mode: single',
      'triggers:',
      '  - trigger: time',
      `    at: "${v.time}:00"`,
    ];
    // Todos los días marcados equivale a no filtrar.
    if (v.weekdays.length && v.weekdays.length < 7) {
      const ordered = WEEKDAYS.map(([k]) => k).filter((k) => v.weekdays.includes(k));
      lines.push('    weekday:', ...ordered.map((d) => `      - ${d}`));
    }
    lines.push('actions:', ...targetBlock(v.service, v.target, v.service === 'turn_on' ? v.brightness : ''));
    return lines;
  },
};

/** Convierte el YAML de una automatización (mapa) al formato de lista de un archivo propio, con id. */
export function asListItem(yaml, id) {
  return [`- id: ${q(id)}`, ...yaml.trimEnd().split('\n').map((l) => '  ' + l)].join('\n') + '\n';
}

const sentence = (templateId, v) => {
  const t = v.target ? `«${v.target}»` : '';
  if (templateId === 'movimiento') {
    return `Cuando ${'«' + v.sensor + '»'} detecte movimiento${v.onlyDark ? ' y sea de noche' : ''}, se encenderá ${t}${v.brightness ? ` al ${v.brightness} %` : ''}. ` +
      `Cuando el sensor deje de detectar, esperará ${v.minutes} min y la apagará. Si vuelve a haber movimiento durante la espera, la cuenta empieza de nuevo (modo «restart»).`;
  }
  if (templateId === 'umbral') {
    return `Cuando «${v.sensor}» ${v.direction === 'above' ? 'pase de' : 'baje de'} ${v.threshold}${Number(v.forMinutes) > 0 ? ` y siga así ${v.forMinutes} min` : ''}, ` +
      `se enviará ${v.method === 'mobile' ? `una notificación a «${v.notifyEntity}»` : 'una notificación que verás en la barra lateral de Home Assistant'}. ` +
      'Solo avisa al cruzar el límite: no repite el aviso mientras el valor siga pasado; volverá a avisar si vuelve a la zona normal y lo cruza otra vez.';
  }
  const days = v.weekdays.length && v.weekdays.length < 7
    ? 'los ' + WEEKDAYS.filter(([k]) => v.weekdays.includes(k)).map(([, , n]) => n).join(', ')
    : 'todos los días';
  return `A las ${v.time}, ${days}, se ${v.service === 'turn_on' ? 'encenderá' : 'apagará'} ${t}${v.service === 'turn_on' && v.brightness ? ` al ${v.brightness} %` : ''}. ` +
    'Usa la zona horaria configurada en Home Assistant (Ajustes → Sistema → General).';
};

function guidance(templateId, v) {
  const requirements = [];
  const warnings = [];
  const docs = [{ label: 'Automatizaciones en YAML', url: DOCS.yaml }];
  const targetDomain = v.target ? domainOf(v.target) : '';
  if (templateId === 'movimiento') {
    requirements.push(`Un sensor de movimiento integrado en Home Assistant que aparezca como «${v.sensor}» y cambie entre «on» y «off».`,
      `La luz o el enchufe «${v.target}» integrado en Home Assistant.`);
    if (v.onlyDark) requirements.push('La integración «Sol» (sun.sun). Viene activada en una instalación normal; compruébalo en Herramientas para desarrolladores → Estados.');
    warnings.push('Muchos sensores PIR tardan entre 30 s y varios minutos en volver a «off» después del último movimiento: el tiempo real de apagado será ese tiempo más los minutos que elijas.',
      'Si enciendes la luz a mano mientras el sensor está activo, también se apagará al acabar la espera.');
    docs.push({ label: 'Disparador de estado', url: DOCS.state }, { label: 'Esperar a un disparador', url: DOCS.wait }, { label: 'Modos de ejecución', url: DOCS.modes });
    if (v.onlyDark) docs.push({ label: 'Integración Sol', url: DOCS.sun });
  } else if (templateId === 'umbral') {
    requirements.push(`Un sensor «${v.sensor}» cuyo estado sea un número (si su estado es un texto como «alto», este disparador no funciona).`);
    if (v.method === 'mobile') {
      requirements.push('La app Home Assistant (Companion) instalada en el móvil e iniciada con tu cuenta, para que exista la entidad de notificación.');
      warnings.push(`Comprueba que «${v.notifyEntity}» existe en Herramientas para desarrolladores → Estados. En instalaciones antiguas puede que solo exista la acción notify.mobile_app_… y no la entidad; en ese caso actualiza la app y Home Assistant, o usa la notificación interna.`);
      docs.push({ label: 'Integración Notify', url: DOCS.notify }, { label: 'Notificaciones de la app Companion', url: DOCS.companion });
    } else {
      requirements.push('Nada más: las notificaciones persistentes vienen incluidas en Home Assistant.');
      docs.push({ label: 'Notificaciones persistentes', url: DOCS.persistent });
    }
    warnings.push('El límite se compara en la unidad que muestre el sensor. Si cambias la unidad (°C/°F, W/kW), revisa el número.',
      'Si Home Assistant se reinicia mientras cuenta los minutos de espera, la cuenta empieza de cero.');
    docs.push({ label: 'Disparador numérico', url: DOCS.numeric });
  } else {
    requirements.push(`La luz o el enchufe «${v.target}» integrado en Home Assistant.`, 'La zona horaria correcta en Ajustes → Sistema → General.');
    warnings.push('Si Home Assistant está apagado o reiniciándose justo a esa hora, la automatización no se ejecuta después: no recupera las horas perdidas.');
    docs.push({ label: 'Disparador de hora', url: DOCS.time });
  }
  if (targetDomain === 'switch') {
    warnings.push('No uses automatizaciones horarias o por movimiento para enchufes que alimentan estufas, calefactores u otros aparatos que no deban encenderse sin supervisión.');
    docs.push({ label: 'Integración Switch', url: DOCS.switch });
  } else if (targetDomain === 'light') {
    docs.push({ label: 'Integración Light', url: DOCS.light });
  }
  docs.push({ label: 'Depurar automatizaciones (trazas)', url: DOCS.troubleshooting });
  return { requirements, warnings, docs };
}

/**
 * Genera la automatización. Devuelve { ok, errors, values, yaml, listYaml, summary, requirements, warnings, docs }.
 * `id` solo se usa en el formato de archivo propio (lista con id).
 */
export function generate(templateId, raw, { id = 'domotica_facil' } = {}) {
  const { values, errors } = validate(templateId, raw);
  if (Object.keys(errors).length) return { ok: false, errors, values };
  const yaml = BUILDERS[templateId](values).join('\n') + '\n';
  return { ok: true, errors, values, yaml, listYaml: asListItem(yaml, id), summary: sentence(templateId, values), ...guidance(templateId, values) };
}
