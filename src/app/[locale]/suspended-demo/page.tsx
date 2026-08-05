import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import JudoSuspendidoPage from "../../../../kit/app/judo-suspendido/page";

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
