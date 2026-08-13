# Guía: PatternAI → APK instalable (Capacitor + Android Studio)

Documento de referencia con los pasos realizados para convertir **patternai-app** en una aplicación Android instalable.

---

## Resumen

| Paso | Qué se hizo |
|------|-------------|
| 1 | Configurar Capacitor y generar el proyecto nativo Android |
| 2 | Abrir el proyecto en Android Studio |
| 3 | Seleccionar la carpeta correcta (`android/`) |
| 4 | Esperar la sincronización de Gradle |
| 5 | Generar la APK de debug e instalarla en el dispositivo |

---

## 1. Configuración de Capacitor en el proyecto

El proyecto ya tenía Capacitor parcialmente configurado (`@capacitor/core`, `@capacitor/cli`, plugins y `capacitor.config.ts`). Faltaba la plataforma Android.

### Comandos ejecutados (en orden)

```bash
# 1. Compilar la web (Capacitor copia la carpeta www/)
npm run build

# 2. Instalar el paquete nativo de Android (misma versión que @capacitor/core: 8.4.2)
npm install @capacitor/android@8.4.2

# 3. Crear la carpeta android/ con el proyecto nativo
npx cap add android

# 4. Sincronizar web + plugins con el proyecto Android
npx cap sync
```

### Resultado

- Carpeta **`android/`** creada en la raíz del proyecto.
- Web compilada copiada a `android/app/src/main/assets/public/`.
- 6 plugins detectados: app, filesystem, haptics, keyboard, share, status-bar.

### Configuración actual (`capacitor.config.ts`)

```ts
appId: 'io.ionic.starter'
appName: 'patternai-app'
webDir: 'www'
```

> **Nota:** Antes de publicar en Play Store, conviene cambiar `appId` a un identificador propio (ej. `com.tuempresa.patternai`).

### Requisitos en la PC

- **Node.js** y dependencias del proyecto (`npm install`).
- **Java 17** (detectado en el entorno).
- **Android Studio** con Android SDK.

---

## 2. Abrir Android Studio

Tras instalar Android Studio, se intentó:

```bash
npx cap open android
```

Si Android Studio no se abre solo, configurar la ruta (PowerShell):

```powershell
$env:CAPACITOR_ANDROID_STUDIO_PATH = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
npx cap open android
```

### En la pantalla de bienvenida

- Clic en **Open** (no en "New Project").
- **No** crear un proyecto nuevo en Android Studio; se abre el que ya generó Capacitor.

---

## 3. Carpeta correcta del proyecto

### ❌ Incorrecto

```
C:\Users\itinicti\.android
```

Esa carpeta es de **configuración** de Android/emulador, no el proyecto de la app.

### ✅ Correcto

```
C:\Users\itinicti\patternai-app\android
```

Dentro deben verse, entre otros:

- `app/`
- `gradle/`
- `build.gradle`
- `settings.gradle`
- `capacitor.settings.gradle`

Seleccionar la carpeta **`android`** y confirmar con **Select Folder**.

---

## 4. Sincronización de Gradle

Al abrir el proyecto por primera vez, Android Studio muestra:

**"Importing 'android' Gradle Project"**

- La primera vez puede tardar **5–15 minutos** (descarga de dependencias).
- Si pide instalar SDK o Build Tools → **Accept / Install**.
- Si aparece **Trust Project** → **Trust**.

### Avisos que se pueden ignorar (primera APK de prueba)

- *Project update recommended* (Android Gradle Plugin).
- *Migrate to Gradle Daemon toolchain* → **Ignore**.

Esperar hasta que desaparezca el spinner y aparezca algo como **Gradle sync finished**.

---

## 5. Generar la APK instalable

### Menú en Android Studio

1. **Build**
2. **Generate App Bundles or APKs**
3. **Build APK(s)** ← para instalar directo en el teléfono (no "Bundle" salvo Play Store)

### Ubicación de la APK (debug)

```
C:\Users\itinicti\patternai-app\android\app\build\outputs\apk\debug\app-debug.apk
```

Al terminar el build, Android Studio muestra una notificación con **locate** para abrir esa carpeta.

### Instalar en el celular

1. Copiar `app-debug.apk` al teléfono (USB, Drive, WhatsApp, etc.).
2. Abrir el archivo en el dispositivo.
3. Permitir **Instalar apps desconocidas** si el sistema lo pide.
4. Confirmar instalación.

### Probar con cable USB (opcional)

1. Activar **Opciones de desarrollador** y **Depuración USB** en el teléfono.
2. Conectar por USB.
3. En Android Studio, elegir el dispositivo en el desplegable superior.
4. Clic en **Run** ▶ (triángulo verde).

---

## Flujo de trabajo después de cambiar código

Cada vez que modifiques la app web (HTML, TS, estilos, etc.):

```bash
npm run build
npx cap sync
```

Luego en Android Studio:

- Volver a **Build → Build APK(s)**, o
- **Run** ▶ si tienes el teléfono/emulador conectado.

Capacitor **no** actualiza solo la web en Android; siempre hay que `build` + `sync` antes de recompilar la APK.

---

## Solución de problemas frecuentes

| Problema | Qué hacer |
|----------|-----------|
| `Could not find the android platform` | `npm install @capacitor/android@8.4.2` y luego `npx cap add android` |
| Android Studio no abre | Instalar Android Studio; usar `CAPACITOR_ANDROID_STUDIO_PATH` |
| Abrí `.android` por error | Cerrar y abrir `patternai-app\android` |
| SDK not found | File → Settings → Android SDK → instalar API 34 (o la que pida Gradle) |
| App en blanco en el teléfono | Verificar `npm run build` + `npx cap sync` y Supabase/URL en `environment.ts` |
| Error de red en la APK | Revisar que `environment.ts` tenga la URL correcta de Supabase y que el dispositivo tenga internet |

---

## Cambios de UI relacionados (misma sesión)

Antes de la APK, también se aplicaron estos ajustes en la app:

1. **Accesos rápidos circulares** movidos a sus pestañas:
   - **Crear guía** → pestaña **Guías**
   - **Invitar usuario** → pestaña **Equipo** (solo admin)
2. **Eliminado el banner/header** degradado en **Inicio** (estilo más limpio, tipo Rappi).
3. **Guía de ejemplo** al crear organización: título **"Mi primera guía"**, categoría General, visibilidad empresa (seed en `createOrganization`).

---

## Referencias

- [Capacitor – Workflow](https://capacitorjs.com/docs/basics/workflow)
- [Capacitor – Android](https://capacitorjs.com/docs/android)
- [Android Studio – Build APK](https://developer.android.com/studio/run)

---

*Generado: agosto 2026 · Proyecto patternai-app*
