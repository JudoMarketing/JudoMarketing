"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

function FlagES({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect width="24" height="16" rx="2" fill="#c60b1e" />
      <rect y="4" width="24" height="8" fill="#ffc400" />
    </svg>
  );
}

function FlagUS({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect width="24" height="16" rx="2" fill="#b22234" />
      {[2, 5, 8, 11, 14].map((y) => (
        <rect key={y} y={y} width="24" height="1.5" fill="#ffffff" />
      ))}
      <rect width="11" height="8.5" rx="1" fill="#3c3b6e" />
      {[1.5, 4, 6.5, 9].map((x) =>
        [1.5, 4, 6.5].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.7" fill="#ffffff" />
        ))
      )}
    </svg>
  );
}

/** Banderitas siempre visibles para cambiar el idioma; la activa se resalta. */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const flagClass = "h-4 w-6 rounded-[3px]";
  const btn = (active: boolean) =>
    `flex items-center justify-center rounded-md p-1.5 transition ${
      active
        ? "bg-judo-purple/25 ring-1 ring-judo-lilac"
        : "opacity-45 hover:opacity-90"
    }`;

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-judo-lilac/20 bg-judo-surface/60 p-0.5"
      role="group"
      aria-label="Idioma / Language"
    >
      <Link
        href={pathname}
        locale="es"
        className={btn(locale === "es")}
        aria-label="Español"
        title="Español"
      >
        <FlagES className={flagClass} />
      </Link>
      <Link
        href={pathname}
        locale="en"
        className={btn(locale === "en")}
        aria-label="English"
        title="English"
      >
        <FlagUS className={flagClass} />
      </Link>
    </div>
  );
}
