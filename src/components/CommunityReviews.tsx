"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase";
import { inputClass } from "./ui";
import TiltCard from "./TiltCard";

/**
 * Reseñas enviadas por visitantes: muestra las aprobadas por Administración
 * a continuación de las fijas, y un botón pequeño y discreto para enviar
 * una nueva (queda pendiente de moderación, nada se publica solo).
 */

type ReviewRow = { id: string; name: string; place: string; body: string };

export default function CommunityReviews() {
  const t = useTranslations("reviews");
  const supabase = getSupabase();

  const [approved, setApproved] = useState<ReviewRow[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id,name,place,body")
        .eq("status", "aprobada")
        .order("created_at", { ascending: false })
        .limit(9);
      setApproved((data as ReviewRow[]) ?? []);
    })().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.from("reviews").insert({
      name: name.trim(),
      place: place.trim(),
      body: body.trim(),
    });
    setLoading(false);
    if (err) {
      setError(t("formError"));
      return;
    }
    setSent(true);
  };

  return (
    <>
      {approved.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {approved.map((r) => (
            <TiltCard key={r.id} className="flex h-full flex-col p-7">
              <div className="text-judo-lilac" aria-label="5 estrellas">
                {"★★★★★"}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-judo-fog/80">
                “{r.body}”
              </p>
              <p className="mt-5 text-sm font-semibold">
                {r.name}
                <span className="ml-2 font-normal text-judo-fog/50">{r.place}</span>
              </p>
            </TiltCard>
          ))}
        </div>
      )}

      {/* Botones pequeños, que no molesten la vista */}
      <p className="mt-8 flex flex-wrap justify-center gap-2 text-center">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-judo-lilac/25 px-4 py-1.5 text-xs text-judo-fog/50 transition hover:border-judo-lilac hover:text-judo-lilac"
        >
          ＋ {t("add")}
        </button>
        <a
          href="https://g.page/r/CQ6htnynSX33EBM/review"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-judo-lilac/25 px-4 py-1.5 text-xs text-judo-fog/50 transition hover:border-judo-lilac hover:text-judo-lilac"
        >
          ⭐ {t("google")}
        </a>
      </p>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-judo-lilac/25 bg-[#0e0e16] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <>
                <p className="rounded-xl border border-judo-lilac/30 bg-judo-purple/10 p-4 text-sm">
                  💜 {t("formThanks")}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-secondary mt-4 w-full py-2 text-sm"
                >
                  OK
                </button>
              </>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <h3 className="font-semibold">{t("formTitle")}</h3>
                <input
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("formName")}
                  className={inputClass}
                />
                <input
                  required
                  maxLength={60}
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder={t("formPlace")}
                  className={inputClass}
                />
                <textarea
                  required
                  minLength={10}
                  maxLength={400}
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t("formText")}
                  className={`${inputClass} resize-none`}
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary py-2.5 disabled:opacity-60">
                  {loading ? "…" : t("formSend")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
