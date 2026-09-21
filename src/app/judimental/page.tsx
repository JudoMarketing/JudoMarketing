import Image from "next/image";
import { BOTONES_PROMO } from "@/content/judimental-promo";

/** Fondo negro puro y tres imágenes-botón, una debajo de otra. Nada más. */
export default function JudimentalPromo() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-5 py-12">
      {BOTONES_PROMO.map((b, i) => (
        <a
          key={b.imagen}
          href={b.href}
          aria-label={b.alt}
          className="block w-full max-w-xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          <Image
            src={b.imagen}
            alt={b.alt}
            width={2172}
            height={724}
            priority={i === 0}
            sizes="(max-width: 640px) 92vw, 576px"
            className="h-auto w-full"
          />
        </a>
      ))}
    </main>
  );
}
