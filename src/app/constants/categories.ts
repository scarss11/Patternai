/** Claves de categoría guardadas en BD — válidas para cualquier industria. */
export const CATEGORY_KEYS = ['sales', 'operations', 'support', 'hr', 'general'] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const DEFAULT_CATEGORY: CategoryKey = 'general';

/** Normaliza categorías antiguas (técnicas) a las nuevas universales. */
export function normalizeCategory(raw: string): CategoryKey {
  const key = raw.toLowerCase().trim();
  if ((CATEGORY_KEYS as readonly string[]).includes(key)) return key as CategoryKey;
  if (key === 'backend' || key === 'frontend' || key === 'infraestructura' || key === 'infra') {
    return 'operations';
  }
  if (key === 'ventas') return 'sales';
  if (key === 'operaciones') return 'operations';
  if (key === 'soporte' || key === 'atención al cliente') return 'support';
  if (key === 'recursos humanos' || key === 'rrhh') return 'hr';
  return 'general';
}
