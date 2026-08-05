# Plantillas de correo de Supabase Auth

Los correos de confirmación, recuperación de clave, etc. los envía Supabase
con sus plantillas. Para que salgan con el diseño de la marca:

1. Supabase Dashboard → **Authentication** → **Emails** (o "Email Templates")
2. Elegir la plantilla **Confirm signup**
3. Subject: `Confirma tu correo, Judo Marketing`
4. Borrar el contenido del body y pegar el HTML completo de
   `supabase-confirm-signup.html`
5. Guardar

La variable `{{ .ConfirmationURL }}` la reemplaza Supabase por el enlace real
de confirmación, no tocarla.

Regla del dueño: al registrarse un vendedor llega UN SOLO correo, el de
confirmación, que además avisa que la cuenta queda en revisión hasta que
Administración la apruebe (el aviso de "aprobado" sí es un correo aparte,
sale desde /api/notify cuando el admin aprueba).

Se puede repetir el proceso con la plantilla **Reset password** usando el
mismo diseño si se desea (cambiando título, texto y `{{ .ConfirmationURL }}`).
