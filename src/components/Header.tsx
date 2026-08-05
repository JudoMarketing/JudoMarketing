import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-judo-lilac/15 bg-judo-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-white-transparent.png"
            alt="Judo Marketing"
            width={120}
            height={120}
            priority
            className="h-14 w-14 object-contain"
          />
          <span className="sr-only">Judo Marketing</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="transition hover:text-judo-lilac">
            {t("home")}
          </Link>
          <Link href="/" className="transition hover:text-judo-lilac">
            {t("services")}
          </Link>
          <LanguageSwitcher />
          <Link
            href="/"
            className="rounded-full border border-judo-purple px-4 py-1.5 font-medium text-judo-lilac transition hover:bg-judo-purple hover:text-white"
          >
            {t("login")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
