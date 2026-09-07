import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import JudoSuspendidoPage from "../../../../kit/app/judo-suspendido/page";
import { privateMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return privateMetadata(locale === "es" ? "/es/demo-suspension" : "/suspended-demo");
}

/** Demo interna: así se ve un website de cliente suspendido por el Kit. */
export default function SuspendedDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <JudoSuspendidoPage />;
}
