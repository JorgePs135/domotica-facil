# Domótica Fácil

Web estática en español con un **generador de automatizaciones para Home Assistant** (tres plantillas) y tutoriales para principiantes.
No tiene servidor, base de datos, cuentas de usuario, cookies ni analítica. El generador se ejecuta en el navegador.

- La investigación, las decisiones, la monetización y los requisitos legales están en [INVESTIGACION.md](INVESTIGACION.md).
- Estado: **v0.1, preparado para publicar. Todavía no está publicado.**

## Qué hay

| Ruta | Contenido |
|---|---|
| `/` | Portada |
| `/generador/` | Generador: A) luz con sensor de movimiento, B) aviso por umbral, C) acción a una hora |
| `/tutoriales/` | 3 tutoriales: añadir YAML, luz con movimiento, probar sin dispositivos |
| `/sobre/`, `/contacto/`, `/privacidad/` | Proyecto y niveles de verificación, contacto por GitHub Issues, privacidad |

```
src/generator.js        Reglas y plantillas (módulo puro, sin DOM). Aquí se cambia el YAML.
src/app.js              Interfaz del generador (copiar, descargar, validación en vivo)
src/content.js          Tutoriales. El código de los tutoriales sale del generador.
src/config.js           URL pública, repositorio, responsable y fecha de revisión
scripts/build.js        Genera todas las páginas, sitemap.xml y robots.txt
scripts/serve.js        Servidor local para probar
scripts/exportar_casos.js  Exporta casos del generador para validarlos con Home Assistant
tests/                  Tests de Node (generador y sitio)
validar_ha/             Tests con Home Assistant real (Python, en WSL)
```

Las páginas `index.html` son **archivos generados**: no las edites a mano. Cambia `src/` y ejecuta `npm run build`.

## Probarlo en Windows

