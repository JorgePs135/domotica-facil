import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, generate, validate, asListItem } from '../src/generator.js';

test('plantilla A con el ejemplo produce el YAML esperado', () => {
  const r = generate('movimiento', TEMPLATES.movimiento.example);
  assert.equal(r.ok, true);
  assert.equal(r.yaml, `alias: "Luz del pasillo por movimiento"
description: "Enciende light.pasillo con movimiento y la apaga tras 2 min sin movimiento. Generada con Domótica Fácil."
mode: restart
triggers:
  - trigger: state
    entity_id: binary_sensor.movimiento_pasillo
    from: "off"
    to: "on"
conditions:
  - condition: state
    entity_id: sun.sun
    state: below_horizon
actions:
  - action: light.turn_on
    target:
      entity_id: light.pasillo
    data:
      brightness_pct: 60
  - wait_for_trigger:
      - trigger: state
        entity_id: binary_sensor.movimiento_pasillo
        from: "on"
        to: "off"
  - delay:
      minutes: 2
  - action: light.turn_off
    target:
      entity_id: light.pasillo
`);
});

test('plantilla A: enchufe, sin brillo, sin condición y 0 minutos (sin delay)', () => {
  const r = generate('movimiento', { alias: 'x', sensor: 'binary_sensor.m', target: 'switch.enchufe', minutes: '0', brightness: '', onlyDark: false });
  assert.equal(r.ok, true);
  assert.match(r.yaml, /action: switch\.turn_on/);
  assert.match(r.yaml, /action: switch\.turn_off/);
  assert.doesNotMatch(r.yaml, /conditions:|delay:|brightness_pct/);
  assert.ok(r.warnings.some((w) => w.includes('estufas')), 'advierte del uso de enchufes');
});

test('plantilla A: errores de validación', () => {
  const base = { alias: 'x', sensor: 'binary_sensor.m', target: 'light.l', minutes: '2' };
  assert.equal(validate('movimiento', { ...base, sensor: '' }).errors.sensor, 'Este campo es obligatorio.');
  assert.match(validate('movimiento', { ...base, sensor: 'sensor.m' }).errors.sensor, /binary_sensor\./);
  assert.match(validate('movimiento', { ...base, target: 'light.Mal Nombre' }).errors.target, /dominio\.nombre/);
  assert.match(validate('movimiento', { ...base, target: 'light._x' }).errors.target, /dominio\.nombre/);
  assert.match(validate('movimiento', { ...base, minutes: '2.5' }).errors.minutes, /entero/);
  assert.match(validate('movimiento', { ...base, minutes: '-1' }).errors.minutes, /mínimo/);
  assert.match(validate('movimiento', { ...base, minutes: 'abc' }).errors.minutes, /número/);
  assert.match(validate('movimiento', { ...base, target: 'switch.s', brightness: '50' }).errors.brightness, /light/);
  assert.equal(validate('movimiento', { ...base, alias: '   ' }).errors.alias, 'Este campo es obligatorio.');
  // Normaliza mayúsculas y espacios en las entidades.
  assert.equal(validate('movimiento', { ...base, sensor: '  Binary_Sensor.M ' }).values.sensor, 'binary_sensor.m');
});

test('textos con comillas, dos puntos y saltos de línea quedan escapados', () => {
  const r = generate('movimiento', { alias: 'Luz "pasillo": #1\nfin', sensor: 'binary_sensor.m', target: 'light.l', minutes: '1' });
  assert.equal(r.yaml.split('\n')[0], 'alias: "Luz \\"pasillo\\": #1\\nfin"');
});

test('plantilla B con el ejemplo: notificación persistente con valor y for', () => {
  const r = generate('umbral', TEMPLATES.umbral.example);
  assert.equal(r.ok, true);
  assert.equal(r.yaml, `alias: "Aviso de temperatura alta"
description: "Avisa cuando sensor.temperatura_salon supera 28. Generada con Domótica Fácil."
mode: single
triggers:
  - trigger: numeric_state
    entity_id: sensor.temperatura_salon
    above: 28
    for:
      minutes: 10
actions:
  - action: persistent_notification.create
    data:
      title: "Aviso de Home Assistant"
      message: "La temperatura del salón ha pasado de 28 °C. Valor actual: {{ states('sensor.temperatura_salon') }}"
`);
});

