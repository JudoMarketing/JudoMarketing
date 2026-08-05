"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

export default function CheckoutButton({
  plan,
  label,
  secureNote,
}: {
  plan: "essential" | "complex" | "apps";
  label: string;
  secureNote: string;
}) {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, locale }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("no url");
    } catch {
      // Si Stripe no responde, llevamos al visitante a contacto
      window.location.href = `/${locale}/${locale === "es" ? "contacto" : "contact"}`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={onClick}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "…" : `${label} →`}
      </button>
      <p className="mt-2 text-center text-xs text-judo-fog/40">🔒 {secureNote}</p>
    </div>
  );
}
