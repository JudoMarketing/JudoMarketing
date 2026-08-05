import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import AdminPortal from "@/components/AdminPortal";

export default function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <div className="judo-glow min-h-[70vh]">
      <AdminPortal />
    </div>
  );
}
