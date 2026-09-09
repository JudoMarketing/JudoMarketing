# Conectar los datos de Google al portal

El portal enseña, por cada website, lo que Google sabe de él: clics e
impresiones en el buscador (Search Console) y usuarios, sesiones y páginas
vistas (Analytics GA4). Los últimos 28 días contra los 28 anteriores, más las
cinco consultas y las cinco páginas que más mueven.

Entra con una **cuenta de servicio**: un robot de Google Cloud con su propio
correo, al que se le da acceso de solo lectura en cada propiedad. No hay
"inicia sesión con Google", ni tokens que caducan, ni permisos sobre la cuenta
personal de nadie.

## Lo que hay que hacer una sola vez (unos 15 minutos)

### 1. Crear el robot en Google Cloud

1. Entra a <https://console.cloud.google.com/> con la cuenta de Google de la
   empresa (la que ve Search Console y Analytics).
2. Crea un proyecto nuevo, por ejemplo **judomarketing-portal**.
3. Menú **APIs y servicios → Biblioteca**. Busca y **habilita** estas dos:
   - **Google Search Console API**
   - **Google Analytics Data API**
4. Menú **IAM y administración → Cuentas de servicio → Crear cuenta de
   servicio**. Nombre: `portal-judomarketing`. No hace falta darle ningún rol
   del proyecto: siguiente, siguiente, listo.
5. Abre la cuenta recién creada → pestaña **Claves → Agregar clave → Crear
   clave nueva → JSON**. Se descarga un archivo `.json`. **Ese archivo es la
   contraseña del robot: no se manda por chat ni por correo.**
6. Apunta el correo del robot: se ve en la lista de cuentas de servicio y
   dentro del JSON (`client_email`). Es algo como
   `portal-judomarketing@judomarketing-portal.iam.gserviceaccount.com`.

### 2. Pegar la llave en Vercel

En el proyecto de judomarketing.net → **Settings → Environment Variables**:

| Variable | Valor |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | El contenido COMPLETO del archivo `.json`, tal cual (empieza por `{` y termina por `}`) |

Marca Production (y Preview si quieres verlo antes). Después, **Redeploy**.

### 3. Darle acceso al robot en cada propiedad

Se repite por cada website del que quieras ver datos. Es un minuto por sitio.

**Search Console** (<https://search.google.com/search-console>):
propiedad → **Configuración → Usuarios y permisos → Agregar usuario** →
correo del robot → permiso **Restringido** (solo lectura) → Agregar.

**Analytics** (<https://analytics.google.com/>): **Administrar → (columna
Propiedad) Administración del acceso a la propiedad → ➕ → Agregar usuarios**
→ correo del robot → rol **Lector** → quitar la casilla de notificar → Agregar.

### 4. Decirle al portal qué propiedad es de cada website

En el portal → **Websites** → abrir el website → **Expediente → 📊 Medición**:

| Campo | Qué se pone | Dónde se copia |
| --- | --- | --- |
| Search Console (propiedad) | Exactamente como sale en Search Console: `sc-domain:pachypinchos.com` si es propiedad de dominio, o `https://www.pachypinchos.com/` si es de URL (con la barra final) | Search Console → selector de propiedades, arriba a la izquierda |
| Analytics (ID de propiedad) | Solo el número, ej. `498231477` | Analytics → Administrar → Detalles de la propiedad → "ID de propiedad" |

Con eso, en el Resumen aparece la columna **Google** y, al abrir el website, el
bloque **Google · últimos 28 días** con el detalle.

## Si algo no sale

El portal lo dice en el propio bloque, en palabras:

| Mensaje | Qué pasa | Arreglo |
| --- | --- | --- |
| *Falta GOOGLE_SERVICE_ACCOUNT_JSON en Vercel* | El robot no tiene llave | Paso 2 |
| *Google no deja entrar: agrega el correo del robot…* | El robot no es usuario de esa propiedad | Paso 3, en esa propiedad |
| *Google no encuentra esa propiedad* | La propiedad está mal escrita | Paso 4: copiar exacto, con `sc-domain:` o con la barra final |
| *falta la propiedad en Expediente › Medición* | Ese website no tiene puesta la propiedad | Paso 4 |

Los datos se guardan 15 minutos en el servidor para no pedirle a Google lo
mismo en cada clic. El botón **↻** del bloque los pide frescos.

## Lo que NO hace (todavía)

- No guarda historial: enseña la foto de hoy. Si un día se quiere ver la
  curva de seis meses, habría que guardar una fila por website y día.
- No lee el Perfil de Empresa de Google (reseñas, llamadas, cómo llegar): esa
  API pide una verificación aparte de Google que tarda semanas.
