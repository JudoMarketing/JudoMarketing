"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import MascotChat from "./MascotChat";

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

  const [bubble, setBubble] = useState<"lang" | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
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
    if (bubble === "lang") return;
    setChatOpen((open) => !open);
  };

  return (
    <>
    {chatOpen && <MascotChat onClose={() => setChatOpen(false)} />}
    <div
      ref={wrapRef}
      className="fixed right-1 bottom-1 z-40 origin-bottom-right scale-[0.5] select-none sm:right-6 sm:bottom-6 sm:scale-100"
    >
      {bubble === "lang" && (
        <div className="thought-bubble">
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
          <ellipse cx="70" cy="150" rx="44" ry="8" fill="url(#mGlow)" />

          {/* Cuerpo (pequeño, redondeado, como el original) */}
          <g>
            {/* Brazos: hombros redondos pegados al torso */}
            <ellipse cx="34" cy="112" rx="10" ry="14" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(12 34 112)" />
            <ellipse cx="106" cy="112" rx="10" ry="14" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="0.8" transform="rotate(-12 106 112)" />
            <rect x="44" y="98" width="52" height="46" rx="20" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="1" />
            {/* Brillo del pecho */}
            <ellipse cx="58" cy="106" rx="14" ry="6" fill="#ffffff" opacity="0.07" />
            <circle cx="70" cy="122" r="7" fill="#7b2dff" opacity="0.5" filter="url(#mBlur)" />
            <circle cx="70" cy="122" r="3.2" fill="#c9a2ff" opacity="0.9" />
          </g>

          {/* Cabeza (sigue el cursor) — grande y redonda como el original */}
          <g ref={headRef} style={{ transformOrigin: "70px 54px" }}>
            {/* Pods circulares de las orejas */}
            <circle cx="13" cy="52" r="12" fill="url(#mBody)" stroke="#5b3aa0" strokeWidth="1" />
            <circle cx="127" cy="52" r="12" fill="url(#mBody)" stroke="#5b3aa0" strokeWidth="1" />
            <circle cx="13" cy="52" r="4.5" fill="#7b2dff" opacity="0.7" filter="url(#mBlur)" />
            <circle cx="127" cy="52" r="4.5" fill="#7b2dff" opacity="0.7" filter="url(#mBlur)" />
            {/* Cabeza: casco redondeado grande */}
            <rect x="16" y="2" width="108" height="98" rx="46" fill="url(#mBody)" stroke="#3a2a5e" strokeWidth="1.2" />
            {/* Brillos glossy */}
            <ellipse cx="50" cy="16" rx="30" ry="9" fill="#ffffff" opacity="0.1" />
            <ellipse cx="98" cy="88" rx="20" ry="6" fill="#7b2dff" opacity="0.12" />
            {/* Visor / placa de la cara */}
            <rect x="28" y="22" width="84" height="62" rx="30" fill="url(#mFace)" stroke="#2a1f45" strokeWidth="1" />
            <ellipse cx="54" cy="30" rx="22" ry="5" fill="#ffffff" opacity="0.05" />
            {/* Ojos (siguen el cursor, parpadean) — óvalos verticales con núcleo brillante */}
            <g
              ref={eyesRef}
              style={{
                transformOrigin: "70px 53px",
                transform: blink ? "scaleY(0.08)" : undefined,
                transition: blink ? "transform 0.06s" : "transform 0.12s",
              }}
            >
              <ellipse cx="53" cy="53" rx="16" ry="20" fill="#7b2dff" opacity="0.3" filter="url(#mBlur)" />
              <ellipse cx="87" cy="53" rx="16" ry="20" fill="#7b2dff" opacity="0.3" filter="url(#mBlur)" />
              <ellipse cx="53" cy="53" rx="10" ry="14" fill="url(#mEye)" />
              <ellipse cx="87" cy="53" rx="10" ry="14" fill="url(#mEye)" />
              <ellipse cx="53" cy="50" rx="4" ry="6.5" fill="#ffffff" opacity="0.95" />
              <ellipse cx="87" cy="50" rx="4" ry="6.5" fill="#ffffff" opacity="0.95" />
            </g>
          </g>
        </svg>
      </button>
    </div>
    </>
  );
}
