"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * La mascota de Judo Marketing: el robotsito negro brillante de ojos morados.
 * Observa el cursor/dedo con movimientos suaves, parpadea y piensa con una
 * burbujita estilo anime. Al primer ingreso pregunta el idioma.
 */

const LANG_KEY = "judo-lang-chosen";

export default function Mascot() {
  const t = useTranslations("mascot");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const [bubble, setBubble] = useState<"lang" | "chat" | null>(null);
  const [blink, setBlink] = useState(false);

  // Pregunta de idioma en la primera visita
  useEffect(() => {
    if (!localStorage.getItem(LANG_KEY)) setBubble("lang");
  }, []);

  // Parpadeo natural
  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive) return;
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      setTimeout(loop, 2800 + Math.random() * 3200);
    };
    const id = setTimeout(loop, 2000);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, []);

  // Seguir el cursor / dedo con suavidad (lerp en rAF)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const onMove = (x: number, y: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35; // mirar desde la cabeza
      target.current = {
        x: Math.max(-1, Math.min(1, (x - cx) / (window.innerWidth / 2))),
        y: Math.max(-1, Math.min(1, (y - cy) / (window.innerHeight / 2))),
      };
    };
    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) onMove(touch.clientX, touch.clientY);
    };

    let raf = 0;
    const animate = () => {
      const c = current.current;
      const tg = target.current;
      c.x += (tg.x - c.x) * 0.06;
      c.y += (tg.y - c.y) * 0.06;
      if (headRef.current) {
        headRef.current.style.transform = `translate(${c.x * 5}px, ${c.y * 3.5}px) rotate(${c.x * 4}deg)`;
      }
      if (eyesRef.current) {
        eyesRef.current.style.transform = `translate(${c.x * 4.5}px, ${c.y * 3}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  const chooseLang = useCallback(
    (lang: "es" | "en") => {
      localStorage.setItem(LANG_KEY, lang);
      setBubble(null);
      if (lang !== locale) {
        router.replace(pathname, { locale: lang });
      }
    },
    [locale, pathname, router]
  );

  const onRobotClick = () => {
    setBubble((b) => (b === "chat" ? null : b === "lang" ? "lang" : "chat"));
  };

  return (
    <div
      ref={wrapRef}
      className="fixed right-2 bottom-2 z-40 origin-bottom-right scale-[0.68] select-none sm:right-6 sm:bottom-6 sm:scale-100"
    >
      {bubble && (
        <div className="thought-bubble">
          {bubble === "lang" ? (
            <>
              <p className="text-sm">{t("greeting")}</p>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => chooseLang("es")}
                  className="rounded-full bg-judo-purple px-3 py-1 text-xs font-semibold text-white transition hover:bg-judo-lilac"
                >
                  {t("spanish")}
                </button>
                <button
                  onClick={() => chooseLang("en")}
                  className="rounded-full border border-judo-purple px-3 py-1 text-xs font-semibold text-judo-lilac transition hover:bg-judo-purple/15"
                >
                  {t("english")}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm">{t("chatSoon")}</p>
          )}
          <span className="thought-dot thought-dot-1" />
          <span className="thought-dot thought-dot-2" />
        </div>
      )}

      <button
        onClick={onRobotClick}
        aria-label="Judo Marketing mascot"
        className="mascot-float block cursor-pointer bg-transparent"
      >
        <svg
          width="118"
          height="132"
          viewBox="0 0 140 158"
          fill="none"
          className="drop-shadow-[0_10px_30px_rgba(123,45,255,0.35)]"
        >
          <defs>
            <linearGradient id="mBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2b2b38" />
              <stop offset="0.55" stopColor="#15151d" />
              <stop offset="1" stopColor="#0a0a10" />
            </linearGradient>
            <linearGradient id="mFace" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0a0a12" />
              <stop offset="1" stopColor="#05050a" />
            </linearGradient>
            <radialGradient id="mEye" cx="0.5" cy="0.4" r="0.75">
              <stop offset="0" stopColor="#f2e8ff" />
              <stop offset="0.45" stopColor="#c9a2ff" />
              <stop offset="1" stopColor="#7b2dff" />
            </radialGradient>
            <radialGradient id="mGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#7b2dff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#7b2dff" stopOpacity="0" />
            </radialGradient>
            <filter id="mBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Resplandor bajo el robot */}
          <ellipse cx="70" cy="148" rx="46" ry="9" fill="url(#mGlow)" />

          {/* Cuerpo */}
          <g>
            <rect x="38" y="86" width="64" height="52" rx="22" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="1" />
            <rect x="50" y="98" width="40" height="28" rx="12" fill="#0a0a12" stroke="#5b3aa0" strokeWidth="0.8" opacity="0.9" />
            <circle cx="70" cy="112" r="6" fill="#7b2dff" opacity="0.55" filter="url(#mBlur)" />
            {/* Brazos */}
            <rect x="22" y="92" width="16" height="34" rx="8" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(8 30 109)" />
            <rect x="102" y="92" width="16" height="34" rx="8" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(-8 110 109)" />
          </g>

          {/* Cabeza (sigue el cursor) */}
          <g ref={headRef} style={{ transformOrigin: "70px 52px" }}>
            {/* Audífonos laterales */}
            <rect x="8" y="34" width="14" height="30" rx="7" fill="url(#mBody)" stroke="#5b3aa0" strokeWidth="1" />
            <rect x="118" y="34" width="14" height="30" rx="7" fill="url(#mBody)" stroke="#5b3aa0" strokeWidth="1" />
            {/* Cabeza */}
            <rect x="18" y="8" width="104" height="82" rx="36" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="1.2" />
            {/* Brillo superior */}
            <ellipse cx="52" cy="20" rx="26" ry="8" fill="#ffffff" opacity="0.08" />
            {/* Placa de la cara */}
            <rect x="30" y="24" width="80" height="52" rx="24" fill="url(#mFace)" stroke="#2a1f45" strokeWidth="1" />
            {/* Ojos (siguen el cursor, parpadean) */}
            <g
              ref={eyesRef}
              style={{
                transformOrigin: "70px 50px",
                transform: blink ? "scaleY(0.08)" : undefined,
                transition: blink ? "transform 0.06s" : "transform 0.12s",
              }}
            >
              <ellipse cx="53" cy="50" rx="10.5" ry="13.5" fill="url(#mEye)" />
              <ellipse cx="87" cy="50" rx="10.5" ry="13.5" fill="url(#mEye)" />
              <ellipse cx="53" cy="50" rx="15" ry="18" fill="#7b2dff" opacity="0.25" filter="url(#mBlur)" />
              <ellipse cx="87" cy="50" rx="15" ry="18" fill="#7b2dff" opacity="0.25" filter="url(#mBlur)" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}
