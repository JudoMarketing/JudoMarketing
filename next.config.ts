import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Rutas donde el sitio viejo de Wix pudo registrar un service worker. Servimos
// ahi nuestro kill switch y le prohibimos al navegador cachearlo, para que en
// su proxima revision se instale y se autodestruya.
const SW_PATHS = [
  "/service-worker.js",
  "/sw.js",
  "/serviceworker.js",
  "/firebase-messaging-sw.js",
  "/wix-sw.js",
];

const nextConfig: NextConfig = {
  images: {
    // Capturas del home de los websites del portafolio
    remotePatterns: [{ protocol: "https", hostname: "image.thum.io" }],
    // Vercel guarda la captura un día: el visitante nunca espera al servicio
    // de capturas, y aun así la imagen se refresca si el cliente cambia su sitio.
    minimumCacheTTL: 86400,
  },
  // Las direcciones viejas del portafolio, por si Google alcanzó a verlas
  async redirects() {
    return [
      { source: "/portfolio", destination: "/showcase", permanent: true },
      { source: "/es/portafolio", destination: "/es/showcase", permanent: true },
      { source: "/es/portfolio", destination: "/es/showcase", permanent: true },
      { source: "/es/datos", destination: "/es/intake", permanent: true },
    ];
  },

  async headers() {
    return [
      ...SW_PATHS.map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      })),
    ];
  },
};

export default withNextIntl(nextConfig);
