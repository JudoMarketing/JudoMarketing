"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase";
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
  // Si ya hay sesión, el botón lleva directo al panel que le toca
  const [dashboard, setDashboard] = useState<"/admin" | "/portal" | null>(null);

  useEffect(() => {
    let alive = true;
    let supabase;
    try {
      supabase = getSupabase();
    } catch {
      return; // sin sesión disponible: el botón se queda en Log in
    }

    const resolve = async (userId: string | undefined) => {
      if (!userId) {
        if (alive) setDashboard(null);
        return;
      }
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        if (alive) setDashboard(prof?.role === "admin" ? "/admin" : "/portal");
      } catch {
        if (alive) setDashboard("/portal");
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data }) => resolve(data.session?.user.id))
      .catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void resolve(session?.user.id);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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
          <Link href={dashboard ?? "/login"} className="btn-3d text-sm">
            {dashboard ? t("dashboard") : t("login")}
          </Link>
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
