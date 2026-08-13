import { AppLanguage } from '../utils/preferences.util';

export interface AyudaArticle {
  id: string;
  title: string;
  icon: string;
  category: string;
  content_md: string;
}

const AYUDA_ES: AyudaArticle[] = [
  {
    id: 'bienvenida',
    title: 'Bienvenido a PatternAI',
    icon: 'hand-left-outline',
    category: 'General',
    content_md: `# Bienvenido a PatternAI

PatternAI es donde tu equipo guarda **procedimientos, guías y know-how** — claro, buscable y fácil de compartir. Sirve para ventas, operaciones, soporte, RRHH o cualquier área.

## ¿Qué puedes hacer?

- **Crear guías** en markdown desde la pestaña Guías.
- **Generar con IA** a partir del título.
- **Decidir quién las ve**: privada, compartida o toda la empresa.
- **Descargar PDF** y **compartir** con el equipo o por enlace.
- **Invitar miembros** desde Equipo.

## Primeros pasos

1. Explora **Inicio** y **Guías**.
2. Crea una guía con el botón **Generar con IA**.
3. Invita a alguien desde **Equipo**.
`,
  },
  {
    id: 'crear-guia',
    title: 'Cómo crear una guía',
    icon: 'create-outline',
    category: 'Guías',
    content_md: `# Cómo crear una guía

## Paso 1 · Abre Guías
Toca **Guías** y pulsa **Crear guía**.

## Paso 2 · Completa los datos
- **Título**: claro y buscable.
- **Categoría**: Ventas, Operaciones, Atención al cliente, RRHH o General.
- **Visibilidad**: Privada, Compartida o Empresa.

## Paso 3 · Contenido
Escribe en Markdown o pulsa **Generar con IA** para crear el borrador automáticamente.
`,
  },
  {
    id: 'compartir',
    title: 'Compartir: app, PDF o enlace',
    icon: 'share-social-outline',
    category: 'Guías',
    content_md: `# Compartir guías

- **En la app** — elige un miembro del equipo.
- **PDF** — descarga y envía por cualquier canal.
- **Enlace** — link externo de solo lectura.

Los permisos se configuran en **Equipo**.
`,
  },
  {
    id: 'equipo-permisos',
    title: 'Equipo y permisos',
    icon: 'people-outline',
    category: 'Equipo',
    content_md: `# Equipo y permisos

Invita por email, asigna rol (Miembro o Administrador) y configura permisos: ver, descargar, compartir y crear guías.
`,
  },
];

const AYUDA_EN: AyudaArticle[] = [
  {
    id: 'bienvenida',
    title: 'Welcome to PatternAI',
    icon: 'hand-left-outline',
    category: 'General',
    content_md: `# Welcome to PatternAI

PatternAI is where your team stores **procedures, guides and know-how** — clear, searchable and easy to share. Works for sales, operations, support, HR or any team.

## What you can do

- **Create guides** in markdown from the Guides tab.
- **Generate with AI** from the title.
- **Control visibility**: private, shared or company-wide.
- **Download PDF** and **share** with the team or via link.
- **Invite members** from Team.

## Getting started

1. Explore **Home** and **Guides**.
2. Create a guide with **Generate with AI**.
3. Invite someone from **Team**.
`,
  },
  {
    id: 'crear-guia',
    title: 'How to create a guide',
    icon: 'create-outline',
    category: 'Guides',
    content_md: `# How to create a guide

## Step 1 · Open Guides
Tap **Guides** and press **Create guide**.

## Step 2 · Fill in details
- **Title**: clear and searchable.
- **Category**: Sales, Operations, Customer support, HR or General.
- **Visibility**: Private, Shared or Company.

## Step 3 · Content
Write in Markdown or tap **Generate with AI** for an automatic draft.
`,
  },
  {
    id: 'compartir',
    title: 'Share: app, PDF or link',
    icon: 'share-social-outline',
    category: 'Guides',
    content_md: `# Sharing guides

- **In the app** — pick a team member.
- **PDF** — download and send anywhere.
- **Link** — read-only external link.

Permissions are managed in **Team**.
`,
  },
  {
    id: 'equipo-permisos',
    title: 'Team and permissions',
    icon: 'people-outline',
    category: 'Team',
    content_md: `# Team and permissions

Invite by email, assign role (Member or Administrator) and set permissions: view, download, share and create guides.
`,
  },
];

export function getAyudaArticles(lang: AppLanguage = 'es'): AyudaArticle[] {
  return lang === 'en' ? AYUDA_EN : AYUDA_ES;
}

/** @deprecated Use getAyudaArticles(lang) */
export const AYUDA_ARTICULOS = AYUDA_ES;

export function getAyudaById(id: string, lang: AppLanguage = 'es'): AyudaArticle | undefined {
  return getAyudaArticles(lang).find((a) => a.id === id);
}
