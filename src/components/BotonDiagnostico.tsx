"use client";

/**
 * El botón que compra el Full Diagnostic: abre el pago de Stripe con el monto
 * de pricing.json (lo arma /api/checkout, no el navegador). Si Stripe no
 * contesta, ofrece WhatsApp para no perder al cliente.
 */

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const WHATSAPP = "https://wa.me/13059349981";

export default function BotonDiagnostico({ precio, className = "" }: { precio: string; className?: string }) {
  const t = useTranslations("diagnostic");
  const locale = useLocale();
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);

  const comprar = async () => {
    setCargando(true);
    setFallo(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto: "diagnostico", locale }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error();
    } catch {
      setFallo(true);
      setCargando(false);
    }
  };

  return (
    <div className={className}>
      <button type="button" onClick={comprar} disabled={cargando} className="svc-btn disabled:opacity-70">
        {cargando ? t("opening") : `${t("buy", { price: precio })} →`}
      </button>
      {fallo && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {t("error")}{" "}
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            {t("whatsapp")}
          </a>
        </p>
      )}
    </div>
  );
}
