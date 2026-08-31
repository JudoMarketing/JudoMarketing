"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLink from "./NavLink";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/showcase", key: "showcase" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [puertas, setPuertas] = useState(false);
  const cajaPuertas = useRef<HTMLDivElement>(null);

  // El menú de acceso se cierra al pulsar fuera o con Escape.
  useEffect(() => {
    if (!puertas) return;
    function fuera(e: MouseEvent) {
      if (cajaPuertas.current && !cajaPuertas.current.contains(e.target as Node)) {
        setPuertas(false);
      }
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setPuertas(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [puertas]);

  return (
    <header className="sticky top-0 z-50 border-b border-judo-lilac/15 bg-judo-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/brand/logo-white-transparent.png"
            alt="Judo Marketing"
            width={120}
            height={120}
            priority
            className="h-11 w-11 object-contain sm:h-14 sm:w-14"
          />
          <span className="sr-only">Judo Marketing</span>
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          {LINKS.map((link) => (
            <NavLink key={link.key} href={link.href}>
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <LanguageSwitcher />
          {/* Hay dos portales de cliente detrás de este botón: JuditoADS
              (anuncios) y los asistentes de IA. Antes el botón llevaba solo al
              primero, así que quien tenía asistente no encontraba su puerta.
              Ahora pregunta a dónde va.

              Los dos destinos son otras apps bajo el mismo dominio
              (/juditoads, /juditos): <a> normal, fuera del enrutado de idiomas
              — un <Link> les pegaría el prefijo de idioma delante. Si ya hay
              sesión entra directo; si no, cada app pide su login. */}
          <div ref={cajaPuertas} className="relative">
            <button
              type="button"
              onClick={() => setPuertas((v) => !v)}
              aria-expanded={puertas}
              aria-haspopup="menu"
              className="btn-3d flex items-center gap-1.5 text-sm"
            >
              {t("login")}
              <span
                aria-hidden
                className={`text-[10px] transition-transform ${puertas ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {puertas && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.6rem)] w-[17.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-judo-lilac/20 bg-judo-surface/95 shadow-2xl shadow-black/50 backdrop-blur"
              >
                <p className="border-b border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  {t("loginTitle")}
                </p>
                {(
                  [
                    ["/juditoads/app", "🚀", t("loginAds"), t("loginAdsWhat")],
                    ["/juditos/mi", "🤖", t("loginAi"), t("loginAiWhat")],
                  ] as const
                ).map(([href, emoji, nombre, que]) => (
                  <a
                    key={href}
                    href={href}
                    role="menuitem"
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.06]"
                  >
                    <span aria-hidden className="mt-0.5 text-lg">
                      {emoji}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{nombre}</span>
                      <span className="block text-xs text-judo-fog/50">{que}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
          {/* Hamburguesa (móvil) */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg border border-judo-lilac/25 lg:hidden"
          >
            <span
              className={`h-0.5 w-4.5 rounded bg-judo-fog transition ${open ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span
              className={`h-0.5 w-4.5 rounded bg-judo-fog transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`h-0.5 w-4.5 rounded bg-judo-fog transition ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {open && (
        <nav
          className="border-t border-judo-lilac/15 bg-judo-black/95 px-6 py-4 backdrop-blur lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="flex flex-col gap-4 text-base">
            {LINKS.map((link) => (
              <NavLink key={link.key} href={link.href}>
                {t(link.key)}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
