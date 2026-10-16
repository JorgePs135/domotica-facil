# Investigación y decisiones: Domótica Fácil (16/10/2026)

Investigación breve para decidir, no un estudio de mercado. **No hay datos de volumen de búsqueda**: no hemos usado herramientas de palabras clave de pago y no inventamos cifras. Las fuentes oficiales están enlazadas. Donde solo había fuentes secundarias, se indica.

## 1. Qué existe ya

- **Home Assistant**: su editor visual de automatizaciones y los *blueprints* oficiales (por ejemplo, la luz con movimiento) cubren mucho. El generador no compite con ellos: sirve de puente para quien encuentra YAML en foros y no lo entiende, o quiere un punto de partida explicado.
- **Colecciones de blueprints** como awesome-ha-blueprints (GitHub, en inglés).
- **Generadores con IA** (asistentes basados en ChatGPT, algunos de pago, e integraciones como ai_automation_suggester). Pueden inventar entidades o usar sintaxis antigua; el propio sector recomienda revisar el resultado.
- **Herramientas autoalojadas** (por ejemplo HASSL): exigen instalar algo.

**Hueco elegido:** herramienta web **en español**, **sin IA** (reglas fijas y deterministas), con la **sintaxis vigente** (2024.10+: `triggers`, `trigger:`, `action:`), que **explica requisitos, advertencias y documentación oficial**, y cuyo YAML se **valida con Home Assistant real**. Es un hueco pequeño, y es razonable para empezar con coste cero.

## 2. Problemas de principiantes que atacamos primero

Elegidos por ser preguntas recurrentes en la documentación de solución de problemas y en los foros. No están medidos con volumen de búsqueda.
1. Dónde pegar un YAML y por qué no funciona (sintaxis antigua frente a nueva, sangría, `on`/`off` sin comillas).
2. Luz con sensor de movimiento que se apaga contigo dentro (modo `restart`, tiempo de rearme del PIR).
3. Cómo probar una automatización sin el dispositivo (estados simulados y trazas). También es nuestra propia forma de trabajar sin hardware.

## 3. Sintaxis verificada (Home Assistant 2026.10)

