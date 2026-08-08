"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase";
import ContractSigner from "./ContractSigner";
import EarningsPanel from "./EarningsPanel";
import { safeGet, safeSet, safeUuid } from "@/lib/safe";

/**
 * Portal del Vendedor (MVP Fase 3).
 * Offline-first: las visitas se guardan en localStorage con un UUID generado
 * en el teléfono y se sincronizan cuando vuelve la conexión (la columna
 * client_generated_id evita duplicados si un reintento se repite).
 */

type Profile = {
  full_name: string;
  photo_url: string | null;
  role?: string;
  photo_change_requested?: boolean;
};
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
  /** Se corrigió después de haberse subido: al sincronizar hay que pisar la fila. */
  dirty?: boolean;
};

/**
 * Este portal se usa parado en la calle, con una mano y de prisa. Todo lo que
 * se toca es de al menos 60px de alto y el texto de los campos va en 16px:
 * más chico, el iPhone hace zoom solo al enfocar y se pierde el hilo.
 */
const botonGrande =
  "flex min-h-[3.75rem] w-full items-center justify-center gap-3 rounded-2xl px-5 text-base font-semibold transition active:scale-[0.98]";
const botonPrincipal = `${botonGrande} bg-judo-purple text-white shadow-[0_10px_30px_-12px_rgba(123,45,255,0.9)] hover:bg-judo-lilac`;
const botonSecundario = `${botonGrande} border border-judo-lilac/35 text-judo-lilac hover:bg-judo-purple/15`;
const campoGrande =
  "w-full rounded-2xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-4 text-base text-judo-fog placeholder:text-judo-fog/35 outline-none transition focus:border-judo-lilac";
/** Acción chica de una tarjeta (Editar / Borrar): igual de tocable, sin gritar. */
const accionTarjeta =
  "flex min-h-[2.75rem] flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition active:scale-[0.97]";

type ServerVisit = {
  client_generated_id: string;
  prospect_name: string;
  company_name: string | null;
  visited_on: string;
  visit_time: string | null;
};

/** Cuántas visitas se traen del servidor de una vez. */
const VISITAS_TOPE = 500;

const QUEUE_KEY = "judo-visit-queue";
/** Visitas borradas en el teléfono que todavía hay que borrar del servidor. */
const DELETES_KEY = "judo-visit-deletes";

/** Achica la selfie a 900px y la pasa a JPEG (queda en pocos KB). */
async function shrinkSelfie(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.85)
    );
    if (!blob) return file;
    return new File([blob], "selfie.jpg", { type: "image/jpeg" });
  } catch {
    return file; // si el navegador no puede, sube la original
  }
}

function loadQueue(): LocalVisit[] {
  try {
    return JSON.parse(safeGet(QUEUE_KEY) ?? "[]") as LocalVisit[];
  } catch {
    return [];
  }
}

function saveQueue(q: LocalVisit[]) {
  safeSet(QUEUE_KEY, JSON.stringify(q));
}

