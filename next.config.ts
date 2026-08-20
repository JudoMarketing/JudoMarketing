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
    // Una hora, no un día. El servicio de capturas contesta con un dibujo de
    // "cargando" la primera vez que le piden una dirección nueva, y con un día
    // de guardado ese dibujo se quedaba de portada hasta el otro día. Una hora
    // deja que se arregle solo, y sigue siendo tiempo de sobra para que el
    // visitante nunca espere a que saquen la foto.
    minimumCacheTTL: 3600,
  },
  // JuditoADS vive como app aparte (repo Judito-Ads) pero se sirve bajo
  // judomarketing.net/juditoads. JUDITOADS_URL es la URL del deploy de esa
  // app en Vercel (ej: https://judito-ads.vercel.app); sin la variable, la
  // ruta simplemente no existe y el sitio no se ve afectado.
  async rewrites() {
    const juditoads = process.env.JUDITOADS_URL;
    if (!juditoads) return [];
    return [
      { source: "/juditoads", destination: `${juditoads}/juditoads` },
      { source: "/juditoads/:path*", destination: `${juditoads}/juditoads/:path*` },
    ];
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