Fuente: [Automations YAML](https://www.home-assistant.io/docs/automation/yaml/) y las páginas de [state](https://www.home-assistant.io/triggers/state/), [numeric_state](https://www.home-assistant.io/triggers/numeric_state/), [time](https://www.home-assistant.io/triggers/time/), [modes](https://www.home-assistant.io/docs/automation/modes/), [wait_for_trigger](https://www.home-assistant.io/building-blocks/wait_for_trigger/), [persistent_notification](https://www.home-assistant.io/integrations/persistent_notification/) y [notify](https://www.home-assistant.io/integrations/notify/).
- `service:` pasó a `action:` en 2024.8. `platform:` pasó a `trigger:`, y `trigger/condition/action` pasaron a `triggers/conditions/actions` en 2024.10. Lo antiguo sigue aceptado, pero no se puede mezclar.
- `automations.yaml` lo gestiona la interfaz y la documentación pide no editarlo a mano. Por eso el generador ofrece el formato «editor» (recomendado) o un **archivo propio** incluido con `automation etiqueta: !include …`.
- Avisos: `persistent_notification.create` no necesita nada más. Para el móvil se usa `notify.send_message` con una entidad `notify.…`; `notify.mobile_app_…` queda como forma antigua. No usamos `notify.notify` porque la documentación avisa de que envía a «la primera» acción que encuentre.

**Alcance reducido a propósito:** solo `light` y `switch` como destino (sin persianas, cerraduras ni climatización), avisos solo con sensores numéricos y la hora solo fija (sin `input_datetime` ni desfases del sol). Son las partes que se pueden validar y explicar sin ambigüedad.

## 4. Alojamiento gratuito

| Opción | Uso comercial | Límites relevantes (oficiales, 16/10/2026) | Decisión |
|---|---|---|---|
| [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | Prohibido usarlo para «run your online business, e-commerce site» o sitios dirigidos principalmente a transacciones comerciales | 1 GB por sitio, 100 GB/mes de ancho de banda (límite blando), 10 compilaciones por hora | Descartado: zona gris con publicidad y afiliación |
| [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) | Permitido en el plan gratuito (según fuentes secundarias; las condiciones de Cloudflare no lo excluyen) | 500 compilaciones al mes, 20.000 archivos, 25 MiB por archivo y 100 proyectos. No indica límite de ancho de banda | **Elegido** |
| Vercel Hobby | Solo uso personal no comercial (fuentes secundarias) | n/d | Descartado |

Pendiente de revisar tú: leer las condiciones de servicio de Cloudflare al crear la cuenta. No hemos encontrado ninguna cláusula que impida anuncios o afiliación en Pages, pero tampoco hemos leído el contrato completo.

## 5. Monetización: requisitos antes de activarla

**Ahora no hay nada instalado:** ni código de anuncios, ni enlaces de afiliado, ni analítica. Los tests (`tests/site.test.js`) fallan si aparece código de Google Analytics, AdSense o Meta.

### Requisitos legales (España), antes de cualquier ingreso
- **Aviso legal (LSSI art. 10):** si la web genera ingresos (también por anuncios o afiliación) se considera actividad económica y debe mostrar nombre, NIF, correo de contacto, etc. Hoy la web no lo necesita porque no tiene actividad económica. Habrá que añadirlo antes del primer anuncio o enlace de afiliado.
- **Cookies (LSSI art. 22.2 y la guía de cookies de la AEPD):** hay que pedir consentimiento previo para las cookies no necesarias (publicidad, analítica), con la opción de rechazar igual de visible que la de aceptar. La página de privacidad ya promete actualizarse antes.
- **Publicidad identificable (LSSI art. 20):** los enlaces de afiliado deben identificarse como tales. La estructura ya existe: `productsHtml()` en `scripts/build.js` añade el aviso y `rel="sponsored"` cuando un producto es de afiliado, y está cubierta por un test.
- **Fiscalidad:** los ingresos se declaran. Si se vuelven recurrentes, consulta el alta de actividad con un asesor. No es una decisión técnica.

### Publicidad
- **Google AdSense:** las fuentes son secundarias, salvo la del consentimiento. Piden contenido original y útil, ser mayor de edad, controlar el sitio y tener política de privacidad. No se publica ningún mínimo de visitas. Varias guías dicen que los subdominios gratuitos (`*.pages.dev`) tienen menos aprobaciones. **Es oficial** ([Google](https://support.google.com/adsense/answer/13554020)) que en el EEE y el Reino Unido hace falta un **CMP certificado por Google e integrado con TCF** para servir anuncios personalizados. No garantizamos la aprobación.
- **Plan:** no solicitarlo hasta tener (a) dominio propio, (b) 15–20 páginas útiles y (c) tráfico orgánico estable visible en Search Console. Con poco tráfico, los ingresos por anuncios serían mínimos y el banner de cookies empeora la experiencia.
- Ezoic, Mediavine y similares exigen umbrales de tráfico: revísalos cuando haya tráfico. No los citamos porque cambian.

### Afiliación
- **Amazon Afiliados (amazon.es):** varias fuentes secundarias coinciden en que la cuenta se cierra si no hay **3 ventas válidas en los primeros 180 días**. Por eso no conviene darse de alta hasta que haya tráfico. Las **comisiones por categoría cambian**: consulta la tabla oficial en la Central de Afiliados, porque las cifras de los blogs no coinciden. Amazon exige una frase de divulgación propia en el sitio.
- **Otros programas por investigar** cuando haya tráfico: AliExpress Portals y programas de tiendas de domótica o fabricantes (Shelly, Sonoff, Aqara…). No hemos comprobado si tienen programa de afiliados ni en qué condiciones.
- **Cuándo tiene sentido:** cuando un tutorial necesite un producto concreto (por ejemplo, «qué sensor de movimiento elegir para Home Assistant»). Nunca añadir enlaces que no aporten nada.

### Productos digitales (no desarrollar todavía)
Ideas: un paquete de automatizaciones probadas (con hardware real), plantillas de panel y una guía de instalación de HA en español. Solo cuando el generador tenga uso real y haya señales de interés (peticiones en Issues, búsquedas en Search Console).

| Plataforma | Coste sin cuota (fuentes secundarias, verificar) | IVA UE |
|---|---|---|
| Lemon Squeezy | 5 % + 0,50 $ por venta (+ recargos por tarjeta internacional o PayPal) | Merchant of record: gestiona el IVA |
| Gumroad | 10 % + 0,50 $ por venta | Merchant of record (desde 2024) |
| Payhip (plan gratuito) | 5 % + comisión de la pasarela | Gestiona el IVA UE y del Reino Unido, no otros |

Para empezar, conviene un merchant of record (Lemon Squeezy o Gumroad): te evita gestionar el IVA OSS de ventas digitales en la UE.

## 6. Captación orgánica: siguiente paso

1. **Publicar y dar de alta en Search Console** (README). Sin eso no hay datos.
2. **Una sola publicación útil**, no spam, en los sitios donde se pregunta: el foro oficial (community.home-assistant.io), r/homeassistant y comunidades de domótica en español (comprueba antes que existan y estén activas; no lo hemos verificado). Mejor responder a un hilo concreto que tenga el problema que resuelve un tutorial, enlazando a ese tutorial. Lee antes las normas de autopromoción de cada comunidad.
3. **Escribir según la demanda real:** cuando Search Console muestre consultas (4–8 semanas después de indexar), escribe el siguiente tutorial sobre la consulta con más impresiones que no tenga una buena respuesta. Hasta entonces, temas candidatos (sin datos de volumen): «puerta abierta más de X minutos», «automatización al salir de casa (zona)», «aviso de batería baja», «diferencia entre automatización, script y escena».
4. **Ritmo sostenible:** un tutorial bueno cada 2–4 semanas. No generar páginas en masa.

**Expectativa honesta:** no hay garantía de visitas. La competencia en inglés es enorme y en español es menor pero existe (blogs y canales de YouTube de domótica). La ventaja que podemos ofrecer es una herramienta útil y contenido verificado, no el volumen.
