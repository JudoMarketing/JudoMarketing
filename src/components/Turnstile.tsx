"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

/**
 * Widget anti-bots de Cloudflare Turnstile.
 * El script se carga con next/script (cargador oficial, se deduplica entre
 * páginas) y hay un reintento por sondeo por si el script llega después del
 * montaje. Si a los 20 segundos no rindió, se muestra un aviso visible en
 * lugar de fallar en silencio.
 * La verificación real la hace Supabase Auth con la secret key; aquí solo
 * se genera el token que se pasa en cada llamada de auth.
 */

// La site key es pública por diseño (la secreta vive en Supabase). Va fija
// en el código porque .env.production no se sube al repo y Vercel no la veía.
const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAEHaSqddymNB_HBp";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function turnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}

export function resetTurnstile() {
  try {
    window.turnstile?.reset();
  } catch {
    /* el widget puede no estar montado */
  }
}

export default function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  const tryRender = useCallback(() => {
    if (!window.turnstile || !ref.current || widgetId.current) return;
    try {
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: (t: string) => {
          setFailed(false);
          onToken(t);
        },
        "expired-callback": () => onToken(""),
        "error-callback": () => {
          onToken("");
          setFailed(true);
        },
      });
    } catch {
      setFailed(true);
    }
    // onToken es un setState de React (estable entre renders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reintento por sondeo: cubre navegación entre login/registro (script ya
  // cargado) y cargas lentas. A los 20s sin widget, aviso visible.
  useEffect(() => {
    if (!SITE_KEY) return;
    tryRender();
    const poll = setInterval(() => {
      if (widgetId.current) {
        clearInterval(poll);
        return;
      }
      tryRender();
    }, 400);
    const giveUp = setTimeout(() => {
      clearInterval(poll);
      if (!widgetId.current) setFailed(true);
    }, 20000);
    return () => {
      clearInterval(poll);
      clearTimeout(giveUp);
    };
  }, [tryRender]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={tryRender}
        onError={() => setFailed(true)}
      />
      <div ref={ref} className="min-h-[65px]" />
      {failed && !widgetId.current && (
        <p className="text-xs text-amber-300">
          {locale === "es"
            ? "No se pudo cargar la verificación anti-bots. Desactiva el bloqueador de anuncios para esta página o intenta en otro navegador."
            : "The anti-bot check could not load. Disable your ad blocker for this page or try another browser."}
        </p>
      )}
    </>
  );
}
