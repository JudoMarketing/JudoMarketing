/**
 * Judo Site Kit: la red de sitios del mismo dueño.
 *
 * Enlazar entre sí sitios que pertenecen a la MISMA persona o empresa es
 * legítimo y Google lo entiende como lo que es: negocios hermanos. Lo que
 * penaliza son las granjas de enlaces entre dominios sin relación real.
 * Por eso esta lista solo lleva sitios cuyo dueño es el mismo; cuando un
 * sitio de cliente ajeno use el footer, se le pasa `red={[]}` (o nada).
 *
 * Para sumar un sitio nuevo del dueño: agregarlo aquí y volver a desplegar
 * los sitios de la red. Cada uno se filtra a sí mismo con `otrosSitios()`.
 */

export type SitioDeLaRed = {
  /** Identificador corto; el sitio lo usa para excluirse de su propia lista */
  id: string;
  nombre: string;
  url: string;
  /** Una línea de qué hace, para el title del enlace (ayuda al buscador) */
  que: { es: string; en: string };
};

export const RED_PROPIA: SitioDeLaRed[] = [
  {
    id: "judo",
    nombre: "Judo Marketing",
    url: "https://www.judomarketing.net",
    que: {
      es: "Páginas web y apps para negocios pequeños y medianos",
      en: "Websites and apps for small and medium businesses",
    },
  },
  {
    id: "zanoah",
    nombre: "Zanoah",
    url: "https://zanoah.shop",
    que: {
      es: "Postres saludables en Miami: donas de proteína y banana bread",
      en: "Healthy desserts in Miami: protein donuts and banana bread",
    },
  },
  {
    id: "delivery-rush",
    nombre: "Delivery Rush Florida",
    url: "https://deliveryrushflorida.com",
    que: {
      es: "Mensajería urgente en Miami y Orlando, en menos de dos horas",
      en: "Rush courier service in Miami and Orlando, in under two hours",
    },
  },
];

/**
 * Los demás sitios de la red, sin el propio y sin Judo Marketing (ese ya va
 * en la línea de "Website por Judo Marketing" del footer, y repetirlo dos
 * veces en el mismo pie no suma nada).
 */
export function otrosSitios(idPropio: string): SitioDeLaRed[] {
  return RED_PROPIA.filter(
    (sitio) => sitio.id !== idPropio && sitio.id !== "judo"
  );
}
