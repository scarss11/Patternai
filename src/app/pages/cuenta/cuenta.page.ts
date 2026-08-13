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
} from '../../utils/preferences.util';
import { feedbackTap, toastText } from '../../utils/ui-feedback.util';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
    TranslatePipe,
  ],
})
export class CuentaPage implements OnInit {
  private sb = inject(SupabaseService);
  private router = inject(Router);
  private i18n = inject(I18nService);

  headerCompact = signal(false);
  orgName = signal('—');
  langOpen = signal(false);
  notifOpen = signal(false);
  loggingOut = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');

  language: AppLanguage = 'es';
  notifPrefs: NotificationPrefs = getNotificationPrefs();

  get settingsRows(): SettingsRow[] {
    this.i18n.tick();
    return [
      { icon: 'help-circle-outline', title: this.i18n.t('account.help'), action: () => this.openAyudaList() },
      { icon: 'language-outline', title: this.i18n.t('account.language'), action: () => this.openLanguage() },
      { icon: 'notifications-outline', title: this.i18n.t('account.notifications'), action: () => this.openNotifications() },
      { icon: 'document-text-outline', title: this.i18n.t('account.terms'), action: () => this.openTerminos() },
      { icon: 'shield-checkmark-outline', title: this.i18n.t('account.privacy'), action: () => this.openPrivacidad() },
    ];
  }

  get profileName(): string {
    return this.sb.profile$.value?.full_name ?? this.i18n.t('common.user');
  }

  get roleLabel(): string {
    return this.sb.isAdmin ? this.i18n.t('account.roleAdmin') : this.i18n.t('account.roleMember');
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
    this.language = this.i18n.lang();
    this.notifPrefs = getNotificationPrefs();
    await this.loadOrgName();
  }

  onScroll(ev: Event) {
    handleContentScroll(ev, this.headerCompact);
  }

  async loadOrgName() {
    const orgId = this.sb.profile$.value?.organization_id;
    if (!orgId) {
      this.orgName.set(this.i18n.t('account.noOrg'));
      return;
    }
    const { data } = await this.sb.client
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();
    this.orgName.set(data?.name ?? this.i18n.t('account.myCompany'));
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
    this.i18n.setLanguage(this.language);
    this.closeLanguage();
    this.toastMessage.set(this.i18n.t('account.langSaved'));
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
    this.toastMessage.set(this.i18n.t('account.notifSaved'));
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
    return this.i18n.t('common.logoutError');
  }
}
