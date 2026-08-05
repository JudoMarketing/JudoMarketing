import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");
  const tLegal = useTranslations("footerLegal");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-judo-lilac/15 bg-judo-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-center text-sm text-judo-fog/60">
        <p className="text-base font-semibold text-judo-fog">{t("tagline")}</p>
        <p>{t("address")}</p>
        <p>
          <a href="tel:+13059349981" className="hover:text-judo-lilac">
            305-934-9981
          </a>
          {" · "}
          <a
            href="mailto:admin@judomarketing.net"
            className="hover:text-judo-lilac"
          >
            admin@judomarketing.net
          </a>
          {" · "}
          <a
            href="https://www.instagram.com/judo.marketing"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-judo-lilac"
          >
            @judo.marketing
          </a>
        </p>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/legal" className="hover:text-judo-lilac">
            {tLegal("legal")}
          </Link>
          <Link href="/contact" className="hover:text-judo-lilac">
            {tLegal("contact")}
          </Link>
        </p>
        <p>
          © {year} Judo Marketing. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
