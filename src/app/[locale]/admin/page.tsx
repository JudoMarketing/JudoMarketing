import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import AdminPortal from "@/components/AdminPortal";
import Lanzador from "@/components/Lanzador";

export default function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  // Piso sereno: sin glow ni líneas. Aquí se trabaja un buen rato y el
  // fondo tiene que quedarse quieto debajo de las tarjetas.
  return (
    <div className="min-h-[70vh] bg-judo-black">
      <AdminPortal />
      <Lanzador aqui="judomarketing" />
    </div>
  );
}
