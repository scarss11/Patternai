import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton, IonContent, IonSpinner, IonToast,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, filter, timeout, take } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { GuidesService } from '../../services/guides.service';
import { seedStarterGuide } from '../../utils/seed-starter-guide.util';
import { feedbackError, feedbackSuccess, toastText } from '../../utils/ui-feedback.util';

type AuthMode = 'login' | 'register' | 'organization';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [FormsModule, IonContent, IonButton, IonSpinner, IonToast],
})
export class AuthPage implements OnInit {
  private sb = inject(SupabaseService);
  private guidesSvc = inject(GuidesService);
  private router = inject(Router);

  mode = signal<AuthMode>('login');
  loading = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal<'danger' | 'success'>('danger');

  email = '';
  password = '';
  fullName = '';
  orgName = '';

  async ngOnInit() {
    if (!this.sb.session$.value) {
      const { data } = await this.sb.client.auth.getSession();
      if (!data.session) return;
    }
    if (await this.goToAppIfReady()) return;

    this.sb.profile$
      .pipe(
        filter((p): p is NonNullable<typeof p> => !!p?.organization_id),
        take(1),
      )
      .subscribe(() => {
        void this.enterApp();
      });
  }

  setMode(next: 'login' | 'register') {
    if (this.mode() === 'organization') return;
    this.mode.set(next);
  }

  async signIn() {
    if (!this.email.trim() || !this.password) {
      this.showToast('Introduce email y contraseña.');
      return;
    }

    this.loading.set(true);
    try {
      const { error } = await this.sb.signIn(this.email.trim(), this.password);
      if (error) {
        this.showToast(this.mapError(error.message));
        return;
      }

      await this.waitForSession();
      if (await this.goToAppIfReady()) return;

      this.mode.set('organization');
      this.showToast('Completa la creación de tu empresa para continuar.', false);
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async signUp() {
    if (!this.fullName.trim() || !this.email.trim() || !this.password) {
      this.showToast('Completa nombre, email y contraseña.');
      return;
    }

    this.loading.set(true);
    try {
      const { error } = await this.sb.signUp(
        this.email.trim(),
        this.password,
        this.fullName.trim(),
      );
      if (error) {
        this.showToast(this.mapError(error.message));
        return;
      }

      await this.waitForSession();
      await this.afterRegister();
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async createOrganization() {
    const name = this.orgName.trim();
    if (!name) {
      this.showToast('Escribe el nombre de tu empresa.');
      return;
    }

    if (await this.goToAppIfReady()) return;

    this.loading.set(true);
    try {
      await this.waitForSession();
      const { error } = await this.sb.createOrganization(name);
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('ya pertenece') || msg.includes('organización')) {
          await this.enterApp();
          return;
        }
        this.showToast(this.mapError(error.message));
        return;
      }
      try {
        await seedStarterGuide(this.guidesSvc);
      } catch (seedErr) {
        console.warn('Guía de ejemplo omitida:', seedErr);
      }
      await this.enterApp();
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async continueToApp() {
    this.loading.set(true);
    try {
      await this.waitForSession();
      await this.enterApp();
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  private async goToAppIfReady(): Promise<boolean> {
    await this.waitForSession();
    const profile = await this.loadProfileWithRetry();
    if (profile?.organization_id) {
      await this.enterApp();
      return true;
    }
    return false;
  }

  private async enterApp() {
    await this.waitForSession();
    const profile = await this.loadProfileWithRetry();
    if (!profile) {
      throw new Error('No se pudo cargar tu perfil. Revisa tu conexión e intenta de nuevo.');
    }
    if (!profile.organization_id) {
      throw new Error('Tu cuenta aún no está vinculada a una organización.');
    }
    const navigated = await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
    if (!navigated) {
      throw new Error('No se pudo abrir la aplicación.');
    }
  }

  private async waitForSession() {
    if (this.sb.session$.value) return;

    try {
      await firstValueFrom(
        this.sb.session$.pipe(
          filter((s): s is NonNullable<typeof s> => s !== null),
          take(1),
          timeout(8000),
        ),
      );
      return;
    } catch {
      // fallback
    }

    const { data, error } = await this.sb.client.auth.getSession();
    if (error || !data.session) {
      throw new Error('No se pudo iniciar sesión. Intenta de nuevo.');
    }
  }

  private async loadProfileWithRetry() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const profile = await this.sb.loadProfile();
      if (profile?.organization_id) return profile;
      if (profile && attempt >= 2) return profile;
      await this.delay(400);
    }
    return this.sb.profile$.value;
  }

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private async afterRegister() {
    await this.loadProfileWithRetry();
    if (await this.goToAppIfReady()) return;
    this.mode.set('organization');
  }

  private showToast(message: string, isError = true) {
    this.toastMessage.set(toastText(message, isError));
    this.toastColor.set(isError ? 'danger' : 'success');
    this.toastOpen.set(true);
    void (isError ? feedbackError() : feedbackSuccess());
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Ocurrió un error inesperado.';
  }

  private mapError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('invalid login') || m.includes('invalid credentials')) {
      return 'Credenciales inválidas. Revisa tu email y contraseña.';
    }
    if (m.includes('already registered') || m.includes('already been registered')) {
      return 'Este email ya está registrado.';
    }
    if (m.includes('password') && m.includes('least')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (m.includes('valid email') || m.includes('invalid email')) {
      return 'Introduce un email válido.';
    }
    if (m.includes('email not confirmed')) {
      return 'Confirma tu email antes de iniciar sesión.';
    }
    return message;
  }
}
