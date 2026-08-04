export type AppLanguage = 'es' | 'en';

export interface NotificationPrefs {
  guideShared: boolean;
  teamUpdates: boolean;
  productNews: boolean;
}

const LANG_KEY = 'pa_language';
const NOTIF_KEY = 'pa_notification_prefs';

const DEFAULT_NOTIF: NotificationPrefs = {
  guideShared: true,
  teamUpdates: true,
  productNews: false,
};

export function getLanguage(): AppLanguage {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === 'en' ? 'en' : 'es';
}

export function setLanguage(lang: AppLanguage): void {
  localStorage.setItem(LANG_KEY, lang);
}

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) return { ...DEFAULT_NOTIF };
    return { ...DEFAULT_NOTIF, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIF };
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
}

export function handleContentScroll(
  ev: Event,
  compact: { set: (value: boolean) => void },
  threshold = 32,
): void {
  const detail = (ev as CustomEvent<{ scrollTop: number }>).detail;
  compact.set(detail.scrollTop > threshold);
}
