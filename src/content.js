// Tutoriales. Para añadir uno: copia un objeto de TUTORIALS, cambia slug/título/cuerpo y ejecuta `npm run build`.
// Los bloques de código que salen del generador se generan aquí mismo, así coinciden siempre con la herramienta.
import { TEMPLATES, generate, DOCS } from './generator.js';
import { highlightYaml } from './highlight.js';

const code = (s) => `<pre class="code" tabindex="0"><code>${highlightYaml(s.trimEnd())}</code></pre>`;
const gen = (tpl, values = TEMPLATES[tpl].example) => generate(tpl, values).yaml;
const doc = (url, label) => `<a href="${url}" rel="noopener">${label}</a>`;

// Niveles de verificación que se muestran en cada tutorial (ver la página «Sobre el proyecto»).
export const VERIFICATION = {
  schema: 'El YAML de esta página se ha validado con el comprobador de configuración de Home Assistant y su comportamiento se ha simulado con entidades ficticias en Home Assistant {ha}. No se ha probado con dispositivos físicos.',
  manual: 'Pasos revisados contra la documentación oficial de Home Assistant {ha}. Los nombres de los menús pueden variar ligeramente entre versiones.',
};

export const TUTORIALS = [
  {
    slug: 'anadir-automatizacion-yaml-home-assistant',
    h1: 'Dónde pegar el YAML',
    title: 'Cómo añadir una automatización en YAML a Home Assistant',
    description: 'Dónde pegar el YAML de una automatización en Home Assistant, cómo reconocer la sintaxis antigua y nueva, errores frecuentes y cómo comprobar que funciona.',
    summary: 'Has encontrado o generado el YAML de una automatización y no sabes dónde pegarlo. Dos formas seguras, con sus errores típicos.',
    verification: 'manual',
    body: () => `
<h2>El problema</h2>
<p>En foros, vídeos y generadores encontrarás automatizaciones escritas en YAML. Si las pegas en el sitio equivocado o con la sangría mal, Home Assistant no las guarda o, peor, deja de cargar la configuración. Aquí tienes las dos formas seguras de añadirlas.</p>

<h2>Antes de empezar</h2>
<ul>
  <li>Un usuario administrador de Home Assistant.</li>
  <li>Las entidades que use la automatización ya integradas (las ves en <strong>Herramientas para desarrolladores → Estados</strong>).</li>
  <li>Home Assistant 2024.10 o posterior si el YAML usa la sintaxis nueva (<code>triggers:</code>, <code>trigger: state</code>, <code>action:</code>). La sintaxis antigua sigue funcionando.</li>
</ul>

<h2>Opción 1 (recomendada): el editor de automatizaciones</h2>
<ol class="steps-list">
  <li>Ve a <strong>Ajustes → Automatizaciones y escenas</strong> y pulsa <strong>Crear automatización</strong>.</li>
  <li>Elige <strong>Crear nueva automatización</strong> (empezar desde cero).</li>
  <li>Abre el menú <strong>⋮</strong> de arriba a la derecha y elige <strong>Editar en YAML</strong>.</li>
  <li>Borra todo lo que aparece y pega el YAML. Debe empezar por <code>alias:</code>, sin guion delante.</li>
  <li>Pulsa <strong>Guardar</strong>. Si vuelves a <strong>⋮ → Editar en el editor visual</strong> verás la automatización en el editor de bloques: es una buena prueba de que se ha entendido.</li>
</ol>
<p>Home Assistant guarda la automatización en <code>automations.yaml</code> y le pone un <code>id</code> por su cuenta. La documentación oficial pide no editar ese archivo a mano porque lo gestiona la interfaz (${doc(DOCS.yaml, 'Automatizaciones en YAML')}).</p>

<h2>Opción 2 (avanzada): un archivo YAML propio</h2>
<p>Útil si guardas tu configuración en Git o quieres tener tus automatizaciones fuera de la interfaz. El generador lo ofrece como «Archivo YAML propio».</p>
<ol class="steps-list">
  <li>Crea, junto a <code>configuration.yaml</code>, un archivo <code>automatizaciones_domotica_facil.yaml</code> y pega dentro el YAML (en este formato cada automatización empieza por <code>- id:</code>).</li>
  <li>Añade a <code>configuration.yaml</code> esta línea, sin borrar la que ya tengas de <code>automation: !include automations.yaml</code>:
${code('automation domotica_facil: !include automatizaciones_domotica_facil.yaml')}</li>
  <li>Ve a <strong>Herramientas para desarrolladores → YAML</strong> y pulsa <strong>Comprobar configuración</strong>. Si no ves la opción, activa el <strong>Modo avanzado</strong> en tu perfil de usuario.</li>
  <li>La primera vez, <strong>reinicia</strong> Home Assistant para que lea el nuevo <code>!include</code>. Después, cuando cambies solo el archivo, basta con <strong>Recargar automatizaciones</strong>.</li>
</ol>
<p>Las automatizaciones de un bloque con nombre propio (<code>automation domotica_facil:</code>) aparecen en la lista, pero no se pueden editar desde la interfaz: se cambian en el archivo.</p>

<h2>Sintaxis antigua y nueva</h2>
<p>Desde Home Assistant 2024.8 y 2024.10 cambiaron algunos nombres. Las dos formas funcionan, pero <strong>no se pueden mezclar en el mismo nivel</strong>.</p>
<div class="table-wrap"><table>
  <thead><tr><th>Antes</th><th>Ahora</th></tr></thead>
  <tbody>
    <tr><td><code>trigger:</code> (lista principal)</td><td><code>triggers:</code></td></tr>
    <tr><td><code>condition:</code> (lista principal)</td><td><code>conditions:</code></td></tr>
    <tr><td><code>action:</code> (lista principal)</td><td><code>actions:</code></td></tr>
    <tr><td><code>- platform: state</code></td><td><code>- trigger: state</code></td></tr>
    <tr><td><code>- service: light.turn_on</code></td><td><code>- action: light.turn_on</code></td></tr>
  </tbody>
</table></div>

<h2>Errores frecuentes</h2>
<ul>
  <li><strong>Sangría con tabuladores o desigual.</strong> YAML solo admite espacios. Pega el código tal cual y no lo reindentes a mano.</li>
  <li><strong>Pegar una lista en el editor.</strong> Si el YAML empieza por <code>- id:</code> es para un archivo (opción 2). En el editor (opción 1) quita el guion y el <code>id</code>, o genera el formato «Editor de Home Assistant».</li>
  <li><strong><code>on</code> y <code>off</code> sin comillas.</strong> En YAML, <code>to: on</code> sin comillas puede leerse como verdadero/falso y no como el estado «on». Escribe <code>to: "on"</code>.</li>
  <li><strong>Entidades que no existen.</strong> Home Assistant guarda la automatización, pero no hará nada. Copia el ID exacto desde <strong>Estados</strong>.</li>
  <li><strong>Mezclar <code>service:</code> y <code>action:</code></strong> o <code>platform:</code> y <code>trigger:</code> dentro del mismo bloque.</li>
</ul>

<h2>Cómo comprobar que funciona</h2>
<ol class="steps-list">
  <li>En la lista de automatizaciones, abre la tuya y usa <strong>⋮ → Ejecutar acciones</strong>: ejecuta las acciones sin esperar al disparador ni mirar las condiciones. Sirve para comprobar que las entidades responden.</li>
  <li>Provoca el disparador de verdad (o simúlalo, como se explica en <a href="../probar-automatizaciones-sin-dispositivos/">Probar automatizaciones sin dispositivos</a>).</li>
  <li>Abre <strong>⋮ → Trazas</strong>: verás qué disparó la automatización, qué condiciones pasaron y en qué paso se paró (${doc(DOCS.troubleshooting, 'Depurar automatizaciones')}).</li>
</ol>

<h2>Documentación oficial</h2>
<ul>
  <li>${doc(DOCS.yaml, 'Automatizaciones en YAML')}</li>
  <li>${doc(DOCS.editor, 'Editor de automatizaciones')}</li>
  <li>${doc(DOCS.troubleshooting, 'Depurar automatizaciones')}</li>
</ul>`,
  },
  {
    slug: 'luz-sensor-movimiento-home-assistant',
    h1: 'Una luz que se apaga sola',
    title: 'Luz con sensor de movimiento que se apaga sola en Home Assistant',
    description: 'Automatización de Home Assistant para encender una luz con un sensor de movimiento y apagarla tras unos minutos sin movimiento, explicada línea a línea, con errores frecuentes.',
    summary: 'La automatización más pedida: encender con movimiento y apagar al rato. Por qué conviene el modo «restart» y qué falla a menudo.',
    verification: 'schema',
    body: () => `
<h2>El problema</h2>
<p>Quieres que la luz del pasillo se encienda al pasar y se apague sola cuando no haya nadie. La versión ingenua (una automatización que enciende y otra que apaga a los dos minutos) apaga la luz aunque sigas allí. Esta versión espera a que el sensor deje de detectar y solo entonces cuenta los minutos.</p>

<h2>Requisitos</h2>
<ul>
  <li>Un sensor de movimiento integrado en Home Assistant (una entidad <code>binary_sensor.…</code> que pase a <code>on</code> al detectar).</li>
  <li>Una luz (<code>light.…</code>) o un enchufe (<code>switch.…</code>) integrado.</li>
  <li>Opcional: la integración <strong>Sol</strong> (<code>sun.sun</code>) si quieres que solo funcione de noche. Viene activada en una instalación normal.</li>
</ul>

<h2>El código</h2>
<p>Con un sensor <code>binary_sensor.movimiento_pasillo</code>, una luz <code>light.pasillo</code>, 2 minutos de espera, brillo al 60 % y solo de noche:</p>
${code(gen('movimiento'))}
<p class="cta"><a class="button primary" href="../../generador/?plantilla=movimiento">Genera la tuya con tus entidades</a></p>

<h2>Qué hace cada parte</h2>
<dl class="params">
  <dt><code>mode: restart</code></dt>
  <dd>Si hay movimiento mientras la automatización está esperando, la ejecución en curso se cancela y empieza otra: la cuenta atrás vuelve a cero. Con el modo por defecto (<code>single</code>) el nuevo movimiento se ignoraría y la luz se apagaría contigo dentro (${doc(DOCS.modes, 'modos de ejecución')}).</dd>
  <dt><code>trigger: state</code> con <code>from: "off"</code> y <code>to: "on"</code></dt>
  <dd>Se dispara solo cuando el sensor pasa de no detectar a detectar. Las comillas son necesarias: sin ellas, YAML puede leer <code>on</code> como un valor verdadero/falso.</dd>
  <dt><code>condition: state</code> con <code>sun.sun</code> en <code>below_horizon</code></dt>
  <dd>Solo continúa si el sol está bajo el horizonte. Quítala si quieres que funcione a cualquier hora.</dd>
  <dt><code>light.turn_on</code> con <code>brightness_pct</code></dt>
  <dd>Enciende la luz al porcentaje indicado. Para un enchufe la acción es <code>switch.turn_on</code> y no lleva brillo.</dd>
  <dt><code>wait_for_trigger</code></dt>
  <dd>Detiene la automatización hasta que el sensor vuelva de <code>on</code> a <code>off</code> (${doc(DOCS.wait, 'esperar a un disparador')}).</dd>
  <dt><code>delay</code></dt>
  <dd>Los minutos que la luz sigue encendida cuando ya no hay movimiento.</dd>
</dl>

<h2>Errores frecuentes</h2>
<ul>
  <li><strong>La luz tarda más de lo esperado en apagarse.</strong> Casi todos los sensores PIR tienen su propio tiempo de rearme: siguen en <code>on</code> entre 30 segundos y varios minutos después del último movimiento. El apagado real es ese tiempo más tu <code>delay</code>. Algunos sensores permiten cambiarlo en su configuración.</li>
  <li><strong>La luz se apaga contigo dentro.</strong> Falta <code>mode: restart</code>, o el sensor no ve la zona donde estás quieto (un PIR no detecta a quien no se mueve). Para estancias donde se está quieto, combina el movimiento con un sensor de presencia.</li>
  <li><strong>La luz se queda encendida para siempre.</strong> Si el sensor pasa a <code>unavailable</code> (pila, cobertura) mientras se espera, nunca llega el paso de <code>on</code> a <code>off</code>. Revisa la traza: verás la automatización parada en <code>wait_for_trigger</code>.</li>
  <li><strong>No hace nada de día.</strong> Es la condición de <code>sun.sun</code>; quítala o compruébala en <strong>Estados</strong>.</li>
</ul>

<h2>Cómo comprobarlo</h2>
<ol class="steps-list">
  <li>Añádela como se explica en <a href="../anadir-automatizacion-yaml-home-assistant/">Cómo añadir una automatización en YAML</a>.</li>
  <li>Pon el delay a 0 o 1 minuto para la prueba.</li>
  <li>Pasa por delante del sensor (o simula el cambio de estado, ver <a href="../probar-automatizaciones-sin-dispositivos/">Probar sin dispositivos</a>) y mira en <strong>⋮ → Trazas</strong> cada paso: encender, esperar, retardo y apagar.</li>
</ol>

<h2>Documentación oficial</h2>
<ul>
  <li>${doc(DOCS.state, 'Disparador de estado')}</li>
  <li>${doc(DOCS.wait, 'Esperar a un disparador (wait_for_trigger)')}</li>
  <li>${doc(DOCS.modes, 'Modos de ejecución')}</li>
  <li>${doc(DOCS.sun, 'Integración Sol')}</li>
</ul>`,
  },
  {
    slug: 'probar-automatizaciones-sin-dispositivos',
    h1: 'Probar sin tener los dispositivos',
    title: 'Probar automatizaciones de Home Assistant sin tener los dispositivos',
    description: 'Tres formas de comprobar una automatización de Home Assistant sin sensores ni luces reales: cambiar estados a mano, crear ayudantes y usar la integración demo.',
    summary: '¿Aún no tienes el sensor o no quieres esperar a que haga calor? Simula los estados y mira la traza.',
    verification: 'schema',
    body: () => `
<h2>El problema</h2>
<p>Has escrito una automatización, pero el sensor aún no ha llegado, o esperas a que la temperatura pase de 28 °C para saber si avisa. Home Assistant permite simular los estados de las entidades para comprobar la lógica sin tocar ningún aparato.</p>
<p class="note">Una simulación comprueba que la automatización reacciona como esperas a los cambios de estado. No comprueba el dispositivo: cuánto tarda en informar, si pierde cobertura o si su estado es un número o un texto. Cuando tengas el aparato, repite la prueba con él.</p>

<h2>Requisitos</h2>
<ul>
  <li>Una instalación de Home Assistant con usuario administrador. Puede ser una de pruebas.</li>
  <li>La automatización ya añadida (ver <a href="../anadir-automatizacion-yaml-home-assistant/">Cómo añadir una automatización en YAML</a>).</li>
</ul>

<h2>Método 1: cambiar el estado a mano</h2>
<p>Lo más rápido para disparadores de estado y numéricos.</p>
<ol class="steps-list">
  <li>Abre <strong>Herramientas para desarrolladores → Estados</strong>.</li>
  <li>Elige la entidad (por ejemplo <code>sensor.temperatura_salon</code>), escribe el nuevo estado (<code>30</code>) y pulsa <strong>Establecer estado</strong>.</li>
  <li>Mira la traza de la automatización.</li>
</ol>
<p>Esto solo cambia lo que Home Assistant cree que vale la entidad; no envía nada al dispositivo. En cuanto el dispositivo real informe, su valor sustituirá al tuyo. Para un disparador numérico, recuerda que se dispara al <strong>cruzar</strong> el límite: pon primero un valor por debajo (25) y luego uno por encima (30).</p>

<h2>Método 2: ayudantes que hacen de sensor</h2>
<p>Si el dispositivo aún no existe, crea entidades de prueba en <strong>Ajustes → Dispositivos y servicios → Ayudantes → Crear ayudante</strong>:</p>
<ul>
  <li>Un <strong>interruptor</strong> (<code>input_boolean</code>) para simular movimiento: <code>input_boolean.movimiento_prueba</code>.</li>
  <li>Un <strong>número</strong> (<code>input_number</code>) para simular un valor: <code>input_number.temperatura_prueba</code>, con mínimo 0 y máximo 40.</li>
</ul>
<p>Los ayudantes tienen otro dominio (<code>input_boolean</code> en lugar de <code>binary_sensor</code>), así que el generador no los acepta como sensor. Para probar, cambia temporalmente el <code>entity_id</code> del disparador en el YAML. Por ejemplo, la plantilla de aviso apuntando al número de prueba:</p>
${code(gen('umbral', { ...TEMPLATES.umbral.example, sensor: 'sensor.temperatura_prueba' }).replaceAll('sensor.temperatura_prueba', 'input_number.temperatura_prueba'))}
<p>Mueve el control deslizante del ayudante por encima de 28 y espera los minutos indicados (o pon <code>for</code> a 0 para la prueba). Cuando llegue el sensor de verdad, vuelve a poner su <code>entity_id</code>.</p>

<h2>Método 3: la integración demo</h2>
<p>Home Assistant incluye una integración <strong>demo</strong> que crea luces, interruptores y sensores ficticios. Úsala solo en una instalación de pruebas, porque llena la tuya de entidades. Se activa añadiendo a <code>configuration.yaml</code>:</p>
${code('demo:')}
<p>Tras reiniciar, busca en <strong>Estados</strong> las entidades nuevas (luces, sensores) y úsalas como destino de tus automatizaciones para ver cómo cambian.</p>
<p class="note">Este método lo hemos comprobado leyendo el código de Home Assistant 2026.10 (la integración acepta <code>demo:</code> y crea sensores binarios, luces, sensores e interruptores), pero no lo hemos ejecutado en una instalación.</p>

<h2>Errores frecuentes</h2>
<ul>
  <li><strong>El disparador numérico no salta.</strong> El valor ya estaba por encima antes de guardar la automatización. Bájalo y vuelve a subirlo.</li>
  <li><strong>El estado vuelve solo a su valor.</strong> El dispositivo real ha informado. Es normal: el método 1 dura hasta la siguiente actualización.</li>
  <li><strong>La automatización con <code>for</code> no hace nada.</strong> Está contando. Si reinicias Home Assistant o recargas las automatizaciones mientras cuenta, la cuenta empieza de cero.</li>
</ul>

<h2>Cómo leer el resultado</h2>
<p>En <strong>Ajustes → Automatizaciones y escenas</strong>, abre la automatización y pulsa <strong>⋮ → Trazas</strong>. Cada ejecución muestra el disparador, el resultado de cada condición y cada acción con su hora. Si no aparece ninguna traza, la automatización no se disparó: revisa el <code>entity_id</code> y los valores <code>from</code>/<code>to</code>.</p>

<h2>Documentación oficial</h2>
<ul>
  <li>${doc(DOCS.troubleshooting, 'Depurar automatizaciones')}</li>
  <li>${doc('https://www.home-assistant.io/docs/tools/dev-tools/', 'Herramientas para desarrolladores')}</li>
  <li>${doc('https://www.home-assistant.io/integrations/input_boolean/', 'Input boolean')} e ${doc('https://www.home-assistant.io/integrations/input_number/', 'Input number')}</li>
  <li>${doc('https://www.home-assistant.io/integrations/demo/', 'Integración demo')}</li>
</ul>`,
  },
];
