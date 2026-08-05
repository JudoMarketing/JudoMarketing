/**
 * Judo Site Kit: página de suspensión.
 * Sin publicidad, solo el aviso y la mascota triste sentada sobre el
 * enlace a www.judomarketing.net (autorizada en el Acuerdo de Servicio §3).
 * Autocontenida: estilos inline para funcionar en cualquier proyecto.
 */

export const metadata = {
  title: "Temporalmente deshabilitado",
  robots: { index: false, follow: false },
};

function SadMascot() {
  return (
    <svg width="150" height="168" viewBox="0 0 140 158" fill="none" aria-hidden>
      <defs>
        <linearGradient id="jsBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2b38" />
          <stop offset="0.55" stopColor="#15151d" />
          <stop offset="1" stopColor="#0a0a10" />
        </linearGradient>
        <linearGradient id="jsFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0a12" />
          <stop offset="1" stopColor="#05050a" />
        </linearGradient>
        <radialGradient id="jsEye" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#cfc2e8" />
          <stop offset="0.5" stopColor="#8f7ab8" />
          <stop offset="1" stopColor="#5b3aa0" />
        </radialGradient>
        <filter id="jsBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Piernas sentadas, colgando al frente */}
      <rect x="46" y="132" width="14" height="22" rx="7" fill="url(#jsBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(14 53 143)" />
      <rect x="80" y="132" width="14" height="22" rx="7" fill="url(#jsBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(-14 87 143)" />

      {/* Cuerpo encogido */}
      <ellipse cx="42" cy="122" rx="9" ry="13" fill="url(#jsBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(20 42 122)" />
      <ellipse cx="98" cy="122" rx="9" ry="13" fill="url(#jsBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(-20 98 122)" />
      <rect x="46" y="106" width="48" height="40" rx="18" fill="url(#jsBody)" stroke="#3a2a5e" strokeWidth="1" />
      <circle cx="70" cy="128" r="5.5" fill="#5b3aa0" opacity="0.4" filter="url(#jsBlur)" />

      {/* Cabeza caída hacia adelante */}
      <g transform="rotate(9 70 62)">
        <circle cx="15" cy="60" r="11" fill="url(#jsBody)" stroke="#5b3aa0" strokeWidth="0.9" />
        <circle cx="125" cy="60" r="11" fill="url(#jsBody)" stroke="#5b3aa0" strokeWidth="0.9" />
        <rect x="18" y="12" width="104" height="94" rx="44" fill="url(#jsBody)" stroke="#3a2a5e" strokeWidth="1.1" />
        <ellipse cx="50" cy="25" rx="28" ry="8" fill="#ffffff" opacity="0.07" />
        <rect x="30" y="31" width="80" height="60" rx="28" fill="url(#jsFace)" stroke="#2a1f45" strokeWidth="1" />
        {/* Ojos entrecerrados y apagados */}
        <ellipse cx="53" cy="64" rx="9.5" ry="6" fill="url(#jsEye)" />
        <ellipse cx="87" cy="64" rx="9.5" ry="6" fill="url(#jsEye)" />
        {/* Cejas tristes: la punta interna sube */}
        <path d="M44 58 L61 51" stroke="#5b3aa0" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M96 58 L79 51" stroke="#5b3aa0" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Gota de sudor estilo anime */}
      <path d="M118 30 q6 8 0 12 q-6 -4 0 -12" fill="#7b9dff" opacity="0.7" />
    </svg>
  );
}

export default function JudoSuspendidoPage() {
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      margin: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      backgroundColor: "#0b0b12",
      color: "#f5f5f7",
      fontFamily: "'Poppins', Arial, Helvetica, sans-serif",
      textAlign: "center",
      padding: "24px",
    },
    title: { fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 700, margin: "6px 0 0" },
    subtitle: { fontSize: "15px", color: "rgba(245,245,247,0.55)", margin: "6px 0 26px", maxWidth: "420px" },
    linkWrap: { display: "flex", flexDirection: "column", alignItems: "center", marginTop: "-14px" },
    link: {
      display: "inline-block",
      padding: "13px 34px",
      borderRadius: "999px",
      background: "linear-gradient(120deg, #7b2dff, #9a4dff)",
      color: "#ffffff",
      fontWeight: 700,
      textDecoration: "none",
      boxShadow: "0 14px 34px -10px rgba(123,45,255,0.7)",
      marginTop: "-26px",
    },
  };

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Temporalmente deshabilitado</h1>
      <p style={styles.subtitle}>
        Este website está temporalmente fuera de servicio.
        <br />
        This website is temporarily disabled.
      </p>
      <div style={styles.linkWrap}>
        <SadMascot />
        <a href="https://www.judomarketing.net" style={styles.link}>
          www.judomarketing.net
        </a>
      </div>
    </main>
  );
}
