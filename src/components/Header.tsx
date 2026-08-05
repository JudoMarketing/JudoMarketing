import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLink from "./NavLink";

export default function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-judo-lilac/15 bg-judo-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-white-transparent.png"
            alt="Judo Marketing"
            width={120}
            height={120}
            priority
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />
          <span className="sr-only">Judo Marketing</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <NavLink href="/">{t("home")}</NavLink>
          <NavLink href="/services">{t("services")}</NavLink>
          <LanguageSwitcher />
          <Link
            href="/login"
            className="rounded-full border border-judo-purple px-4 py-1.5 font-medium text-judo-lilac transition hover:bg-judo-purple hover:text-white"
          >
            {t("login")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
