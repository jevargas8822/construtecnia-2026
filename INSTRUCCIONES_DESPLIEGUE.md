# Guía de Despliegue en Vercel y Conexión de Base de Datos
## Constructecnia 2026 (XXI Edición - ADEIC PUCP)

Esta guía explica paso a paso cómo desplegar la aplicación en **Vercel** y conectar una base de datos **PostgreSQL** (Neon o Supabase) en menos de 5 minutos.

---

### Paso 1: Crear la Base de Datos PostgreSQL (Gratis en Neon o Supabase)

Puedes utilizar **Neon** (recomendado por su integración nativa con Vercel) o **Supabase**:

#### Opción A: Neon (Recomendado)
1. Ingresa a [neon.tech](https://neon.tech) e inicia sesión (con GitHub o Google).
2. Haz clic en **"Create Project"**.
3. Asigna el nombre `constructecnia-2026` y selecciona la región más cercana (ej. `US East (Ohio) - us-east-2`).
4. En el Dashboard de Neon, copia la cadena de conexión (**Connection String**).
   - Asegúrate de seleccionar **"Pooled connection"** (recomendado para Serverless).
   - Tendrá un formato similar a:
     ```env
     postgresql://neondb_owner:npg_xxxx@ep-cool-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

#### Opción B: Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto `constructecnia-2026`.
2. Ve a **Project Settings** -> **Database**.
3. En la sección **Connection string**, selecciona el modo **URI** y **Transaction pooler (puerto 6543)**.
4. Copia la URL reemplazando `[YOUR-PASSWORD]` por la contraseña elegida.

---

### Paso 2: Inicializar las Tablas y las 8 Ponencias

Tienes **dos formas** súper sencillas de inicializar la base de datos:

#### Método Automático (Recomendado):
Una vez desplegada la aplicación en Vercel o con la variable `DATABASE_URL` configurada, simplemente abre en tu navegador:
```
https://tu-proyecto.vercel.app/api/seed
```
El sistema ejecutará automáticamente las sentencias SQL, creando todas las tablas, índices y precargando las 8 ponencias oficiales de `config.ts`. Verás un mensaje de confirmación en formato JSON:
```json
{
  "success": true,
  "mensaje": "Base de datos inicializada correctamente con las 8 ponencias oficiales de Constructecnia 2026."
}
```

#### Método Manual (Consola SQL):
Si prefieres ejecutar el script manualmente:
1. Abre el **SQL Editor** en la consola de Neon o Supabase.
2. Abre el archivo `db/schema.sql` de este proyecto.
3. Copia todo su contenido, pégalo en el editor SQL y haz clic en **Run / Execute**.

---

### Paso 3: Desplegar en Vercel

#### A) Desde la Web de Vercel (Importando repositorio GitHub):
1. Sube este proyecto a tu cuenta de GitHub (ej. `usuario/constructecnia-2026`).
2. Entra a [vercel.com](https://vercel.com) y haz clic en **"Add New..."** -> **"Project"**.
3. Importa el repositorio de GitHub.
4. En la sección **Environment Variables**, añade las siguientes variables obligatorias:

| Nombre de Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | La cadena de conexión obtenida en el Paso 1 |
| `ADMIN_PASSWORD` | `gemrauwu67` | La contraseña de acceso exclusiva del Staff |
| `IP_SALT` | `constructecnia-adeic-pucp-2026-salt` | Sal para anonimizar IPs en SHA-256 |

5. Haz clic en **"Deploy"**. Vercel compilará el proyecto en aproximadamente 1 minuto.

#### B) O mediante Vercel CLI desde tu terminal:
```bash
npm i -g vercel
vercel login
vercel
vercel env add DATABASE_URL
vercel env add ADMIN_PASSWORD
vercel env add IP_SALT
vercel --prod
```

---

### Paso 4: Verificación Post-Despliegue

1. **Visitar el endpoint de inicio:**
   Accede a `https://tu-proyecto.vercel.app/` -> Redirigirá automáticamente a `/asistencia`.
2. **Inicializar BD si no lo hiciste antes:**
   Abre `https://tu-proyecto.vercel.app/api/seed`.
3. **Ingresar al Panel del Staff:**
   Ve a `https://tu-proyecto.vercel.app/admin/login`.
   Introduce la contraseña del staff (`gemrauwu67`).
4. **Verificar el monitor en vivo:**
   Haz clic en el botón verde **"ABRIR"** de la Ponencia 1.
   Abre en una ventana de incógnito o en tu celular la ruta `/asistencia`: la Ponencia 1 aparecerá de inmediato marcada como **"EN VIVO"**.
