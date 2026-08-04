export interface AyudaArticle {
  id: string;
  title: string;
  /** Nombre del ion-icon (ionicons) */
  icon: string;
  category: string;
  content_md: string;
}

export const AYUDA_ARTICULOS: AyudaArticle[] = [
  {
    id: 'bienvenida',
    title: 'Bienvenido a PatternAI',
    icon: 'hand-left-outline',
    category: 'General',
    content_md: `# Bienvenido a PatternAI

PatternAI es el lugar donde tu equipo guarda **procedimientos, guías y know-how** en un solo sitio — claro, buscable y fácil de compartir.

## ¿Qué puedes hacer aquí?

- **Crear guías** en markdown desde la pestaña Guías.
- **Decidir quién las ve**: privada, compartida con personas concretas o visible para toda la empresa.
- **Descargar en PDF** desde cualquier tarjeta.
- **Compartir con el equipo** o **por enlace** externo.
- **Invitar miembros** desde Equipo y configurar qué puede hacer cada uno.

## Primeros pasos

1. Lee los artículos de la sección Ayuda en Cuenta.
2. Explora **Inicio** y **Guías** cuando tengas contenido.
3. Invita a alguien desde **Equipo → Invitar miembro**.
4. Crea tu primera guía real cuando quieras.

Tu espacio ya está listo para empezar.
`,
  },
  {
    id: 'crear-guia',
    title: 'Cómo crear una guía',
    icon: 'create-outline',
    category: 'Guías',
    content_md: `# Cómo crear una guía

## Paso 1 · Abre Guías
Toca la pestaña **Guías** y pulsa el botón **+** flotante.

## Paso 2 · Completa los datos
- **Título**: algo claro y buscable.
- **Categoría**: Backend, Frontend, Infraestructura o General.
- **Visibilidad**:
  - **Privada** — solo tú (y admins).
  - **Compartida** — con miembros que elijas.
  - **Empresa** — visible en el catálogo para todos.

## Paso 3 · Escribe el contenido
Usa **Markdown**: títulos, listas, enlaces y bloques de código. Al guardar, la guía aparece en Inicio y en el catálogo según su visibilidad.

> Tip: empieza con una plantilla simple — objetivo, pasos y responsables.
`,
  },
  {
    id: 'compartir',
    title: 'Compartir: en la app, PDF o enlace',
    icon: 'share-social-outline',
    category: 'Guías',
    content_md: `# Compartir: en la app, PDF o enlace

PatternAI ofrece **tres formas** de compartir una guía:

## 1 · Compartir en la app
Desde la tarjeta o el detalle, pulsa **Compartir** y elige un miembro del equipo. La guía aparecerá en su **Inicio** como «Compartida contigo».

## 2 · Descargar PDF
Pulsa **PDF** para generar el documento en tu dispositivo y enviarlo por email, WhatsApp, etc.

## 3 · Enlace externo
Pulsa **Enlace** para crear un link que puedes abrir con el menú nativo de compartir del móvil.

## Permisos
En **Equipo**, el admin puede activar: ver, descargar, compartir o crear guías para cada miembro.
`,
  },
  {
    id: 'equipo-permisos',
    title: 'Gestionar tu equipo y permisos',
    icon: 'people-outline',
    category: 'Equipo',
    content_md: `# Gestionar tu equipo y permisos

## Invitar por email
En **Equipo**, pulsa **Invitar miembro**, escribe el email y elige rol (Miembro o Administrador). La persona quedará vinculada cuando se registre con ese mismo email.

## Configurar permisos
Toca un miembro para abrir el panel de permisos:

- **Ver guías compartidas** — acceso a lo que le compartas.
- **Descargar PDF** — generar PDF desde las tarjetas.
- **Compartir por enlace** — crear links externos.
- **Crear guías nuevas** — acceso al catálogo y al botón +.

También puedes **desactivar** un miembro sin borrarlo.

## Roles
- **Administradora**: acceso completo al catálogo, equipo e invitaciones.
- **Miembro**: ve lo compartido y lo que sus permisos permitan.
`,
  },
];

export function getAyudaById(id: string): AyudaArticle | undefined {
  return AYUDA_ARTICULOS.find((a) => a.id === id);
}
