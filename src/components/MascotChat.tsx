"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { inputClass } from "./ui";
import Icono from "./Icono";

/**
 * Ventana de chat de la mascota. Vive fuera del contenedor del robot para
 * verse a tamaño completo también en el teléfono.
 *
 * Desde el 25 de noviembre de 2026 la mascota pregunta por el negocio y sus
 * problemas, resuelve dudas y agenda la videollamada aquí mismo (la lógica
 * está en /api/chat). Tres accesos rápidos para empezar sin escribir, los
 * enlaces se pueden tocar, y cuando una cita queda agendada sale su tarjeta.
 */

type Cita = { cuando: string; meet: string | null };
type Msg = { role: "user" | "assistant"; content: string; cita?: Cita };

export default function MascotChat({ onClose }: { onClose: () => void }) {
  const t = useTranslations("mascot");
  const locale = useLocale();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const atajos = t.raw("chatChips") as string[];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const enviar = async (texto: string) => {
    const text = texto.trim();
    if (!text || thinking) return;
    setError("");
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Al servidor solo va el texto: la tarjeta de la cita es de la pantalla
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })), locale }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; cita?: Cita };
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply!, cita: data.cita }]);
      } else if (data.error === "not_configured") {
        setMessages((prev) => [...prev, { role: "assistant", content: t("chatSoon") }]);
      } else if (res.status === 429) {
        setError(t("chatSlow"));
      } else {
        setError(t("chatError"));
      }
    } catch {
      setError(t("chatError"));
    } finally {
      setThinking(false);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    void enviar(input);
  };

  return (
    <div className="fixed right-2 bottom-28 z-50 flex max-h-[calc(100dvh-9rem)] w-[340px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border border-judo-lilac/30 bg-[#0e0e16] shadow-[0_24px_70px_-20px_rgba(123,45,255,0.45)] sm:right-6 sm:bottom-44 sm:max-h-[70vh]">
      <div className="flex items-center justify-between border-b border-judo-lilac/15 bg-judo-purple/15 py-1 pr-1 pl-4">
        <p className="text-sm font-semibold">{t("chatTitle")}</p>
        <button
          onClick={onClose}
          aria-label={t("chatClose")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-judo-fog/60 transition hover:text-judo-lilac"
        >
          <Icono nombre="cerrar" tamano={18} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
        <Bubble role="assistant">{t("chatIntro")}</Bubble>
        {messages.length === 0 && (
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {atajos.map((atajo) => (
              <button
                key={atajo}
                onClick={() => void enviar(atajo)}
                className="min-h-9 rounded-full border border-judo-lilac/40 px-3.5 py-1.5 text-left text-sm text-judo-lilac transition hover:bg-judo-purple/15"
              >
                {atajo}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <Fragment key={i}>
            <Bubble role={m.role}>{m.content}</Bubble>
            {m.cita && <TarjetaCita cita={m.cita} titulo={t("chatBooked")} hora={t("chatMiamiTime")} />}
          </Fragment>
        ))}
        {thinking && (
          <Bubble role="assistant">
            <span className="animate-pulse">{t("chatThinking")}</span>
          </Bubble>
        )}
        {error && <p className="px-1 text-xs text-red-400">{error}</p>}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-judo-lilac/15 p-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={600}
          placeholder={t("chatPlaceholder")}
          aria-label={t("chatPlaceholder")}
          className={`${inputClass} py-2 text-sm`}
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="flex w-11 flex-none items-center justify-center rounded-xl bg-judo-purple text-white transition hover:bg-judo-lilac disabled:opacity-50"
          aria-label={t("chatSend")}
        >
          <Icono nombre="flecha" tamano={18} />
        </button>
      </form>
    </div>
  );
}

function TarjetaCita({ cita, titulo, hora }: { cita: Cita; titulo: string; hora: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-judo-lilac/35 bg-judo-purple/15 p-3 text-sm">
      <Icono nombre="calendario" tamano={22} className="mt-0.5 flex-none text-judo-lilac" />
      <div>
        <p className="font-semibold">{titulo}</p>
        <p className="mt-0.5 text-judo-fog/80">
          {cita.cuando} ({hora})
        </p>
        {cita.meet && (
          <a href={cita.meet} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-judo-lilac underline underline-offset-2">
            Google Meet
          </a>
        )}
      </div>
    </div>
  );
}

/** Enlaces que el chat escribe (https://… o judomarketing.net/…), tocables. */
const ENLACE = /(https?:\/\/[^\s<>()]+|(?:www\.)?judomarketing\.net(?:\/[^\s<>()]*)?)/g;

function conEnlaces(texto: string) {
  return texto.split(ENLACE).map((parte, i) => {
    if (i % 2 === 0) return parte;
    // La puntuación del final es de la frase, no del enlace
    const limpio = parte.replace(/[.,;:!?]+$/, "");
    const resto = parte.slice(limpio.length);
    const href = limpio.startsWith("http")
      ? limpio
      : `https://${limpio.startsWith("www.") ? limpio : `www.${limpio}`}`;
    const externo = !/^https?:\/\/(www\.)?judomarketing\.net/.test(href);
    return (
      <Fragment key={i}>
        <a
          href={href}
          {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="break-all text-judo-lilac underline underline-offset-2"
        >
          {limpio}
        </a>
        {resto}
      </Fragment>
    );
  });
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          role === "user"
            ? "rounded-br-md bg-judo-purple text-white"
            : "rounded-bl-md border border-judo-lilac/20 bg-judo-surface text-judo-fog/90"
        }`}
      >
        {role === "assistant" && typeof children === "string" ? conEnlaces(children) : children}
      </p>
    </div>
  );
}
