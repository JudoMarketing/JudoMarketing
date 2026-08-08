"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Pantalla de "todo listo" con un visto que se dibuja solo.
 *
 * Aparece cuando alguien vuelve al home después de pagar y confirmar que ya
 * nos dio sus datos. Se va sola a los 3 segundos: es un cierre, no un
 * obstáculo. Se puede cerrar antes tocando o con Escape.
 */
export default function ListoOverlay() {
  const params = useSearchParams();
  const t = useTranslations("listo");
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (params.get("listo") !== "1") return;
    setVisible(true);

    // Limpiamos la dirección para que no reaparezca al recargar o al volver
    window.history.replaceState({}, "", window.location.pathname);

    const irse = setTimeout(() => setSaliendo(true), 2500);
    const quitar = setTimeout(() => setVisible(false), 3000);
    return () => {
      clearTimeout(irse);
      clearTimeout(quitar);
    };
  }, [params]);

  useEffect(() => {
    if (!visible) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-judo-black/95 backdrop-blur-sm transition-opacity duration-500 ${
        saliendo ? "opacity-0" : "opacity-100"
      }`}
    >
      <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden>
        <circle
          cx="66"
          cy="66"
          r="58"
          fill="none"
          stroke="#7b2dff"
          strokeWidth="4"
          strokeLinecap="round"
          className="listo-circulo"
        />
        <path
          d="M40 68 L58 86 L92 48"
          fill="none"
          stroke="#a855f7"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="listo-visto"
        />
      </svg>
      <div className="px-6 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">{t("title")}</h2>
        <p className="mt-2 text-judo-fog/60">{t("body")}</p>
      </div>
    </div>
  );
}
