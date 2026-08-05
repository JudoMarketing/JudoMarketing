"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase";
import { inputClass } from "./AuthForms";
import ContractSigner from "./ContractSigner";
import EarningsPanel from "./EarningsPanel";

/**
 * Portal del Vendedor (MVP Fase 3).
 * Offline-first: las visitas se guardan en localStorage con un UUID generado
 * en el teléfono y se sincronizan cuando vuelve la conexión (la columna
 * client_generated_id evita duplicados si un reintento se repite).
 */

type Profile = { full_name: string; photo_url: string | null };
type Seller = { status: string; referral_code: string | null };
type SignedContract = {
  id: string;
  code: string;
  client_name: string;
  business_name: string | null;
  pdf_path: string;
  created_at: string;
};
type LocalVisit = {
  client_generated_id: string;
  prospect_name: string;
  company_name: string;
  visited_on: string;
  visit_time?: string;
  synced: boolean;
};

const QUEUE_KEY = "judo-visit-queue";

function loadQueue(): LocalVisit[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as LocalVisit[];
  } catch {
    return [];
  }
}

function saveQueue(q: LocalVisit[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export default function SellerPortal() {
  const t = useTranslations("portal");
  const router = useRouter();
  const supabase = getSupabase();

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [visits, setVisits] = useState<LocalVisit[]>([]);
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(true);

  // Formulario de visita
  const [prospect, setProspect] = useState("");
  const [company, setCompany] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [showSigner, setShowSigner] = useState(false);
  const [contracts, setContracts] = useState<SignedContract[]>([]);

  // ── Sesión y datos ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);
      const uid = session.user.id;
      const [{ data: prof }, { data: sel }, contractsRes, serverVisitsRes] =
        await Promise.all([
          supabase.from("profiles").select("full_name, photo_url").eq("id", uid).single(),
          supabase.from("sellers").select("status, referral_code").eq("id", uid).single(),
          supabase
            .from("signed_contracts")
            .select("id, code, client_name, business_name, pdf_path, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("visits")
            .select("client_generated_id, prospect_name, company_name, visited_on, visit_time")
            .order("visited_on", { ascending: false })
            .limit(200),
        ]);
      setProfile(prof as Profile | null);
      setSeller(sel as Seller | null);
      setContracts((contractsRes.data as SignedContract[]) ?? []);

      // Fusionar historial del servidor con la cola local del teléfono:
      // así el vendedor ve todas sus visitas aunque cambie de dispositivo
      const queue = loadQueue();
      const known = new Set(queue.map((v) => v.client_generated_id));
      type ServerVisit = {
        client_generated_id: string;
        prospect_name: string;
        company_name: string | null;
        visited_on: string;
        visit_time: string | null;
      };
      for (const sv of (serverVisitsRes.data as ServerVisit[]) ?? []) {
        if (known.has(sv.client_generated_id)) {
          const local = queue.find(
            (v) => v.client_generated_id === sv.client_generated_id
          );
          if (local) local.synced = true;
        } else {
          queue.push({
            client_generated_id: sv.client_generated_id,
            prospect_name: sv.prospect_name,
            company_name: sv.company_name ?? "",
            visited_on: sv.visited_on,
            visit_time: sv.visit_time?.slice(0, 5) || undefined,
            synced: true,
          });
        }
      }
      saveQueue(queue);
      setVisits(queue);
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Estado de conexión + cola local ───────────────────────────────
  useEffect(() => {
    setOnline(navigator.onLine);
    setVisits(loadQueue());
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setVisitDate(
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    );
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Chequeo rápido: intenta subir de una; si no hay señal o falla, queda
  // pendiente SIN recargar la página, y se reintenta solo cada 25s.
  const syncQueue = useCallback(async () => {
    if (!userId || !navigator.onLine) return;
    const queue = loadQueue();
    const pending = queue.filter((v) => !v.synced);
    if (!pending.length) return;
    for (const visit of pending) {
      const record: Record<string, unknown> = {
        client_generated_id: visit.client_generated_id,
        seller_id: userId,
        prospect_name: visit.prospect_name,
        company_name: visit.company_name || null,
        visited_on: visit.visited_on,
      };
      if (visit.visit_time) record.visit_time = visit.visit_time;
      let { error } = await supabase.from("visits").upsert(record, {
        onConflict: "client_generated_id",
        ignoreDuplicates: true,
      });
      // Base de datos sin la columna de hora todavía: reintentar sin ella
      if (error && error.message.includes("visit_time")) {
        delete record.visit_time;
        ({ error } = await supabase.from("visits").upsert(record, {
          onConflict: "client_generated_id",
          ignoreDuplicates: true,
        }));
      }
      if (!error) {
        visit.synced = true;
        saveQueue(queue);
        setVisits([...queue]);
      }
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (online) void syncQueue();
    const interval = setInterval(() => {
      if (navigator.onLine) void syncQueue();
    }, 25000);
    return () => clearInterval(interval);
  }, [online, userId, syncQueue]);

  // ── Acciones ──────────────────────────────────────────────────────
  const addVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const visit: LocalVisit = {
      client_generated_id: crypto.randomUUID(),
      prospect_name: prospect.trim(),
      company_name: company.trim(),
      visited_on: visitDate,
      visit_time: visitTime || undefined,
      synced: false,
    };
    const queue = [visit, ...loadQueue()];
    saveQueue(queue);
    setVisits(queue);
    setProspect("");
    setCompany("");
    setVisitTime("");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    void syncQueue();
  };

  const uploadPhoto = async (file: File) => {
    if (!userId) return;
    const path = `${userId}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) return;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase
      .from("profiles")
      .update({ photo_url: data.publicUrl })
      .eq("id", userId);
    setProfile((p) => (p ? { ...p, photo_url: data.publicUrl } : p));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (checking) {
    return <p className="py-24 text-center text-judo-fog/50">…</p>;
  }

  const pending = seller?.status !== "aprobado";
  const unsyncedCount = visits.filter((v) => !v.synced).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {profile?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_url}
              alt=""
              className="h-12 w-12 rounded-full border border-judo-lilac/40 object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-judo-purple/25 text-lg">
              👤
            </span>
          )}
          <div>
            <p className="font-semibold">
              {t("welcome")}, {profile?.full_name?.split(" ")[0]} 👋
            </p>
            {seller?.referral_code && (
              <p className="text-xs text-judo-fog/50">
                Código: <span className="text-judo-lilac">{seller.referral_code}</span>
              </p>
            )}
          </div>
        </div>
        <button onClick={logout} className="text-sm text-judo-fog/50 hover:text-judo-lilac">
          {t("logout")} →
        </button>
      </div>

      {!online && (
        <p className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
          📴 {t("offlineBadge")}
        </p>
      )}

      {/* Cuenta pendiente */}
      {pending && (
        <div className="mt-6 rounded-2xl border border-judo-lilac/30 bg-judo-surface p-6">
          <h2 className="text-lg font-semibold text-judo-lilac">⏳ {t("pendingTitle")}</h2>
          <p className="mt-2 text-sm text-judo-fog/70">{t("pendingDesc")}</p>
          <label className="btn-secondary mt-4 inline-flex cursor-pointer text-sm">
            {profile?.photo_url ? t("photoUploaded") : `📷 ${t("uploadPhoto")}`}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
              }}
            />
          </label>
          {!profile?.photo_url && (
            <p className="mt-2 text-xs text-judo-fog/50">{t("photoRequired")}</p>
          )}
        </div>
      )}

      {/* Ganancias: totales, gráfica mensual y proyección */}
      {userId && <EarningsPanel sellerId={userId} />}

      {/* Registrar visita */}
      <form
        onSubmit={addVisit}
        className="mt-6 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-6"
      >
        <h2 className="font-semibold">📍 {t("visitsTitle")}</h2>
        <div className="mt-4 flex flex-col gap-3">
          <input
            required
            value={prospect}
            onChange={(e) => setProspect(e.target.value)}
            placeholder={t("prospectName")}
            className={inputClass}
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t("companyName")}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
              {t("visitDate")}
              <input
                required
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
              {t("visitTime")}
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <button type="submit" className="btn-primary">
            {t("saveVisit")}
          </button>
          {justSaved && (
            <p className="text-center text-sm text-judo-lilac">✓ {t("savedOffline")}</p>
          )}
        </div>
      </form>

      {/* Lista de visitas */}
      <div className="mt-6 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-6">
        <h2 className="flex flex-wrap items-center gap-2 font-semibold">
          {t("visitsListTitle")}
          {unsyncedCount > 0 && (
            <>
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">
                {unsyncedCount} {t("pendingSync")}
              </span>
              <button
                onClick={() => void syncQueue()}
                className="rounded-full border border-judo-lilac/30 px-2.5 py-0.5 text-xs text-judo-lilac hover:bg-judo-purple/15"
              >
                ⟳ {t("uploadNow")}
              </button>
            </>
          )}
        </h2>
        {visits.length === 0 ? (
          <p className="mt-3 text-sm text-judo-fog/50">{t("visitsEmpty")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-judo-lilac/10">
            {visits.slice(0, 20).map((visit) => (
              <li
                key={visit.client_generated_id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span>
                  <span className="font-medium">{visit.prospect_name}</span>
                  {visit.company_name && (
                    <span className="text-judo-fog/50"> · {visit.company_name}</span>
                  )}
                  <span className="ml-2 text-xs text-judo-fog/40">
                    {visit.visited_on}
                    {visit.visit_time ? ` · ${visit.visit_time}` : ""}
                  </span>
                </span>
                <span className="text-xs">
                  {visit.synced ? (
                    <span className="text-emerald-300">✓</span>
                  ) : (
                    <span className="text-amber-300">⏳</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Contratos */}
      {!pending && (
        <div className="mt-6 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-6">
          <h2 className="font-semibold">📑 {t("contractsTitle")}</h2>
          <button onClick={() => setShowSigner(true)} className="btn-primary mt-3 w-full">
            📝 {t("newContract")}
          </button>
          {contracts.length === 0 ? (
            <p className="mt-3 text-sm text-judo-fog/50">{t("contractsEmpty")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-judo-lilac/10">
              {contracts.map((contract) => (
                <li
                  key={contract.id}
                  className="flex items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{contract.client_name}</span>
                    {contract.business_name && (
                      <span className="text-judo-fog/50"> · {contract.business_name}</span>
                    )}
                    <span className="ml-2 text-xs text-judo-lilac">{contract.code}</span>
                  </span>
                  <button
                    onClick={async () => {
                      const { data } = await supabase.storage
                        .from("contracts")
                        .createSignedUrl(contract.pdf_path, 3600);
                      if (data?.signedUrl)
                        window.open(data.signedUrl, "_blank", "noopener");
                    }}
                    className="shrink-0 text-xs text-judo-lilac hover:underline"
                  >
                    {t("viewPdf")} →
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Documentos */}
      <div className="mt-6 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-6">
        <h2 className="font-semibold">📄 {t("docsTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <a
              href="/legal/Acuerdo_de_Servicio_Cliente.pdf"
              download
              className="text-judo-fog/80 underline-offset-4 hover:text-judo-lilac hover:underline"
            >
              ⬇ {t("docContract")}
            </a>
          </li>
          <li>
            <a
              href="/legal/Acuerdo_Programa_Vendedores.pdf"
              download
              className="text-judo-fog/80 underline-offset-4 hover:text-judo-lilac hover:underline"
            >
              ⬇ {t("docSeller")}
            </a>
          </li>
        </ul>
      </div>

      {showSigner && userId && profile && (
        <ContractSigner
          sellerId={userId}
          sellerName={profile.full_name}
          visits={visits.map((v) => ({
            id: v.client_generated_id,
            name: v.prospect_name,
            company: v.company_name,
          }))}
          onClose={() => setShowSigner(false)}
          onSigned={(contract) => setContracts((prev) => [contract, ...prev])}
        />
      )}
    </div>
  );
}
