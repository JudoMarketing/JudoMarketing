"use client";

import { useEffect, useRef } from "react";

/**
 * Widget anti-bots de Cloudflare Turnstile.
 * Solo se muestra si NEXT_PUBLIC_TURNSTILE_SITE_KEY está configurada.
 * La verificación del token la hace Supabase Auth (Attack Protection →
 * Captcha → Turnstile con la secret key), así que aquí solo se genera el
 * token y se pasa en cada llamada de auth.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    const render = () => {
      if (!window.turnstile || !ref.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    if (window.turnstile) {
      render();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile"]'
    );
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
