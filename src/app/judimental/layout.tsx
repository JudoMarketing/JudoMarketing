import type { Metadata } from "next";
import "../globals.css";

/**
 * Layout propio, fuera del sitio: sin encabezado, sin pie, sin mascota, sin
 * idiomas. Un landing de promoción es una sola pantalla que no debe parecer
 * una página más de judomarketing.net.
 */
export const metadata: Metadata = {
  title: "JudiMental",
  robots: { index: false, follow: false },
};

export default function JudimentalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#000" }}>{children}</body>
    </html>
  );
}
