"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DIAS_A_FUTURO,
  TZ,
  cuposDelDia,
  etiquetaHora,
  horasDelDia,
  miamiAUtc,
  partesMiami,
} from "@/lib/booking";

/**
 * Cita por Zoom: calendario chiquito, horas cada dos horas de 7:00 AM a
 * 1:00 AM (hora de Miami) y los datos del visitante. Al confirmar, la cita
 * queda guardada, le llega el aviso a Administración y la invitación cae
 * sola en el Google Calendar.
 */

type Paso = "dia" | "hora" | "datos" | "listo";

const inputClass =
  "w-full rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac";

function clave(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export default function BookingWidget() {
  const t = useTranslations("contact.booking");
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-US" : "es-ES";

  const [hoy, setHoy] = useState<{ anio: number; mes: number; dia: number } | null>(
    null
  );
  const [cursor, setCursor] = useState<{ anio: number; mes: number } | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [cupo, setCupo] = useState<string | null>(null);
  const [tomados, setTomados] = useState<Set<string>>(new Set());
  const [paso, setPaso] = useState<Paso>("dia");

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arrancamos en el mes actual de Miami (en el efecto, para no chocar con el
  // HTML que se renderiza en el servidor).
  useEffect(() => {
    const p = partesMiami(new Date());
    setHoy({ anio: p.anio, mes: p.mes, dia: p.dia });
    setCursor({ anio: p.anio, mes: p.mes });
  }, []);

  // Cupos ya tomados del mes que se está viendo
  const cargarTomados = useCallback(async (anio: number, mes: number) => {
    const desde = miamiAUtc(anio, mes, 1, 0).toISOString();
    const hasta = miamiAUtc(anio, mes + 1, 2, 0).toISOString();
    try {
      const res = await fetch(
        `/api/booking?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`
      );
      const data = (await res.json()) as { tomados?: string[] };
      setTomados(new Set((data.tomados ?? []).map((s) => new Date(s).toISOString())));
    } catch {
      setTomados(new Set()); // sin datos mostramos todo libre; el envío decide
    }
  }, []);

  useEffect(() => {
    if (cursor) void cargarTomados(cursor.anio, cursor.mes);
  }, [cursor, cargarTomados]);

  const limite = useMemo(
    () => Date.now() + DIAS_A_FUTURO * 24 * 60 * 60_000,
    []
  );

  // Cupos libres de un día concreto (sin los que ya pasaron)
  const cuposLibres = useCallback(
    (anio: number, mes: number, d: number) => {
      const ahora = Date.now();
      return cuposDelDia(anio, mes, d)
        .map((fecha, i) => ({ fecha, hora: horasDelDia()[i] }))
        .filter(
          ({ fecha }) =>
            fecha.getTime() > ahora &&
            fecha.getTime() < limite &&
            !tomados.has(fecha.toISOString())
        );
    },
    [tomados, limite]
  );

  const celdas = useMemo(() => {
    if (!cursor || !hoy) return [];
    const primerDiaSemana = new Date(
      Date.UTC(cursor.anio, cursor.mes - 1, 1)
    ).getUTCDay();
    const diasDelMes = new Date(
      Date.UTC(cursor.anio, cursor.mes, 0)
    ).getUTCDate();

    const lista: ({ dia: number; libre: boolean } | null)[] = Array.from(
      { length: primerDiaSemana },
      () => null
    );
    for (let d = 1; d <= diasDelMes; d++) {
      lista.push({
        dia: d,
        libre: cuposLibres(cursor.anio, cursor.mes, d).length > 0,
      });
    }
    return lista;
  }, [cursor, hoy, cuposLibres]);

  const horasDelDiaElegido = useMemo(() => {
    if (!dia) return [];
    const [anio, mes, d] = dia.split("-").map(Number);
    return cuposLibres(anio, mes, d);
  }, [dia, cuposLibres]);

  const nombreDelMes = cursor
    ? new Intl.DateTimeFormat(intlLocale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(cursor.anio, cursor.mes - 1, 1)))
    : "";

  const diasSemana = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale, {
      weekday: "short",
      timeZone: "UTC",
    });
    // 4 de enero de 1970 fue domingo
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(1970, 0, 4 + i))).slice(0, 2)
    );
  }, [intlLocale]);

  const citaLegible = cupo
    ? new Intl.DateTimeFormat(intlLocale, {
        timeZone: TZ,
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(cupo))
    : "";

  const puedeRetroceder =
    cursor && hoy
      ? cursor.anio * 12 + cursor.mes > hoy.anio * 12 + hoy.mes
      : false;

  const mover = (delta: number) => {
    if (!cursor) return;
    const total = cursor.anio * 12 + (cursor.mes - 1) + delta;
    setCursor({ anio: Math.floor(total / 12), mes: (total % 12) + 1 });
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cupo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slot: cupo,
          name: nombre,
          email: correo,
          phone: telefono,
          note: nota,
          locale,
        }),
      });
      if (res.ok) {
        setPaso("listo");
        if (cursor) void cargarTomados(cursor.anio, cursor.mes);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (data.error === "slot_taken") {
        setError(t("errorTaken"));
        setTomados((prev) => new Set(prev).add(cupo));
        setCupo(null);
        setPaso("hora");
      } else if (data.error === "slot_invalid") {
        setError(t("errorSlot"));
        setCupo(null);
        setPaso("hora");
      } else {
        setError(t("errorGeneric"));
      }
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setPaso("dia");
    setDia(null);
    setCupo(null);
    setNombre("");
    setCorreo("");
    setTelefono("");
    setNota("");
    setError(null);
  };

  if (paso === "listo") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="text-4xl">🎥</span>
        <h2 className="text-lg font-semibold">{t("successTitle")}</h2>
        <p className="text-sm font-semibold text-judo-lilac first-letter:uppercase">
          {citaLegible}
        </p>
        <p className="max-w-sm text-sm text-judo-fog/60">{t("successBody")}</p>
        <button onClick={reiniciar} className="btn-3d mt-2 px-6 py-2 text-sm">
          {t("again")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎥</span>
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-sm text-judo-fog/60">{t("subtitle")}</p>
        </div>
      </div>

      {/* Los tres pasos van en una columna angosta: el calendario se ve chiquito
          y no se estira de lado a lado en pantallas grandes. */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      {/* Paso 1 · el calendario */}
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-judo-fog/50 uppercase">
          {t("pickDay")}
        </p>
        <div className="rounded-2xl border border-judo-lilac/20 bg-judo-black/40 p-3">
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              onClick={() => mover(-1)}
              disabled={!puedeRetroceder}
              aria-label="←"
              className="rounded-lg px-2 py-1 text-judo-lilac transition hover:bg-judo-purple/20 disabled:opacity-25"
            >
              ‹
            </button>
            <span className="text-sm font-semibold first-letter:uppercase">
              {nombreDelMes}
            </span>
            <button
              type="button"
              onClick={() => mover(1)}
              aria-label="→"
              className="rounded-lg px-2 py-1 text-judo-lilac transition hover:bg-judo-purple/20"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[10px] text-judo-fog/40 uppercase">
            {diasSemana.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {celdas.map((celda, i) => {
              if (!celda || !cursor) return <span key={i} />;
              const id = clave(cursor.anio, cursor.mes, celda.dia);
              const elegido = dia === id;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!celda.libre}
                  onClick={() => {
                    setDia(id);
                    setCupo(null);
                    setError(null);
                    setPaso("hora");
                  }}
                  className={`aspect-square rounded-lg text-xs font-semibold transition ${
                    elegido
                      ? "bg-judo-purple text-white"
                      : celda.libre
                        ? "text-judo-fog hover:bg-judo-purple/20"
                        : "text-judo-fog/20"
                  }`}
                >
                  {celda.dia}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-xs text-judo-fog/45">{t("note")}</p>
      </div>

      {/* Paso 2 · la hora */}
      {dia && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-judo-fog/50 uppercase">
            {t("pickTime")}
          </p>
          {horasDelDiaElegido.length === 0 ? (
            <p className="text-sm text-judo-fog/50">{t("noSlots")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {horasDelDiaElegido.map(({ fecha, hora }) => {
                const iso = fecha.toISOString();
                const elegido = cupo === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setCupo(iso);
                      setError(null);
                      setPaso("datos");
                    }}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                      elegido
                        ? "border-judo-purple bg-judo-purple text-white"
                        : "border-judo-lilac/25 text-judo-fog hover:border-judo-lilac hover:bg-judo-purple/15"
                    }`}
                  >
                    {etiquetaHora(hora)}
                    {hora >= 24 && (
                      <span className="block text-[9px] font-normal opacity-60">
                        {t("nextDay")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Paso 3 · los datos */}
      {cupo && (
        <form onSubmit={confirmar} className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-wide text-judo-fog/50 uppercase">
            {t("pickData")}
          </p>
          <p className="rounded-xl border border-judo-purple/40 bg-judo-purple/10 px-4 py-2 text-sm font-semibold text-judo-lilac first-letter:uppercase">
            {citaLegible}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              maxLength={80}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("name")}
              className={inputClass}
            />
            <input
              required
              type="email"
              maxLength={120}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder={t("email")}
              className={inputClass}
            />
          </div>
          <input
            maxLength={40}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder={t("phone")}
            className={inputClass}
          />
          <textarea
            maxLength={400}
            rows={2}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={t("message")}
            className={`${inputClass} resize-none`}
          />
          <button
            type="submit"
            disabled={enviando}
            className="btn-3d w-full py-3 disabled:opacity-60"
          >
            {enviando ? t("sending") : `${t("submit")} 🎥`}
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      </div>
    </div>
  );
}
