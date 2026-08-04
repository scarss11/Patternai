# PatternAI — Guía de montaje (con Cursor)

Este kit trae ya resueltas las partes delicadas y propensas a error:
la **migración SQL con RLS correcta** (sin la recursión infinita del borrador),
los **servicios de Angular**, los **guards**, la **Edge Function del enlace público**
y el **PDF en el dispositivo**. Lo que queda —las pantallas— lo genera Cursor
rápido con los prompts del final, que ya apuntan a estos servicios y a tu mockup.

Orden recomendado: 1 → 2 → 3 → 4 → 5 → 6 → 7.

---

## 1. Crear el proyecto Ionic + Angular

```bash
npm i -g @ionic/cli
ionic start patternai-app tabs --type=angular --capacitor
cd patternai-app
```

## 2. Instalar dependencias

```bash
npm i @supabase/supabase-js @capacitor/share @capacitor/filesystem
npm i pdfmake html-to-pdfmake marked
npm i -D @types/pdfmake
```

## 3. Copiar los archivos del kit

Copia dentro de tu proyecto, respetando rutas:

```
src/environments/environment.ts          (reemplaza el generado)
src/app/models/models.ts
src/app/services/supabase.service.ts
src/app/services/guides.service.ts
src/app/services/team.service.ts
src/app/services/share.service.ts
src/app/guards/auth.guard.ts
src/app/guards/admin.guard.ts
supabase/migrations/0001_init.sql
supabase/functions/share-guide/index.ts
```

Rellena tus llaves en `src/environments/environment.ts`
(las sacas de Supabase > Project Settings > API).

> Si `html-to-pdfmake` marca un warning de tipos, añade en `src/global.d.ts`:
> `declare module 'html-to-pdfmake';`

## 4. Supabase: base de datos + Auth

1. Crea un proyecto en https://supabase.com
2. **SQL Editor → New query →** pega `0001_init.sql` completo y **Run**.
3. **Authentication → Providers → Email:** para probar rápido, desactiva
   *"Confirm email"* (o confirma manualmente los usuarios de prueba).
4. Flujo de arranque de datos (esto lo hará la app, aquí solo para entender):
   - El **primer usuario** se registra → la app llama `sb.createOrganization('Mi empresa')`
     → queda como **admin**.
   - El admin **invita** por email desde Equipo (`TeamService.invite(...)`) →
     cuando esa persona se registre, entra ya vinculada con sus permisos.

## 5. Desplegar la Edge Function (enlace público)

```bash
npm i -g supabase
supabase login
supabase link --project-ref TU-PROJECT-REF
supabase functions deploy share-guide --no-verify-jwt
```

`--no-verify-jwt` es intencional: el enlace compartido se abre **sin login**.
La función usa `SUPABASE_SERVICE_ROLE_KEY` (ya disponible como secreto del
proyecto) para validar el token y no expone nada más.

## 6. Rutas, tabs y guards

Aplica los guards y la estructura de 3 pestañas. Prompt para Cursor:

> Configura el enrutado de una app Ionic Angular (standalone). Rutas:
> `/auth` (pública), y `/tabs` protegida con `authGuard` desde
> `src/app/guards/auth.guard.ts`, con hijas `inicio`, `guias` y `equipo`.
> La ruta `equipo` y la de crear/editar guía usan además `adminGuard` desde
> `src/app/guards/admin.guard.ts`. Usa la barra de 3 tabs (Inicio, Guías, Equipo)
> con los mismos íconos SVG del mockup `patternai-inicio-guias-equipo.html`.
> En `member` (no admin), muestra la pestaña Guías en estado bloqueado tal como
> en el mockup.

## 7. Generar las pantallas con Cursor

Abre Cursor con el proyecto **y** el archivo `patternai-inicio-guias-equipo.html`
en contexto (arrástralo al chat). Pega estos prompts uno por uno. Todos deben
**reutilizar los servicios del kit** y **copiar los estilos/tokens del mockup**
(azul `#0A84FF`, morado `#7C6CF0`, tarjetas redondeadas, badges de visibilidad).

