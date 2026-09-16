"use client";

import { useState } from "react";

const TEXTOS = {
  es: {
    nombre: "Tu nombre completo",
    declaro:
      "Al pulsar «Acepto», declaro que leí el contrato adjunto al correo y lo acepto. Esta aceptación tiene validez de firma electrónica y queda registrada con mi nombre, la fecha, la hora y mi dirección IP.",
    boton: "Acepto el contrato",
    enviando: "Registrando…",
    listo: "Contrato aceptado. En un momento te llega la copia definitiva por correo.",
    fallo: "No se pudo registrar la aceptación.",
  },
  en: {
    nombre: "Your full name",
    declaro:
      "By clicking “I accept”, I confirm that I have read the contract attached to the email and I accept it. This acceptance is an electronic signature and is recorded with my name, the date, the time and my IP address.",
    boton: "I accept the contract",
    enviando: "Recording…",
    listo: "Contract accepted. The final copy is on its way to your inbox.",
    fallo: "The acceptance could not be recorded.",
  },
};

export default function AceptarContrato({ code, locale }: { code: string; locale: "es" | "en" }) {
  const t = TEXTOS[locale];
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState<"quieto" | "enviando" | "listo">("quieto");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const aceptar = async () => {
    setEstado("enviando");
    setError(null);
    try {
      const res = await fetch("/api/acepto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nombre }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; copia?: string | null };
      if (!res.ok || !body.ok) {
        setError(body.error ?? t.fallo);
        setEstado("quieto");
        return;
      }
      setAviso(body.copia ?? null);
      setEstado("listo");
    } catch {
      setError(t.fallo);
      setEstado("quieto");
    }
  };

  if (estado === "listo") {
    return (
      <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
        <p className="font-semibold">✓ {t.listo}</p>
        {aviso && <p className="mt-1 opacity-80">{aviso}</p>}
      </div>
    );
  }

  return (
    <form
      className="mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (nombre.trim().length >= 3 && estado === "quieto") void aceptar();
      }}
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder={t.nombre}
        autoComplete="name"
        required
        minLength={3}
        className="w-full rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog placeholder:text-judo-fog/35 outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac"
      />
      <p className="mt-3 text-xs leading-relaxed text-judo-fog/55">{t.declaro}</p>
      {error && (
        <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={estado !== "quieto" || nombre.trim().length < 3}
        className="btn-3d mt-4 w-full text-sm disabled:opacity-50"
      >
        {estado === "enviando" ? t.enviando : t.boton}
      </button>
    </form>
  );
}
