/**
 * Las apps de la casa que tienen suscripción propia y, por tanto, pueden
 * tener sillas de invitado (gente que entra sin pagar).
 *
 * Esta lista la usan el portal (para pintar el selector) y el servidor (para
 * saber a quién mandarle la orden). La misma lista está en el `check` de la
 * migración 0025: si se agrega una app, se agrega en los dos lados.
 */
export const APPS_INVITADO = [
  { key: "juditoads", nombre: "JuditoADS", icono: "🚀" },
  { key: "juditos", nombre: "AI Assistants", icono: "🤖" },
  { key: "judimental", nombre: "JudiMental", icono: "🧠" },
] as const;

export type AppInvitado = (typeof APPS_INVITADO)[number]["key"];

export const ES_APP_INVITADO = (v: string): v is AppInvitado =>
  APPS_INVITADO.some((a) => a.key === v);

export function nombreApp(key: string): string {
  return APPS_INVITADO.find((a) => a.key === key)?.nombre ?? key;
}