**7.1 · Login / Registro / Crear empresa**
> Crea la página `auth` (Ionic standalone) con tres modos: iniciar sesión,
> registrarse y "crear empresa". Usa `SupabaseService`: `signIn`, `signUp` y,
> tras registrar al primer usuario, un paso opcional que llama
> `createOrganization(name)`. Estilo del mockup. Al autenticar, navega a
> `/tabs/inicio`.

**7.2 · Inicio**
> Crea la página `inicio` replicando la pantalla "Inicio" del mockup.
> Si el usuario es admin (`SupabaseService.isAdmin`), muestra "Tus guías creadas"
> con `GuidesService.listMine()` y el badge de visibilidad + contador de personas
> (`GuidesService.shareCount`). Si es miembro, muestra el saludo "Hola, {nombre} ·
> Miembro del equipo", la sección "Compartidas contigo" con
> `GuidesService.listSharedWithMe()`, y el bloque "Sin acceso al catálogo completo".
> Cada tarjeta tiene los 3 botones del mockup: PDF, Compartir, Enlace, que llaman
> a `ShareService.downloadAndSharePdf`, abrir el sheet de compartir con miembros,
> y `ShareService.createShareLink` + `nativeShareLink`.

**7.3 · Guías (catálogo, solo admin)**
> Crea la página `guias`: buscador arriba, botón "+" para crear guía, y la lista
> completa con `GuidesService.list()`. Reusa el componente de tarjeta de Inicio.
> El "+" abre un modal de creación (`GuidesService.create`) con título, categoría,
> visibilidad (private/shared/company) y contenido en markdown.

**7.4 · Detalle de guía**
> Crea `guia-detalle` que recibe un id, carga con `GuidesService.get`, renderiza
> el markdown (usa `marked`), y ofrece: Descargar PDF (`ShareService.downloadAndSharePdf`),
> Compartir con un miembro (selector con `TeamService.listMembers` →
> `ShareService.shareWithMember`) y Compartir como enlace
> (`ShareService.createShareLink` + `nativeShareLink`).

**7.5 · Equipo (solo admin)**
> Crea la página `equipo` como el mockup: lista "Miembros vinculados"
> (`TeamService.listMembers`) con avatar, nombre y tag de rol; al tocar un miembro,
> abre el panel "Permisos — {nombre}" con switches para can_view_shared,
> can_download, can_share y can_create_guides, que guardan con
> `TeamService.setPermissions`. Arriba, un botón para invitar por email
> (`TeamService.invite`).

## 8. Compilar para Android

```bash
npx cap add android
npx cap sync android
npx cap open android   # Android Studio: compilar / firmar APK o AAB
```

---

## Decisiones que dejé tomadas (cámbialas si quieres)

- **Pestaña Guías para miembros (la duda del §6 del brief):** por defecto quedó
  como tu mockup — el miembro **solo** ve lo que le compartieron y la pestaña Guías
  aparece bloqueada. Si prefieres que **todo el catálogo `company`** sea visible
  para cualquier miembro, es un cambio de 1 línea: en `0001_init.sql`, política
  `guides_select`, descomenta `or visibility = 'company'` y muestra la pestaña
  Guías también al rol `member`. Nada más cambia.

- **PDF en el dispositivo (no en el servidor):** el borrador proponía generar el
  PDF en una Edge Function. Lo hice **on-device** con `pdfmake` porque (a) funciona
  sin depender de un Chromium/servicio externo en el runtime de Deno, y (b) sigue
  respetando la seguridad: el usuario solo genera PDF de guías que la RLS ya le
  permite leer, y el archivo nunca queda en una URL pública. El enlace público sí
  vive en el servidor (Edge Function `share-guide`), que es donde tiene sentido.

- **Recursión RLS:** las funciones `current_org_id()`, `is_admin()` y
  `can_manage_guides()` son `SECURITY DEFINER` a propósito: leen `profiles` sin
  volver a disparar las políticas de `profiles`, que era lo que habría roto el
  borrador original (error `infinite recursion detected in policy`).
