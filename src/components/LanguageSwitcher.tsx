"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "es" ? "en" : "es";

  return (
    <Link
      href={pathname}
      locale={other}
      className="rounded border border-judo-lilac/30 px-2 py-1 text-xs uppercase tracking-wide text-judo-fog/70 transition hover:text-judo-lilac"
      aria-label={other === "es" ? "Cambiar a español" : "Switch to English"}
    >
      {other}
    </Link>
  );
}
