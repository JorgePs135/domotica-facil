// Exporta a validar_ha/casos.json el YAML que produce el generador para un conjunto de casos,
// para validarlo con Home Assistant real (validar_ha/test_automatizaciones.py).
// Uso: node scripts/exportar_casos.js
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, generate } from '../src/generator.js';

const A = TEMPLATES.movimiento.example;
const B = TEMPLATES.umbral.example;
const C = TEMPLATES.horario.example;
const CASES = {
  a_ejemplo: ['movimiento', A],
  a_enchufe_sin_espera: ['movimiento', { ...A, target: 'switch.enchufe_pasillo', minutes: '0', brightness: '', onlyDark: false }],
  a_alias_raro: ['movimiento', { ...A, alias: 'Luz "pasillo": #1 {{ no es plantilla }}', onlyDark: false }],
  b_ejemplo: ['umbral', B],
  b_movil_por_debajo: ['umbral', { ...B, direction: 'below', threshold: '-2.5', forMinutes: '', method: 'mobile', notifyEntity: 'notify.mobile_app_pixel', title: '' }],
  c_ejemplo: ['horario', C],
  c_dias_encender: ['horario', { ...C, alias: 'Encender lunes y viernes', time: '07:30', weekdays: ['mon', 'fri'], service: 'turn_on', brightness: '80' }],
};

const out = {};
for (const [name, [tpl, values]] of Object.entries(CASES)) {
  const r = generate(tpl, values, { id: `caso_${name}` });
  if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.errors)}`);
  out[name] = { template: tpl, values: r.values, yaml: r.yaml, listYaml: r.listYaml };
}
const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'validar_ha', 'casos.json');
writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
console.log(`${Object.keys(out).length} casos exportados a validar_ha/casos.json`);