function loadDeletes(): string[] {
  try {
    return JSON.parse(safeGet(DELETES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveDeletes(ids: string[]) {
  safeSet(DELETES_KEY, JSON.stringify(ids));
}

/**
 * Botón de la pantalla de inicio. Alto, con su ícono a la izquierda, el
 * nombre grande y debajo qué hay dentro. Se toca sin apuntar.
 */
function BotonMenu({
  icono,
  titulo,
  detalle,
  insignia,
  onClick,
}: {
  icono: string;
  titulo: string;
  detalle: string;
  insignia?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[4.75rem] w-full items-center gap-4 rounded-2xl border border-judo-lilac/25 bg-judo-surface px-5 py-4 text-left transition active:scale-[0.98] hover:border-judo-lilac/55"
    >
      <span aria-hidden className="shrink-0 text-3xl">
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-white">{titulo}</span>
        <span className="block truncate text-sm text-judo-fog/55">{detalle}</span>
      </span>
      {insignia && (
        <span className="shrink-0 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-judo-black">
          {insignia}
        </span>
      )}
      <span aria-hidden className="shrink-0 text-2xl text-judo-lilac">
        ›
      </span>
    </button>
  );
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
  // El formulario de visita vive plegado: en la calle lo que se ve primero
  // es el botón. `null` = cerrado, "" = visita nueva, un id = corrigiendo esa.
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [showSigner, setShowSigner] = useState(false);
  // El portal funciona como una app de teléfono: una pantalla de inicio con
  // botones grandes, y cada sección se abre encima. Nada de un scroll eterno.
  const [vista, setVista] = useState<"inicio" | "visitas" | "ganancias" | "documentos">(
    "inicio"
  );
  const [contracts, setContracts] = useState<SignedContract[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  /**
   * Deja la lista del teléfono igual a la del servidor, sin perder lo que
   * todavía no ha subido.
   *
   * Lo importante es que también QUITA: una visita que ya estaba arriba y
   * hoy no viene en la respuesta es una que Administración (o el propio
   * vendedor desde otro teléfono) borró. Sin esto se quedaba pegada aquí
   * para siempre y las dos listas nunca coincidían.
   */
  const fusionarVisitas = useCallback((filas: ServerVisit[] | null) => {
    const queue = loadQueue();
    const enServidor = new Set((filas ?? []).map((v) => v.client_generated_id));

    for (const sv of filas ?? []) {
      const local = queue.find((v) => v.client_generated_id === sv.client_generated_id);
      if (local) {
        // Si aquí hay una corrección sin subir, manda la del teléfono
        if (!local.dirty) {
          local.prospect_name = sv.prospect_name;
          local.company_name = sv.company_name ?? "";
          local.visited_on = sv.visited_on;
          local.visit_time = sv.visit_time?.slice(0, 5) || undefined;
          local.synced = true;
        }
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

    // Solo se poda con una respuesta completa del servidor: si la consulta
    // falló (null) o vino cortada por el tope, borrar sería inventar.
    const respuestaCompleta = filas !== null && filas.length < VISITAS_TOPE;
    const limpia = respuestaCompleta
      ? queue.filter(
          (v) => enServidor.has(v.client_generated_id) || !v.synced || v.dirty
        )
      : queue;

    limpia.sort((a, b) => (a.visited_on < b.visited_on ? 1 : -1));
    saveQueue(limpia);
    setVisits(limpia);
  }, []);

  /** Vuelve a preguntarle al servidor por las visitas y rehace la lista. */
  const refrescarVisitas = useCallback(async () => {
    if (!navigator.onLine) return;
    const { data, error } = await supabase
      .from("visits")
      .select("client_generated_id, prospect_name, company_name, visited_on, visit_time")
      .order("visited_on", { ascending: false })
      .limit(VISITAS_TOPE);
    fusionarVisitas(error ? null : ((data as ServerVisit[]) ?? []));
  }, [supabase, fusionarVisitas]);

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
          supabase
            .from("profiles")
            .select("full_name, photo_url, role, photo_change_requested")
            .eq("id", uid)
            .single(),
          supabase.from("sellers").select("status, referral_code").eq("id", uid).single(),
          supabase
            .from("signed_contracts")
            .select("id, code, client_name, business_name, pdf_path, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("visits")
            .select("client_generated_id, prospect_name, company_name, visited_on, visit_time")
            .order("visited_on", { ascending: false })
            .limit(VISITAS_TOPE),
        ]);
      // El portal de vendedores no es para el admin: a su dashboard
      if ((prof as Profile | null)?.role === "admin") {
        router.replace("/admin");
        return;
      }
      setProfile(prof as Profile | null);
      setSeller(sel as Seller | null);
      setContracts((contractsRes.data as SignedContract[]) ?? []);

      fusionarVisitas(serverVisitsRes.data as ServerVisit[] | null);
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

    // 1. Lo que se borró sin señal. Se reintenta hasta que el servidor lo
    //    confirme; si la fila ya no está, el borrado igual devuelve éxito.
    const porBorrar = loadDeletes();
    if (porBorrar.length) {
      const quedan: string[] = [];
      for (const id of porBorrar) {
        const { error } = await supabase
          .from("visits")
          .delete()
          .eq("client_generated_id", id);
        if (error) quedan.push(id);
      }
      saveDeletes(quedan);
    }

    // 2. Altas y correcciones
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
      // Una visita nueva no debe pisar nada (un reintento no puede duplicar);
      // una corregida sí tiene que sobreescribir la fila que ya está arriba.
      const opciones = {
        onConflict: "client_generated_id",
        ignoreDuplicates: !visit.dirty,
      };
      let { error } = await supabase.from("visits").upsert(record, opciones);
      // Base de datos sin la columna de hora todavía: reintentar sin ella
      if (error && error.message.includes("visit_time")) {
        delete record.visit_time;
        ({ error } = await supabase.from("visits").upsert(record, opciones));
      }
      if (!error) {
        visit.synced = true;
        delete visit.dirty;
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

  // Al volver a la app (o al recuperar la señal) se vuelve a preguntar por
  // las visitas. Si Administración borró alguna, aquí también desaparece.
  useEffect(() => {
    if (!userId) return;
    const alVolver = () => {
      if (document.visibilityState === "visible") void refrescarVisitas();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("online", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("online", alVolver);
    };
  }, [userId, refrescarVisitas]);

  // ── Acciones ──────────────────────────────────────────────────────
  const hoy = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const decir = (texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(""), 2500);
  };

  /** Abre el formulario en blanco, para una visita nueva. */
  const nuevaVisita = () => {
    setProspect("");
    setCompany("");
    setVisitDate(hoy());
    setVisitTime("");
    setEditando("");
  };

  /** Abre el formulario con los datos de una visita ya registrada. */
  const editarVisita = (visit: LocalVisit) => {
    setProspect(visit.prospect_name);
    setCompany(visit.company_name);
    setVisitDate(visit.visited_on);
    setVisitTime(visit.visit_time ?? "");
    setEditando(visit.client_generated_id);
  };

  /**
   * Guarda: crea una visita nueva o corrige la que se está editando.
   *
   * Todo pasa primero por el teléfono y después por el servidor, para que
   * funcione sin señal. Una corrección se marca `dirty` para que al subir
   * pise la fila que ya existe en vez de ignorarse como duplicado.
   */
  const guardarVisita = (e: React.FormEvent) => {
    e.preventDefault();
    const queue = loadQueue();
    let nuevaCola: LocalVisit[];

    if (editando) {
      nuevaCola = queue.map((v) =>
        v.client_generated_id === editando
          ? {
              ...v,
              prospect_name: prospect.trim(),
              company_name: company.trim(),
              visited_on: visitDate,
              visit_time: visitTime || undefined,
              synced: false,
              dirty: true,
            }
          : v
      );
      decir(t("visitUpdated"));
    } else {
      nuevaCola = [
        {
          client_generated_id: safeUuid(),
          prospect_name: prospect.trim(),
          company_name: company.trim(),
          visited_on: visitDate,
          visit_time: visitTime || undefined,
          synced: false,
        },
        ...queue,
      ];
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    }

    saveQueue(nuevaCola);
    setVisits(nuevaCola);
    setEditando(null);
    setProspect("");
    setCompany("");
    setVisitTime("");
    void syncQueue();
  };

  /**
   * Borra una visita. Sale de la lista del teléfono al instante; si ya estaba
   * arriba, queda anotada para borrarla del servidor apenas haya señal.
   */
  const borrarVisita = (visit: LocalVisit) => {
    if (!window.confirm(t("visitConfirmDelete", { name: visit.prospect_name }))) return;
    const queue = loadQueue().filter(
      (v) => v.client_generated_id !== visit.client_generated_id
    );
    saveQueue(queue);
    setVisits(queue);
    if (editando === visit.client_generated_id) setEditando(null);
    if (visit.synced || visit.dirty) {
      saveDeletes([...loadDeletes(), visit.client_generated_id]);
    }
    decir(t("visitDeleted"));
    void syncQueue();
  };

  const uploadPhoto = async (rawFile: File) => {
    if (!userId) return;
    setPhotoError("");
    setUploadingPhoto(true);
    try {
      // Las selfies de teléfono pesan varios MB y las de iPhone vienen en
      // HEIC: se achican y se convierten a JPEG aquí mismo para que suban
      // rápido con poco internet y nunca choquen con el límite del bucket
      const file = await shrinkSelfie(rawFile);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) {
        setPhotoError(`${t("photoError")} (${error.message})`);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // El candado de la base rechaza el cambio si ya hay foto y
      // Administración no pidió una nueva
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ photo_url: data.publicUrl })
        .eq("id", userId);
      if (upErr) {
        setPhotoError(
          upErr.message.includes("Administración") ? t("photoLocked") : `${t("photoError")} (${upErr.message})`
        );
        return;
      }
      setProfile((p) =>
        p ? { ...p, photo_url: data.publicUrl, photo_change_requested: false } : p
      );
    } finally {
      setUploadingPhoto(false);
    }
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
        <button
          onClick={logout}
          className="flex min-h-[2.75rem] shrink-0 items-center gap-1.5 rounded-full border border-red-400/45 bg-red-400/10 px-4 text-sm font-semibold text-red-200 transition active:scale-[0.97] hover:bg-red-400/20"
        >
          <span aria-hidden>⏻</span>
          {t("logout")}
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
        </div>
      )}

      {/* Foto de perfil: se puede subir en cualquier momento, antes o
          después de la aprobación. Una vez subida queda bloqueada hasta
          que Administración pida una nueva. */}
      {(!profile?.photo_url || profile?.photo_change_requested) && (
        <div className="mt-6 rounded-2xl border border-judo-lilac/30 bg-judo-surface p-6">
          <h2 className="font-semibold">
            📷 {profile?.photo_change_requested ? t("photoNewRequested") : t("photoTitle")}
          </h2>
          <p className="mt-2 text-sm text-judo-fog/70">
            {profile?.photo_change_requested ? t("photoNewDesc") : t("photoDesc")}
          </p>
          <label className={`${botonPrincipal} mt-4 cursor-pointer`}>
            {uploadingPhoto ? "…" : `🤳 ${t("takeSelfie")}`}
            <input
              type="file"
              accept="image/*"
              capture="user"
              disabled={uploadingPhoto}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
              }}
            />
          </label>
          <p className="mt-2 text-xs text-judo-fog/50">{t("photoOnce")}</p>
          {photoError && <p className="mt-2 text-sm text-red-400">{photoError}</p>}
        </div>
      )}

      {profile?.photo_url && !profile?.photo_change_requested && (
        <p className="mt-4 text-center text-xs text-judo-fog/45">
          🔒 {t("photoLockedNote")}
        </p>
      )}

      {/* ══ PANTALLA DE INICIO ═════════════════════════════════════════
          Un menú de botones grandes, como una app. Cada uno abre su
          sección; nadie tiene que bajar buscando nada. */}
      {vista === "inicio" && (
        <div className="mt-6 flex flex-col gap-3">
          <BotonMenu
            icono="📍"
            titulo={t("navVisits")}
            detalle={t("navVisitsSub", { count: visits.length })}
            insignia={unsyncedCount > 0 ? `${unsyncedCount} ⏳` : undefined}
            onClick={() => {
              setVista("visitas");
              void refrescarVisitas();
            }}
          />
          {!pending && (
            <BotonMenu
              icono="📝"
              titulo={t("navNewContract")}
              detalle={t("navNewContractSub")}
              onClick={() => setShowSigner(true)}
            />
          )}
          <BotonMenu
            icono="📈"
            titulo={t("navEarnings")}
            detalle={t("navEarningsSub")}
            onClick={() => setVista("ganancias")}
          />
          <BotonMenu
            icono="📄"
            titulo={t("navDocs")}
            detalle={t("navDocsSub")}
            onClick={() => setVista("documentos")}
          />
        </div>
      )}

      {/* ══ VISITAS ════════════════════════════════════════════════════ */}
      {vista === "visitas" && (
        <>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => {
                setVista("inicio");
                setEditando(null);
              }}
              className="flex min-h-[2.75rem] items-center gap-1.5 rounded-full border border-judo-lilac/30 px-4 text-sm font-semibold text-judo-lilac"
            >
              ← {t("navBack")}
            </button>
            <h2 className="flex-1 text-lg font-bold">📍 {t("navVisits")}</h2>
            <button
              onClick={() => void refrescarVisitas()}
              title={t("refresh")}
              className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-full border border-judo-lilac/25 text-judo-lilac"
            >
              ⟳
            </button>
          </div>

          {/* Lo primero de la sección: registrar una visita nueva */}
          <button
            onClick={() => (editando === "" ? setEditando(null) : nuevaVisita())}
            className={`mt-4 ${editando === "" ? botonSecundario : botonPrincipal}`}
          >
            {editando === "" ? `✕ ${t("visitCancel")}` : `➕ ${t("newVisit")}`}
          </button>
        </>
      )}

      {/* El formulario, plegado hasta que se necesita */}
      {vista === "visitas" && editando !== null && (
        <form
          onSubmit={guardarVisita}
          className="mt-3 flex flex-col gap-3 rounded-2xl border border-judo-lilac/35 bg-judo-surface p-5"
        >
          {editando !== "" && (
            <p className="text-sm font-semibold text-judo-lilac">
              ✏️ {t("visitEditing")}
            </p>
          )}
          <input
            required
            autoFocus
            value={prospect}
            onChange={(e) => setProspect(e.target.value)}
            placeholder={t("prospectName")}
            className={campoGrande}
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t("companyName")}
            className={campoGrande}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-judo-fog/60">
              {t("visitDate")}
              <input
                required
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className={campoGrande}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-judo-fog/60">
              {t("visitTime")}
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className={campoGrande}
              />
            </label>
          </div>
          <button type="submit" className={botonPrincipal}>
            ✓ {editando === "" ? t("saveVisit") : t("visitSaveChanges")}
          </button>
          {editando !== "" && (
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="min-h-[2.75rem] text-sm text-judo-fog/50"
            >
              {t("visitCancel")}
            </button>
          )}
        </form>
      )}

      {vista === "visitas" && (justSaved || aviso) && (
        <p className="mt-3 rounded-2xl border border-emerald-400/35 bg-emerald-400/10 px-4 py-3 text-center text-sm font-semibold text-emerald-200">
          ✓ {aviso || t("savedOffline")}
        </p>
      )}

      {/* ── TUS VISITAS: tarjetas, no renglones ───────────────────────── */}
      <div className={vista === "visitas" ? "mt-6" : "hidden"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">
            📍 {t("visitsCount", { count: visits.length })}
          </h2>
          {unsyncedCount > 0 && (
            <button
              onClick={() => void syncQueue()}
              className="flex min-h-[2.5rem] items-center gap-2 rounded-full border border-amber-400/45 bg-amber-400/10 px-4 text-sm font-semibold text-amber-200"
            >
              ⟳ {unsyncedCount} {t("pendingSync")} · {t("uploadNow")}
            </button>
          )}
        </div>

        {visits.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-judo-lilac/15 bg-judo-surface p-5 text-sm text-judo-fog/50">
            {t("visitsEmpty")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {visits.slice(0, 30).map((visit) => (
              <li
                key={visit.client_generated_id}
                className={`rounded-2xl border bg-judo-surface p-4 ${
                  editando === visit.client_generated_id
                    ? "border-emerald-400/70"
                    : "border-judo-lilac/15"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-white">
                      {visit.prospect_name}
                    </span>
                    {visit.company_name && (
                      <span className="block truncate text-sm text-judo-fog/60">
                        {visit.company_name}
                      </span>
                    )}
                    <span className="mt-0.5 block text-xs text-judo-fog/40">
                      {visit.visited_on}
                      {visit.visit_time ? ` · ${visit.visit_time}` : ""}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-lg"
                    title={visit.synced ? t("synced") : t("pendingSync")}
                  >
                    {visit.synced ? (
                      <span className="text-emerald-300">✓</span>
                    ) : (
                      <span className="text-amber-300">⏳</span>
                    )}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => editarVisita(visit)}
                    className={`${accionTarjeta} border-judo-lilac/30 text-judo-lilac`}
                  >
                    ✏️ {t("visitEdit")}
                  </button>
                  <button
                    onClick={() => borrarVisita(visit)}
                    className={`${accionTarjeta} border-red-400/40 text-red-300`}
                  >
                    🗑 {t("visitDelete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ══ GANANCIAS Y CONTRATOS ══════════════════════════════════════
          Los números y lo firmado van juntos: es lo mismo visto de dos
          maneras — lo que se cerró y lo que eso paga. */}
      {vista === "ganancias" && (
        <>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => setVista("inicio")}
              className="flex min-h-[2.75rem] items-center gap-1.5 rounded-full border border-judo-lilac/30 px-4 text-sm font-semibold text-judo-lilac"
            >
              ← {t("navBack")}
            </button>
            <h2 className="flex-1 text-lg font-bold">📈 {t("navEarnings")}</h2>
          </div>

          {/* Ganancias: totales, gráfica mensual y proyección */}
          {userId && <EarningsPanel sellerId={userId} />}

          {/* Los websites que le tocan, con lo que paga cada cliente al mes */}
          {userId && <MisWebsites sellerId={userId} />}
        </>
      )}

      {/* Contratos ya firmados. Firmar uno nuevo se hace desde el inicio:
          eso es de la calle, esto es de repasar. */}
      {vista === "ganancias" && !pending && (
        <div className="mt-6 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5">
          <h2 className="text-base font-semibold">📑 {t("contractsTitle")}</h2>
          {contracts.length === 0 ? (
            <p className="mt-3 text-sm text-judo-fog/50">{t("contractsEmpty")}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {contracts.map((contract) => (
                <li
                  key={contract.id}
                  className="rounded-2xl border border-judo-lilac/15 bg-judo-black/30 p-4"
                >
                  <p className="truncate text-base font-semibold text-white">
                    {contract.client_name}
                  </p>
                  {contract.business_name && (
                    <p className="truncate text-sm text-judo-fog/60">
                      {contract.business_name}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-judo-lilac">{contract.code}</p>
                  <button
                    onClick={async () => {
                      const { data } = await supabase.storage
                        .from("contracts")
                        .createSignedUrl(contract.pdf_path, 3600);
                      if (data?.signedUrl)
                        window.open(data.signedUrl, "_blank", "noopener");
                    }}
                    className={`${accionTarjeta} mt-3 w-full border-judo-lilac/30 text-judo-lilac`}
                  >
                    📄 {t("viewPdf")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ══ DOCUMENTOS ═════════════════════════════════════════════════
          Se bajan al teléfono antes de salir, así que también tienen que
          ser tocables sin apuntar. */}
      {vista === "documentos" && (
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setVista("inicio")}
            className="flex min-h-[2.75rem] items-center gap-1.5 rounded-full border border-judo-lilac/30 px-4 text-sm font-semibold text-judo-lilac"
          >
            ← {t("navBack")}
          </button>
          <h2 className="flex-1 text-lg font-bold">📄 {t("navDocs")}</h2>
        </div>
      )}

      <div
        className={
          vista === "documentos"
            ? "mt-4 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5"
            : "hidden"
        }
      >
        <div className="flex flex-col gap-2">
          {(
            [
              ["/legal/Guion_de_Ventas.pdf", t("docScript"), true],
              ["/legal/Acuerdo_de_Servicio_Cliente.pdf", t("docContract"), false],
              ["/legal/Acuerdo_Programa_Vendedores.pdf", t("docSeller"), false],
            ] as [string, string, boolean][]
          ).map(([href, etiqueta, destacado]) => (
            <a
              key={href}
              href={href}
              download
              className={`flex min-h-[3.25rem] items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition active:scale-[0.98] ${
                destacado
                  ? "border-judo-lilac/45 bg-judo-purple/15 text-judo-lilac"
                  : "border-judo-lilac/20 text-judo-fog/85 hover:text-judo-lilac"
              }`}
            >
              <span aria-hidden className="text-lg">
                ⬇
              </span>
              {etiqueta}
            </a>
          ))}
        </div>
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

/**
 * Los websites que este vendedor tiene asignados, con lo que paga el cliente
 * al mes. Es el número del que sale su comisión: si Administración lo sube
 * porque el cliente amplió su servicio, aquí se ve al instante y además le
 * llega un correo.
 *
 * La base solo le deja ver los suyos (política "vendedor: sus sitios").
 */
function MisWebsites({ sellerId }: { sellerId: string }) {
  const t = useTranslations("portal");
  const supabase = getSupabase();
  const [sitios, setSitios] = useState<
    { id: string; name: string; domain: string | null; status: string; monthly_price: number }[]
  >([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("sites")
        .select("id,name,domain,status,monthly_price")
        .eq("seller_id", sellerId)
        .order("name");
      setSitios(data ?? []);
    })();
  }, [supabase, sellerId]);

  const etiquetaEstado = (estado: string) =>
    estado === "activo"
      ? t("sitesStatusActivo")
      : estado === "deshabilitado"
        ? t("sitesStatusDeshabilitado")
        : t("sitesStatusEnDesarrollo");

  return (
    <div className="mt-6 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-6">
      <h2 className="font-semibold">🌐 {t("sitesTitle")}</h2>
      {sitios.length === 0 ? (
        <p className="mt-3 text-sm text-judo-fog/55">{t("sitesEmpty")}</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2">
            {sitios.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-judo-lilac/15 bg-judo-black/30 px-4 py-3"
              >
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    s.status === "activo"
                      ? "bg-emerald-400"
                      : s.status === "deshabilitado"
                        ? "bg-red-400"
                        : "bg-amber-400"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-judo-fog/45">
                    {s.domain ?? "—"} · {etiquetaEstado(s.status)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-judo-lilac">
                  ${Number(s.monthly_price).toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-judo-fog/45">
                    {t("sitesMonthly")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-judo-fog/45">{t("sitesNote")}</p>
        </>
      )}
    </div>
  );
}
