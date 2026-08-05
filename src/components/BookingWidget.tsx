"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Cita por Zoom: el visitante elige fecha y hora (hora de Miami, nunca entre
 * 12 AM y 7 AM) y se abre Google Calendar con la invitación pre-armada que
 * agrega a juniorosorio36@gmail.com como invitado — al guardarla, la cita
 * llega al calendario de Administración con email de invitación.
 * (La creación automática del enlace de Zoom llega en la fase de
 * comunicaciones con las API de Google/Zoom.)
 */

const ADMIN_GUEST = "juniorosorio36@gmail.com";

function timeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (!(h === 23)) slots.push(`${String(h).padStart(2, "0")}:30`);
    else slots.push("23:30");
  }
  return slots;
}

function labelFor(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function BookingWidget() {
  const t = useTranslations("contact.booking");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setMinDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    const start = `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
    const [h, m] = time.split(":").map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    const end = `${date.replaceAll("-", "")}T${pad(endH)}${pad(endM)}00`;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "Cita Zoom con Judo Marketing",
      dates: `${start}/${end}`,
      ctz: "America/New_York",
      details:
        "Videollamada por Zoom con Judo Marketing. Te confirmaremos el enlace de Zoom por email. · Zoom video call with Judo Marketing.",
      location: "Zoom",
      add: ADMIN_GUEST,
    });
    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
      "noopener"
    );
  };

  const inputClass =
    "rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎥</span>
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-sm text-judo-fog/60">{t("subtitle")}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
          {t("date")}
          <input
            required
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
          {t("time")}
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          >
            {timeSlots().map((slot) => (
              <option key={slot} value={slot} className="bg-judo-surface">
                {labelFor(slot)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-judo-fog/45">{t("note")}</p>
      <button type="submit" className="btn-3d w-full py-3">
        {t("button")} 🎥
      </button>
      <p className="text-center text-xs text-judo-fog/40">{t("hint")}</p>
    </form>
  );
}
