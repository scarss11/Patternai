import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import {
  AppLanguage,
  getLanguage,
  getNotificationPrefs,
  handleContentScroll,
  NotificationPrefs,
  saveNotificationPrefs,
  setLanguage,
} from '../../utils/preferences.util';
import { feedbackTap, toastText } from '../../utils/ui-feedback.util';

interface SettingsRow {
  icon: string;
  title: string;
  action: () => void;
}

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonModal,
    IonItem,
    IonRadioGroup,
    IonRadio,
    IonToggle,
    IonToast,
  ],
})
export class CuentaPage implements OnInit {
  private sb = inject(SupabaseService);
  private router = inject(Router);

  headerCompact = signal(false);
  orgName = signal('—');
  langOpen = signal(false);
  notifOpen = signal(false);
  loggingOut = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');

  language: AppLanguage = 'es';
  notifPrefs: NotificationPrefs = getNotificationPrefs();

  readonly settingsRows: SettingsRow[] = [
    {
      icon: 'help-circle-outline',
      title: 'Ayuda',
      action: () => this.openAyudaList(),
    },
    {
      icon: 'language-outline',
      title: 'Idioma',
      action: () => this.openLanguage(),
    },
    {
      icon: 'notifications-outline',
      title: 'Notificaciones',
      action: () => this.openNotifications(),
    },
    {
      icon: 'document-text-outline',
      title: 'Términos y condiciones',
      action: () => this.openTerminos(),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Política de privacidad',
      action: () => this.openPrivacidad(),
    },
  ];

  get profileName(): string {
    return this.sb.profile$.value?.full_name ?? 'Usuario';
  }

  get roleLabel(): string {
    return this.sb.isAdmin ? 'Administradora' : 'Miembro del equipo';
  }

  get initials(): string {
    return this.profileName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get languageLabel(): string {
    return this.language === 'en' ? 'English' : 'Español';
  }

  async ngOnInit() {
    this.language = getLanguage();
    this.notifPrefs = getNotificationPrefs();
    await this.loadOrgName();
  }

  onScroll(ev: Event) {
    handleContentScroll(ev, this.headerCompact);
  }

  async loadOrgName() {
    const orgId = this.sb.profile$.value?.organization_id;
    if (!orgId) {
      this.orgName.set('Sin empresa');
      return;
    }
    const { data } = await this.sb.client
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();
    this.orgName.set(data?.name ?? 'Mi empresa');
  }

  openRow(row: SettingsRow) {
    void feedbackTap();
    row.action();
  }

  openAyudaList() {
    void this.router.navigate(['/cuenta/ayuda']);
  }

  openLanguage() {
    this.langOpen.set(true);
  }

  closeLanguage() {
    this.langOpen.set(false);
  }

  saveLanguage() {
    setLanguage(this.language);
    this.closeLanguage();
    this.toastMessage.set('Idioma guardado.');
    this.toastOpen.set(true);
  }

  openNotifications() {
    this.notifOpen.set(true);
  }

  closeNotifications() {
    this.notifOpen.set(false);
  }

  saveNotifications() {
    saveNotificationPrefs(this.notifPrefs);
    this.closeNotifications();
    this.toastMessage.set('Preferencias de notificación guardadas.');
    this.toastOpen.set(true);
  }

  openTerminos() {
    void this.router.navigate(['/cuenta/terminos']);
  }

  openPrivacidad() {
    void this.router.navigate(['/cuenta/privacidad']);
  }

  /**
   * La sesión persiste en el dispositivo a propósito (persistSession: true en Supabase).
   * Cerrar sesión borra el token local para poder volver a ver el login.
   */
  async logout() {
    this.loggingOut.set(true);
    try {
      await feedbackTap();
      await this.sb.signOut();
      await this.router.navigateByUrl('/auth', { replaceUrl: true });
    } catch (err) {
      this.toastMessage.set(toastText(this.errorMessage(err), true));
      this.toastOpen.set(true);
    } finally {
      this.loggingOut.set(false);
    }
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'No se pudo cerrar sesión.';
  }
}
