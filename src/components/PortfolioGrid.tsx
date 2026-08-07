"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Reveal from "./Reveal";
import {
  TRABAJOS,
  categoriasConTrabajos,
  type Categoria,
} from "@/content/portfolio";

/**
 * Lista de trabajos con filtro por categoría. Diseño contenido a propósito:
 * la imagen del cliente es la protagonista y el resto acompaña sin estorbar.
 */

export default function PortfolioGrid({
  /** En el home mostramos solo un adelanto, sin filtro. */
  limite,
  conFiltro = true,
}: {
  limite?: number;
  conFiltro?: boolean;
} = {}) {
  const t = useTranslations("portfolio");
  const locale = useLocale() === "es" ? "es" : "en";
  const [filtro, setFiltro] = useState<Categoria | "todas">("todas");

  const categorias = useMemo(categoriasConTrabajos, []);
  const visibles = useMemo(() => {
    const lista =
      filtro === "todas"
        ? TRABAJOS
        : TRABAJOS.filter((trabajo) => trabajo.categoria === filtro);
    return limite ? lista.slice(0, limite) : lista;
  }, [filtro, limite]);

  const pill =
    "rounded-full border px-4 py-1.5 text-sm font-medium transition duration-200";
  const activo = "border-judo-purple bg-judo-purple text-white";
  const inactivo =
    "border-judo-lilac/25 text-judo-fog/70 hover:border-judo-lilac/60 hover:text-judo-fog";

  return (
    <div className="flex flex-col gap-10">
      {/* Filtro */}
      {conFiltro && (
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setFiltro("todas")}
          className={`${pill} ${filtro === "todas" ? activo : inactivo}`}
        >
          {t("all")}
          <span className="ml-1.5 opacity-50">{TRABAJOS.length}</span>
        </button>
        {categorias.map((categoria) => {
          const cuantos = TRABAJOS.filter(
            (trabajo) => trabajo.categoria === categoria.id
          ).length;
          return (
            <button
              key={categoria.id}
              onClick={() => setFiltro(categoria.id)}
              className={`${pill} ${filtro === categoria.id ? activo : inactivo}`}
            >
              {categoria[locale]}
              <span className="ml-1.5 opacity-50">{cuantos}</span>
            </button>
          );
        })}
      </div>
      )}

      {/* Trabajos */}
      <div className="grid gap-7 sm:grid-cols-2">
        {visibles.map((trabajo, i) => (
          <Reveal key={trabajo.slug} delay={i * 100}>
            <a
              href={trabajo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="work-card group flex h-full flex-col overflow-hidden rounded-2xl hover:-translate-y-1"
            >
              {/* Preview */}
              <div className="relative aspect-[1200/630] overflow-hidden bg-judo-black">
                <Image
                  src={trabajo.imagen}
                  alt={trabajo.nombre}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">{trabajo.nombre}</h2>
                  <span className="shrink-0 text-xs text-judo-fog/40">
                    {trabajo.dominio}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-judo-fog/65">
                  {trabajo.descripcion[locale]}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  {trabajo.etiquetas[locale].map((etiqueta) => (
                    <span
                      key={etiqueta}
                      className="rounded-full border border-judo-lilac/20 px-2.5 py-1 text-[11px] text-judo-fog/55"
                    >
                      {etiqueta}
                    </span>
                  ))}
                </div>

                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-judo-lilac transition group-hover:gap-2.5">
                  {t("visit")}
                  <span aria-hidden>↗</span>
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
