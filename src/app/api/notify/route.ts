import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";

/**
 * Notificaciones por email con diseño de marca:
 *  - applied: confirmación de que la aplicación de vendedor se recibió.
 *  - approved: aviso de que Administración aprobó al vendedor
 *    (solo puede dispararla una sesión de admin).
 */

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ sent: false, reason: "smtp_not_configured" });
  }

  const { type, email, name } = (await req.json()) as {
    type?: string;
    email?: string;
    name?: string;
  };
  if (!email || !name || !type) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (type === "applied") {
    const html = brandedEmail({
      title: "¡Recibimos tu aplicación!",
      greeting: `Hola, ${name.split(" ")[0]} 👋`,
      paragraphs: [
        "Gracias por querer ser parte del equipo de vendedores de Judo Marketing.",
        "Administración está revisando tu registro. Recuerda subir tu foto de perfil desde tu portal, es obligatoria para aprobarte.",
        "Te avisaremos por este mismo correo apenas tu cuenta sea aprobada.",
      ],
      ctaLabel: "Ir a mi portal",
      ctaUrl: "https://www.judomarketing.net/es/portal",
    });
    await sendBrandedEmail(email, "Recibimos tu aplicación, Judo Marketing", html);
    return NextResponse.json({ sent: true });
  }

  if (type === "approved") {
    // Solo un admin autenticado puede disparar este aviso
    const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );
    const { data: userData } = await supabase.auth.getUser(jwt);
    if (!userData.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (prof?.role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const html = brandedEmail({
      title: "¡Fuiste aprobado! 🎉",
      greeting: `Felicidades, ${name.split(" ")[0]}`,
      paragraphs: [
        "Tu cuenta de vendedor de Judo Marketing fue aprobada por Administración.",
        "Ya puedes registrar tus visitas, firmar contratos con tus clientes y seguir tus resultados desde tu portal.",
        "Tu acuerdo de comisión está visible dentro de tu portal. ¡Vamos a crecer juntos!",
      ],
      ctaLabel: "Entrar a mi portal",
      ctaUrl: "https://www.judomarketing.net/es/portal",
    });
    await sendBrandedEmail(email, "¡Bienvenido al equipo!, Judo Marketing", html);
    return NextResponse.json({ sent: true });
  }

  return NextResponse.json({ error: "unknown_type" }, { status: 400 });
}
