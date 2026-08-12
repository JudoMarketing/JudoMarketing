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

// Encendido de nuevo (08/2026): sin él, los bots registran aplicaciones de
// vendedor a montones. Se había apagado porque el widget a veces no cargaba y
// dejaba el botón muerto; ahora, si no carga, el botón se habilita igual y es
// el servidor el que decide (ver `bloqueaEnvio`).
//
// OJO: esto por sí solo no para nada. El bot llama a la API de registro de
// Supabase sin pasar por esta página. Solo sirve si además está encendido el
// captcha en Supabase → Auth → Attack Protection, que es quien exige el token.
const CAPTCHA_ON = true;

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
  return CAPTCHA_ON && Boolean(SITE_KEY);
}

/**
 * ¿Hay que dejar el botón de enviar apagado?
 *
 * Solo mientras el widget esté vivo y todavía sin resolver. Si el widget ni
 * siquiera cargó (bloqueador de anuncios, red rara), no se castiga a la
 * persona con un botón muerto: que envíe y que el servidor conteste. Fue lo
 * que obligó a apagar el captcha la primera vez.
 */
export function bloqueaEnvio(token: string, roto: boolean): boolean {
  return turnstileEnabled() && !token && !roto;
}

export function resetTurnstile() {
  try {
    window.turnstile?.reset();
  } catch {
    /* el widget puede no estar montado */
  }
}

export default function Turnstile({
  onToken,
  onFallo,
}: {
  onToken: (t: string) => void;
  /** Avisa al formulario que el widget no cargó, para no dejar el botón muerto. */
  onFallo?: (roto: boolean) => void;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const avisar = useCallback(
    (roto: boolean) => {
      setFailed(roto);
      onFallo?.(roto);
    },
    // onFallo es un setState de React (estable entre renders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const tryRender = useCallback(() => {
    if (!window.turnstile || !ref.current || widgetId.current) return;
    try {
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: (t: string) => {
          avisar(false);
          onToken(t);
        },
        "expired-callback": () => onToken(""),
        "error-callback": () => {
          onToken("");
          avisar(true);
        },
      });
    } catch {
      avisar(true);
    }
    // onToken es un setState de React (estable entre renders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reintento por sondeo: cubre navegación entre login/registro (script ya
  // cargado) y cargas lentas. A los 20s sin widget, aviso visible.
  useEffect(() => {
    if (!CAPTCHA_ON || !SITE_KEY) return;
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
      if (!widgetId.current) avisar(true);
    }, 20000);
    return () => {
      clearInterval(poll);
      clearTimeout(giveUp);
    };
  }, [tryRender, avisar]);

  if (!CAPTCHA_ON || !SITE_KEY) return null;

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
