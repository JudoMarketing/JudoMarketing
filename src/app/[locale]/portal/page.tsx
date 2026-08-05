import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import SellerPortal from "@/components/SellerPortal";

export default function PortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <div className="judo-glow min-h-[70vh]">
      <SellerPortal />
    </div>
  );
}
