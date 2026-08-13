import { Injectable, signal } from '@angular/core';
import { AppLanguage, getLanguage, setLanguage as persistLanguage } from '../utils/preferences.util';
import { TRANSLATIONS, TranslationKey } from '../i18n/translations';

@Injectable({ providedIn: 'root' })
export class I18nService {
  /** Incrementa en cada cambio de idioma para refrescar pipes. */
  readonly tick = signal(0);
  readonly lang = signal<AppLanguage>(getLanguage());

  constructor() {
    this.applyDocumentLang(this.lang());
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dict = TRANSLATIONS[this.lang()] ?? TRANSLATIONS.es;
    let text = dict[key] ?? TRANSLATIONS.es[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  categoryLabel(key: string): string {
    const normalized = key.toLowerCase();
    const map: Record<string, TranslationKey> = {
      sales: 'category.sales',
      operations: 'category.operations',
      support: 'category.support',
      hr: 'category.hr',
      general: 'category.general',
      backend: 'category.operations',
      frontend: 'category.operations',
      infraestructura: 'category.operations',
    };
    const tKey = map[normalized] ?? 'category.general';
    return this.t(tKey);
  }

  setLanguage(lang: AppLanguage): void {
    persistLanguage(lang);
    this.lang.set(lang);
    this.applyDocumentLang(lang);
    this.tick.update((n) => n + 1);
  }

  private applyDocumentLang(lang: AppLanguage): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}
