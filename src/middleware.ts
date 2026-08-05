import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Excluir api, archivos estáticos y assets de Next
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
