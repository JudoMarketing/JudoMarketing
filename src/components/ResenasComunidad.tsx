import CommunityReviews from "./CommunityReviews";
import { resenasAprobadas } from "@/lib/resenas";

/** Trae las reseñas aprobadas en el servidor y se las pasa al bloque de la portada. */
export default async function ResenasComunidad() {
  const aprobadas = await resenasAprobadas();
  return <CommunityReviews aprobadas={aprobadas} />;
}