test('plantilla B: móvil, por debajo, decimales con coma y sin valor', () => {
  const r = generate('umbral', { ...TEMPLATES.umbral.example, direction: 'below', threshold: '-2,5', forMinutes: '', method: 'mobile',
    notifyEntity: 'notify.mobile_app_pixel', includeValue: false, title: '' });
  assert.equal(r.ok, true);
  assert.match(r.yaml, /below: -2\.5\n/);
  assert.match(r.yaml, /action: notify\.send_message\n {4}target:\n {6}entity_id: notify\.mobile_app_pixel/);
  assert.doesNotMatch(r.yaml, /for:|title:|states\(/);
});

test('plantilla B: errores de validación', () => {
  const ex = TEMPLATES.umbral.example;
  assert.match(validate('umbral', { ...ex, method: 'mobile', notifyEntity: '' }).errors.notifyEntity, /notify/);
  assert.match(validate('umbral', { ...ex, method: 'mobile', notifyEntity: 'light.x' }).errors.notifyEntity, /notify\./);
  assert.equal(validate('umbral', { ...ex, method: 'persistent', notifyEntity: 'basura' }).errors.notifyEntity, undefined, 'campo oculto no se valida');
  assert.equal(validate('umbral', { ...ex, threshold: '' }).errors.threshold, 'Este campo es obligatorio.');
  assert.match(validate('umbral', { ...ex, direction: 'igual' }).errors.direction, /opción/);
  assert.match(validate('umbral', { ...ex, message: 'x'.repeat(201) }).errors.message, /200/);
  assert.match(validate('umbral', { ...ex, sensor: 'binary_sensor.x' }).errors.sensor, /sensor\./);
});

test('plantilla C: días ordenados, todos los días = sin filtro, brillo solo al encender', () => {
  const ex = TEMPLATES.horario.example;
  const r = generate('horario', { ...ex, time: '07:30', weekdays: ['fri', 'mon', 'xyz'], service: 'turn_on', brightness: '80' });
  assert.equal(r.ok, true);
  assert.match(r.yaml, /at: "07:30:00"\n {4}weekday:\n {6}- mon\n {6}- fri\n/);
  assert.match(r.yaml, /brightness_pct: 80/);
  const all = generate('horario', { ...ex, weekdays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] });
  assert.doesNotMatch(all.yaml, /weekday/);
  const off = generate('horario', { ...ex, service: 'turn_off', brightness: '80' });
  assert.doesNotMatch(off.yaml, /brightness/);
  assert.match(validate('horario', { ...ex, time: '7:30' }).errors.time, /HH:MM/);
  assert.match(validate('horario', { ...ex, time: '24:00' }).errors.time, /HH:MM/);
  assert.match(validate('horario', { ...ex, service: 'turn_on', target: 'switch.s', brightness: '10' }).errors.brightness, /light/);
});

test('formato de archivo propio: lista con id e indentación', () => {
  const r = generate('horario', TEMPLATES.horario.example, { id: 'abc' });
  assert.equal(r.listYaml, asListItem(r.yaml, 'abc'));
  const lines = r.listYaml.trimEnd().split('\n');
  assert.equal(lines[0], '- id: "abc"');
  assert.ok(lines.slice(1).every((l) => l.startsWith('  ')));
  assert.equal(lines.slice(1).map((l) => l.slice(2)).join('\n') + '\n', r.yaml);
});

test('cada plantilla genera con su ejemplo y tiene documentación y requisitos', () => {
  for (const id of Object.keys(TEMPLATES)) {
    const r = generate(id, TEMPLATES[id].example);
    assert.equal(r.ok, true, id);
    assert.ok(r.requirements.length && r.docs.length && r.summary, id);
    assert.ok(r.docs.every((d) => d.url.startsWith('https://')), id);
    assert.doesNotMatch(r.yaml, /\t|platform:|service:/, `${id}: sin tabuladores ni sintaxis antigua`);
  }
});

test('el resaltado conserva el texto exacto y escapa el HTML', async () => {
  const { highlightYaml } = await import('../src/highlight.js');
  const unhtml = (h) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  for (const id of Object.keys(TEMPLATES)) {
    const r = generate(id, TEMPLATES[id].example, { id: 'x' });
    for (const y of [r.yaml, r.listYaml]) assert.equal(unhtml(highlightYaml(y)), y, id);
  }
  const evil = generate('movimiento', { ...TEMPLATES.movimiento.example, alias: '<img src=x onerror=alert(1)>' }).yaml;
  assert.doesNotMatch(highlightYaml(evil), /<img/);
});