Requisito: [Node.js](https://nodejs.org/) 20 o superior (tienes la v24). No hay que instalar dependencias.

Abre PowerShell en la carpeta del proyecto:

```powershell
cd "D:\Datos Usuario\Desktop\negocio_digital\domotica-facil"
```

Regenera las páginas:

```powershell
npm run build
```

Ejecuta los tests (generador, enlaces internos, SEO básico, ausencia de rastreadores):

```powershell
npm test
```

Arranca el servidor local y abre <http://localhost:8080/>:

```powershell
npm start
```

Para usar otro puerto: `node scripts/serve.js 8765`. Se para con Ctrl+C.
No abras los `index.html` con doble clic: el generador usa módulos de JavaScript, y el navegador no los carga desde `file://`.

## Validación con Home Assistant (opcional, en WSL)

Comprueba el YAML con el núcleo real de Home Assistant: `check_config` oficial y una simulación de comportamiento con entidades ficticias.
Home Assistant no se instala en Windows nativo (sus dependencias en C no compilan), por eso se usa WSL (Ubuntu).
El entorno ya está creado en `~/df-ha` dentro de WSL. Para recrearlo desde cero:

```powershell
wsl -e bash -lc "mkdir -p ~/df-bin && cd ~/df-bin && curl -sSfL https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-unknown-linux-gnu.tar.gz | tar xz --strip-components=1 && ./uv venv --python 3.14 ~/df-ha && VIRTUAL_ENV=~/df-ha ./uv pip install pytest-homeassistant-custom-component"
```

Cada vez que cambies `src/generator.js`:

```powershell
node scripts/exportar_casos.js
```

```powershell
wsl -e bash -lc "cd '/mnt/d/Datos Usuario/Desktop/negocio_digital/domotica-facil/validar_ha' && ~/df-ha/bin/python -m pytest -q -p no:cacheprovider"
```

Después actualiza `haVersion` en `src/config.js` si cambió la versión de Home Assistant.

## Publicar gratis en Cloudflare Pages

**Por qué Cloudflare Pages y no GitHub Pages:** GitHub prohíbe usar Pages para «run your online business» o sitios dirigidos a transacciones comerciales. Con publicidad y afiliación en el futuro, la web quedaría en zona gris, y mudarla después cambiaría las URL y perdería posicionamiento. Cloudflare Pages permite uso comercial en el plan gratuito. Límites verificados el 16/10/2026 en la [documentación oficial](https://developers.cloudflare.com/pages/platform/limits/): 500 compilaciones al mes, 20.000 archivos por sitio, 25 MiB por archivo y 100 proyectos por cuenta. La página no indica ningún límite de ancho de banda. Esta web ocupa menos de 1 MB.

### 1. Repositorio en GitHub

Créalo vacío y **público** en github.com con el nombre `domotica-facil`, con la cuenta JorgePs135. La página de contacto enlaza a sus Issues. Si eliges otro nombre, cambia `repo` en `src/config.js` y ejecuta `npm run build`.

Configura git con tu correo noreply (como en el comprobador):

```powershell
git init -b main
```

```powershell
git config user.email "202176071+JorgePs135@users.noreply.github.com"
```

```powershell
git add .
```

```powershell
git commit -m "Domótica Fácil v0.1"
```

```powershell
git remote add origin https://github.com/JorgePs135/domotica-facil.git
```

```powershell
git push -u origin main
```

### 2. Proyecto en Cloudflare Pages

1. Crea una cuenta gratuita en <https://dash.cloudflare.com/sign-up>. No pide tarjeta.
2. Ve a **Workers & Pages → Create → Pages → Connect to Git** y autoriza solo el repositorio `domotica-facil`.
3. Configuración de compilación:
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `/`
   - Production branch: `main`
4. Project name: `domotica-facil`. La URL será `https://domotica-facil.pages.dev`.
   Si el nombre está ocupado, Cloudflare propone otro. En ese caso cambia `url` en `src/config.js`, ejecuta `npm run build` y haz commit y push.

Cada `git push` a `main` vuelve a publicar la web automáticamente.

### 3. Comprobar que está publicada

```powershell
curl.exe -sI https://domotica-facil.pages.dev/generador/
```

Debe responder `HTTP/1.1 200` o `HTTP/2 200`. Abre también la URL en el móvil y prueba: Cargar ejemplo → Copiar → Descargar.
Comprueba que <https://domotica-facil.pages.dev/sitemap.xml> lista las 9 páginas y que una ruta inventada muestra la página 404 propia.

### 4. Search Console

1. En <https://search.google.com/search-console> añade una propiedad de tipo **Prefijo de URL** con la URL publicada.
2. Elige la verificación por **etiqueta HTML**. Copia solo el valor de `content` en `googleVerification` de `src/config.js`, ejecuta `npm run build` y haz commit y push.
3. Pulsa Verificar y envía `sitemap.xml` en **Sitemaps**.

## Mantenimiento

- **Cada versión mensual de Home Assistant** (primer miércoles de mes): lee los *breaking changes* de automatizaciones. Si afectan, ejecuta la validación en WSL con la versión nueva y actualiza `haVersion` y `revisado` en `src/config.js`.
- **Cada trimestre:** ejecuta `npm test` y comprueba los enlaces externos de la documentación (Home Assistant reorganizó su web en 2026 y varios enlaces cambiaron).
- **Al añadir un tutorial:** copia un objeto en `src/content.js`, ejecuta `npm run build` y `npm test` (los tests comprueban los enlaces internos, que el título sea único y la longitud de la descripción).
- **Al añadir una plantilla:** define sus campos y su `BUILDERS` en `src/generator.js`, añade tests en `tests/generator.test.js` y casos en `scripts/exportar_casos.js`, y añade comportamiento simulado en `validar_ha/`.

## Pendiente (no incluido en v0.1)

Hecho y comprobado: las tres plantillas, la web con 9 páginas, los tests de Node y la validación con Home Assistant 2026.10.1.

1. Crear el repositorio y publicar en Cloudflare Pages (pasos de arriba).
2. Search Console y envío del sitemap.
3. Probar el YAML en una instalación real con dispositivos. Ninguna página dice estar probada con hardware.
4. Revisar con la interfaz real en español los nombres de menú citados («Editar en YAML», «Establecer estado»…): están tomados de la documentación, no de capturas.
5. Más plantillas, cuando haya datos de uso: puerta abierta X minutos, apagar todo al salir de casa y aviso de batería baja.
6. Tutoriales nuevos según las búsquedas reales que muestre Search Console (ver INVESTIGACION.md §6).
7. Dominio propio (unos 10 €/año, opcional) antes de solicitar AdSense.
8. Aviso legal (LSSI) con NIF y correo **antes** de activar publicidad o afiliación (INVESTIGACION.md §5).
