import { GuidesService } from '../services/guides.service';

const STARTER_GUIDE_MD = `# Mi primera guía

Esta es una **guía real** en PatternAI. Ábrela, edítala y compártela con tu equipo — sirve para ventas, operaciones, soporte o cualquier área.

## Crear una guía

1. Ve a **Guías** y pulsa **Crear guía**.
2. Escribe el **título** (ej. "Proceso de cierre de ventas" o "Onboarding de empleados").
3. Pulsa **Generar con IA** para crear el borrador automáticamente, o escribe el contenido tú mismo.
4. Elige categoría y visibilidad, y guarda.

## Editar esta guía

1. Toca la tarjeta para abrir el detalle.
2. Pulsa **Editar**.
3. Modifica el texto y guarda los cambios.

## Compartir

- **PDF** — descarga desde el detalle.
- **Compartir** — envía a un miembro del equipo.
- **Enlace** — genera un link externo.

## Siguiente paso

Invita a tu equipo desde **Equipo** y crea más guías para tu organización.
`;

/** Guía de ejemplo real — solo llamar una vez tras createOrganization. */
export async function seedStarterGuide(guides: GuidesService): Promise<void> {
  await guides.create({
    title: 'Mi primera guía',
    category: 'general',
    content_md: STARTER_GUIDE_MD,
    visibility: 'company',
  });
}
