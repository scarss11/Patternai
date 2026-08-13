# Conectar Gemini para generar guías con IA

La app genera el contenido markdown de una guía a partir del **título** (y categoría) usando **Google Gemini**. La API key **no va en la app móvil** — se guarda como secreto en Supabase.

---

## 1. Obtener la API key de Gemini

1. Entra a [Google AI Studio](https://aistudio.google.com/apikey).
2. Inicia sesión con tu cuenta Google.
3. Clic en **Create API key**.
4. Copia la clave (formato `AIza...`).

---

## 2. Guardar el secreto en Supabase

En la terminal, con el [CLI de Supabase](https://supabase.com/docs/guides/cli) instalado y el proyecto vinculado:

```bash
cd patternai-app
supabase login
supabase link --project-ref kewfaaysfoirvsbumkce

supabase secrets set GEMINI_API_KEY=AIzaTU_CLAVE_AQUI
```

---

## 3. Desplegar la Edge Function

```bash
supabase functions deploy generate-guide
```

La función está en `supabase/functions/generate-guide/index.ts`.

URL resultante (ya configurada en `environment.ts`):

```
https://kewfaaysfoirvsbumkce.supabase.co/functions/v1/generate-guide
```

---

## 4. Probar en la app

1. `npm run build && npx cap sync` (si usas APK).
2. Abre **Guías → Crear guía**.
3. Escribe un título, por ejemplo: `Proceso de ventas B2B`.
4. Pulsa **Generar con IA** ✨.
5. Espera unos segundos — el campo de contenido se llenará con markdown.
6. Revisa, ajusta y **Guardar guía**.

---

## Seguridad

| ✅ Correcto | ❌ Incorrecto |
|-------------|-------------|
| API key en `supabase secrets` | API key en `environment.ts` |
| Llamada desde la app con JWT del usuario | Llamada directa a Gemini desde el móvil |
| Edge Function valida sesión | Endpoint público sin auth |

---

## Errores frecuentes

| Mensaje | Solución |
|---------|----------|
| `GEMINI_API_KEY not configured` | Ejecuta `supabase secrets set GEMINI_API_KEY=...` y redeploy |
| `Unauthorized` | Usuario no logueado — inicia sesión en la app |
| `IA no configurada` | Falta desplegar la función o la URL en environment |
| Error 429 / quota | Revisa cuota en Google AI Studio |

---

## Costos

Gemini 2.0 Flash tiene capa gratuita en AI Studio. Revisa límites en la consola de Google.

---

*PatternAI · generate-guide Edge Function*
