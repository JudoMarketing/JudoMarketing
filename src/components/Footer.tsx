import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconoRed, REDES } from "./SocialLinks";

/**
 * Pie de página en cuatro bloques: marca, navegación, contacto y redes.
 * Antes era una sola columna con todo apilado y se leía amontonado; separado
 * así, cada cosa se encuentra de un vistazo.
 */

const NAVEGACION = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/showcase", key: "showcase" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default function Footer() {
  const t = useTranslations("footer");
  const tLegal = useTranslations("footerLegal");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  const titulo =
    "mb-3 text-xs font-semibold tracking-wider text-judo-fog/40 uppercase";
  const enlace = "text-judo-fog/60 transition hover:text-judo-lilac";

  return (
    <footer className="border-t border-judo-lilac/15 bg-judo-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Marca */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/brand/logo-white-transparent.png"
              alt="Judo Marketing"
              width={96}
              height={96}
              className="h-12 w-12 object-contain"
            />
            <p className="mt-4 max-w-xs leading-relaxed font-semibold text-judo-fog">
              {t("tagline")}
            </p>
          </div>

          {/* Navegación */}
          <nav>
            <p className={titulo}>{t("navTitle")}</p>
            <ul className="flex flex-col gap-2.5">
              {NAVEGACION.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={enlace}>
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div>
            <p className={titulo}>{t("contactTitle")}</p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href="tel:+13059349981" className={enlace}>
                  +1 305 934 9981
                </a>
              </li>
              <li>
                <a href="mailto:admin@judomarketing.net" className={enlace}>
                  admin@judomarketing.net
                </a>
              </li>
              <li>
                <a
                  href="https://share.google/L4AqIiUXUBUE9Oav6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${enlace} block max-w-[15rem] leading-relaxed`}
                >
                  {t("address")}
                </a>
              </li>
            </ul>
          </div>

          {/* Redes */}
          <div>
            <p className={titulo}>{t("socialTitle")}</p>
            <ul className="flex flex-col gap-2.5">
              {REDES.map((red) => (
                <li key={red.id}>
                  <a
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${enlace} inline-flex items-center gap-2.5`}
                  >
                    <IconoRed id={red.id} className="h-4.5 w-4.5 shrink-0" />
                    {red.usuario}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Línea final */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-judo-lilac/10 pt-6 text-xs text-judo-fog/45 sm:flex-row sm:justify-between">
          <p>
            © {year} Judo Marketing. {t("rights")}
          </p>
          <Link href="/legal" className="transition hover:text-judo-lilac">
            {tLegal("legal")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
