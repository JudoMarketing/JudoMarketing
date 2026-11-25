/**
 * /llms.txt: Judo Marketing en texto plano, para los asistentes de IA que lo
 * leen. Google no lo usa y pocos robots lo piden todavía: es un extra barato.
 * Lo que de verdad nos pone en ChatGPT, Claude y Perplexity es el HTML del
 * servidor y un robots.txt que los deja entrar (CEREBRO, sección 11).
 *
 * Sin precios a propósito: cambian, y aquí se quedarían viejos. Se remite a
 * /services, que los saca de src/content/pricing.json.
 */
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const TEXTO = `# Judo Marketing

> Bilingual (English and Spanish) web design and business growth agency in Miami, Florida. We build websites on a monthly plan, complex web platforms and mobile apps, and help small businesses grow online with fast strategies and business advice.

## Services
- **Essential Websites**: online stores, booking pages and service sales with modern design and your own panel. Monthly plan or one payment for the year.
- **Complex Websites**: delivery, logistics, virtual classes and custom integrations. Quoted per project.
- **Mobile Apps**: native iOS and Android apps with push notifications.
- **Growth strategies**: a plan with priorities and deadlines to bring in more customers online, including social media and Facebook and Instagram ads. Quoted per business.
- **Business advice (Full Diagnostic)**: we compare your business with your competitors and send a PDF plan with deadlines.

Judo Marketing also manages two separate businesses: JuditoADS (${SITE_URL}/juditoads), a platform to run your own Facebook and Instagram ads, and Juditos (${SITE_URL}/juditos), AI assistants that answer customers.

Current prices: ${SITE_URL}/services (Spanish: ${SITE_URL}/es/servicios)

## Contact
- Phone and WhatsApp: +1 305 934 9981
- Email: admin@judomarketing.net
- Address: 66 W Flagler St, Suite 900, Miami, FL 33130
- Languages: English and Spanish

## Pages
- [Home](${SITE_URL}/) · [Inicio en español](${SITE_URL}/es)
- [Services and prices](${SITE_URL}/services)
- [Full Diagnostic of your website and online presence](${SITE_URL}/diagnostic)
- [Portfolio of client websites](${SITE_URL}/showcase)
- [About](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact)
`;

export function GET() {
  return new Response(TEXTO, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
