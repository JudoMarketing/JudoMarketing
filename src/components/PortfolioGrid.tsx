"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Reveal from "./Reveal";
import { CATEGORIAS, type Categoria, type Trabajo } from "@/content/portfolio";

/**
 * Los trabajos, en fichas chicas de tres por fila tanto en teléfono como en
 * computadora. La captura del home manda; el texto acompaña sin competir.
 */

export default function PortfolioGrid({
  trabajos,
  limite,
  conFiltro = true,
}: {
  trabajos: Trabajo[];
  limite?: number;
  conFiltro?: boolean;
}) {
  const t = useTranslations("portfolio");
  const locale = useLocale() === "es" ? "es" : "en";
  const [filtro, setFiltro] = useState<Categoria | "todas">("todas");

  // Solo salen las categorías que de verdad tienen trabajos
  const categorias = useMemo(
    () => CATEGORIAS.filter((c) => trabajos.some((t) => t.categoria === c.id)),
    [trabajos]
  );

  const visibles = useMemo(() => {
    const lista =
      filtro === "todas"
        ? trabajos
        : trabajos.filter((trabajo) => trabajo.categoria === filtro);
    return limite ? lista.slice(0, limite) : lista;
  }, [trabajos, filtro, limite]);

  const pill =
    "rounded-full border px-3 py-1 text-xs font-medium transition duration-200 sm:px-4 sm:py-1.5 sm:text-sm";
  const activo = "border-judo-purple bg-judo-purple text-white";
  const inactivo =
    "border-judo-lilac/25 text-judo-fog/70 hover:border-judo-lilac/60 hover:text-judo-fog";

  if (trabajos.length === 0) {
    return <p className="text-center text-sm text-judo-fog/50">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {conFiltro && categorias.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setFiltro("todas")}
            className={`${pill} ${filtro === "todas" ? activo : inactivo}`}
          >
            {t("all")}
            <span className="ml-1.5 opacity-50">{trabajos.length}</span>
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => setFiltro(categoria.id)}
              className={`${pill} ${filtro === categoria.id ? activo : inactivo}`}
            >
              {categoria[locale]}
              <span className="ml-1.5 opacity-50">
                {trabajos.filter((t) => t.categoria === categoria.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tres por fila en cualquier pantalla */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        {visibles.map((trabajo, i) => (
          <Reveal key={trabajo.dominio} delay={i * 80}>
            <a
              href={trabajo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="work-card group flex h-full flex-col overflow-hidden rounded-xl hover:-translate-y-1"
            >
              <div className="relative aspect-[900/560] overflow-hidden bg-judo-black">
                <Image
                  src={trabajo.imagen}
                  alt={trabajo.nombre}
                  fill
                  sizes="(max-width: 640px) 33vw, 300px"
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
                />
                {/* Un borrador se puede enseñar, pero se dice que lo es */}
                {trabajo.enDesarrollo && (
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold tracking-wide text-judo-black uppercase sm:top-2.5 sm:left-2.5 sm:text-[10px]">
                    {t("wip")}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1 p-2.5 sm:gap-1.5 sm:p-4">
                <h2 className="line-clamp-2 text-[13px] leading-tight font-semibold sm:text-base">
                  {trabajo.nombre}
                </h2>
                {trabajo.descripcion[locale] && (
                  <p className="line-clamp-3 text-[10px] leading-snug text-judo-fog/55 sm:line-clamp-2 sm:text-xs">
                    {trabajo.descripcion[locale]}
                  </p>
                )}
                <span className="mt-auto pt-1.5 text-[10px] font-semibold text-judo-lilac sm:text-xs">
                  {t("visit")} ↗
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
