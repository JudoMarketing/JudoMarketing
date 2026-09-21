import Image from "next/image";
import { BOTONES_PROMO } from "@/content/judimental-promo";

/** Fondo negro puro y tres botones, cada uno con su imagen. Nada más. */
export default function JudimentalPromo() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-black px-6 py-12 text-white">
      {BOTONES_PROMO.map((b, i) => (
        <a
          key={b.imagen}
          href={b.href}
          className="group flex w-full max-w-sm flex-col items-center gap-4"
        >
          <Image
            src={b.imagen}
            alt=""
            width={900}
            height={900}
            priority={i === 0}
            sizes="(max-width: 640px) 90vw, 384px"
            className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="w-full rounded-full border border-white/25 bg-white px-8 py-4 text-center text-base font-bold text-black transition group-hover:bg-white/90">
            {b.texto}
          </span>
        </a>
      ))}
    </main>
  );
}
