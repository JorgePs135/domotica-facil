// Datos del sitio. Cambia `url` y `repo` cuando sepas la dirección definitiva y vuelve a ejecutar `npm run build`.
export const SITE = {
  name: 'Domótica Fácil',
  // URL pública sin barra final (Cloudflare Pages asigna https://<proyecto>.pages.dev)
  url: 'https://domotica-facil.pages.dev',
  // Repositorio público: lo usa la página de contacto (issues y discussions). Debe existir antes de publicar.
  repo: 'https://github.com/JorgePs135/domotica-facil',
  // Responsable del sitio, para la página de privacidad
  owner: 'Jorge',
  // Etiquetas de verificación de Google Search Console (solo en la portada)
  googleVerification: [],
  revisado: '2026-10-16',
  // Versión de Home Assistant con la que se validó el YAML generado (scripts/validar_ha/)
  haVersion: '2026.10',
};
