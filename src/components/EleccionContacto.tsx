"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * El botón de los websites complejos. No tienen precio en el sitio: cada uno
 * se cotiza aparte y el trato es personal. Al pulsarlo, en vez de mandar a
 * pagar, el botón se abre en dos caminos y el cliente elige cómo empezar:
 * agendar una videollamada o contar su proyecto por escrito.
 */
export default function EleccionContacto({ className = "" }: { className?: string }) {
  const t = useTranslations("services.chooser");
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-expanded={false}
        className={`svc-btn ${className}`}
      >
        {t("cta")} →
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-judo-fog/55">
        {t("title")}
      </p>
      <Link href={{ pathname: "/contact", hash: "agendar" }} className="svc-btn">
        📅 {t("book")}
      </Link>
      <Link
        href="/intake"
        className="rounded-full border border-judo-lilac/40 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-judo-lilac hover:bg-white/[0.05]"
      >
        📝 {t("form")}
      </Link>
    </div>
  );
}
