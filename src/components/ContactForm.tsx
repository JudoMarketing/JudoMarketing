"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Formulario de contacto. Por ahora abre el correo del visitante con el
 * mensaje listo para admin@judomarketing.net; en la fase de comunicaciones
 * se conecta al envío directo por servidor.
 */
export default function ContactForm() {
  const t = useTranslations("contact.form");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Nuevo proyecto — ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${contact}`);
    window.location.href = `mailto:admin@judomarketing.net?subject=${subject}&body=${body}`;
  };

  const inputClass =
    "w-full rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog placeholder:text-judo-fog/35 outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("name")}
        className={inputClass}
      />
      <input
        required
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder={t("email")}
        className={inputClass}
      />
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("message")}
        rows={5}
        className={inputClass}
      />
      <button type="submit" className="btn-primary w-full">
        {t("send")} →
      </button>
      <p className="text-center text-xs text-judo-fog/40">{t("hint")}</p>
    </form>
  );
}
