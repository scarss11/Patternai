import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { SupabaseService } from '../../services/supabase.service';
import { GuidesService } from '../../services/guides.service';
import { TeamService } from '../../services/team.service';
import { ShareService } from '../../services/share.service';
import { Guide, Profile, Visibility } from '../../models/models';
import { feedbackError, feedbackSuccess, feedbackTap, toastText } from '../../utils/ui-feedback.util';

const CATEGORIES = ['Backend', 'Frontend', 'Infraestructura', 'General'] as const;

@Component({
  selector: 'app-guia-detalle',
  templateUrl: './guia-detalle.page.html',
  styleUrls: ['./guia-detalle.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonToast,
    IonButton,
    IonSpinner,
    IonModal,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    RouterLink,
  ],
})
export class GuiaDetallePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sb = inject(SupabaseService);
  private guidesSvc = inject(GuidesService);
  private teamSvc = inject(TeamService);
  private shareSvc = inject(ShareService);
  private sanitizer = inject(DomSanitizer);
  private alertCtrl = inject(AlertController);

  readonly categories = CATEGORIES;

  guide = signal<Guide | null>(null);
  shareCount = signal(0);
  htmlContent = signal<SafeHtml>('');
  loading = signal(true);
  loadError = signal('');
  actionLoading = signal(false);
  editOpen = signal(false);
  shareSheetOpen = signal(false);
  shareMembers = signal<Profile[]>([]);
  saving = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal<'danger' | 'success'>('danger');

  formTitle = '';
  formCategory = 'General';
  formVisibility: Visibility = 'private';
  formContent = '';

  private guideId = '';

  get isAdmin(): boolean {
    return this.sb.isAdmin;
  }

  get profile(): Profile | null {
    return this.sb.profile$.value;
  }

  get canDownload(): boolean {
    return this.isAdmin || (this.profile?.can_download ?? false);
  }

  get canShare(): boolean {
    const g = this.guide();
    if (!g) return false;
    return (
      this.isAdmin ||
      g.created_by === this.sb.user?.id ||
      (this.profile?.can_share ?? false)
    );
  }

  get canEdit(): boolean {
    const g = this.guide();
    if (!g) return false;
    return this.isAdmin || g.created_by === this.sb.user?.id;
  }

  async ngOnInit() {
    this.guideId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.guideId) {
      this.loadError.set('No se encontró la guía solicitada.');
      this.loading.set(false);
      return;
    }
    await this.loadGuide();
  }

  async loadGuide() {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const guide = await this.guidesSvc.get(this.guideId);
      this.guide.set(guide);
      const html = await marked.parse(guide.content_md);
      this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
      if (guide.visibility === 'shared') {
        this.shareCount.set(await this.guidesSvc.shareCount(guide.id));
      }
    } catch (err) {
      this.loadError.set(this.errorMessage(err));
      this.guide.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  visibilityBadge(): { label: string; css: Visibility } {
    const g = this.guide();
    if (!g) return { label: '', css: 'private' };
    if (g.visibility === 'shared') {
      const n = this.shareCount();
      return {
        label: n === 1 ? '1 persona' : `${n} personas`,
        css: 'shared',
      };
    }
    if (g.visibility === 'company') {
      return { label: 'Empresa', css: 'company' };
    }
    return { label: 'Privada', css: 'private' };
  }

  metaLine(): string {
    const g = this.guide();
    if (!g) return '';
    return `${this.formatCategory(g.category)} · ${this.timeAgo(g.updated_at)}`;
  }

  openEdit() {
    void feedbackTap();
    const g = this.guide();
    if (!g) return;
    this.formTitle = g.title;
    this.formCategory = this.formatCategory(g.category);
    this.formVisibility = g.visibility;
    this.formContent = g.content_md;
    this.editOpen.set(true);
  }

  closeEdit() {
    this.editOpen.set(false);
  }

  async saveEdit() {
    const g = this.guide();
    if (!g) return;
    const title = this.formTitle.trim();
    const content_md = this.formContent.trim();
    if (!title || !content_md) {
      this.showToast('Completa el título y el contenido.');
      return;
    }

    this.saving.set(true);
    try {
      const updated = await this.guidesSvc.update(g.id, {
        title,
        category: this.formCategory.toLowerCase(),
        content_md,
        visibility: this.formVisibility,
      });
      this.guide.set(updated);
      const html = await marked.parse(updated.content_md);
      this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
      if (updated.visibility === 'shared') {
        this.shareCount.set(await this.guidesSvc.shareCount(updated.id));
      }
      this.closeEdit();
      await feedbackSuccess();
      this.showToast('Guía actualizada correctamente.', false);
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete() {
    const g = this.guide();
    if (!g) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar guía',
      message: `¿Seguro que quieres eliminar «${g.title}»? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.deleteGuide();
          },
        },
      ],
    });
    await alert.present();
  }

  async deleteGuide() {
    const g = this.guide();
    if (!g) return;
    this.actionLoading.set(true);
    try {
      await this.guidesSvc.remove(g.id);
      await feedbackSuccess();
      this.showToast('Guía eliminada.', false);
      await this.router.navigate(['/tabs/inicio']);
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.actionLoading.set(false);
    }
  }

  async onPdf() {
    const g = this.guide();
    if (!g || !this.canDownload) return;
    await feedbackTap();
    await this.runAction(async () => {
      await this.shareSvc.downloadAndSharePdf(g);
      await feedbackSuccess();
    });
  }

  async onShareMember() {
    const g = this.guide();
    if (!g || !this.canShare) return;

    let members: Profile[] = [];
    try {
      members = (await this.teamSvc.listMembers()).filter(
        (m) => m.id !== this.sb.user?.id,
      );
    } catch (err) {
      this.showToast(this.errorMessage(err));
      return;
    }

    if (!members.length) {
      this.showToast('No hay miembros disponibles para compartir.');
      return;
    }

    await feedbackTap();
    this.shareMembers.set(members);
    this.shareSheetOpen.set(true);
  }

  closeShareSheet() {
    this.shareSheetOpen.set(false);
  }

  async pickShareMember(member: Profile) {
    const g = this.guide();
    if (!g) return;
    this.closeShareSheet();
    await this.runAction(async () => {
      await this.shareSvc.shareWithMember(g.id, member.id);
      await feedbackSuccess();
      this.showToast(`Guía compartida con ${member.full_name ?? 'el miembro'}.`, false);
      if (g.visibility === 'shared') {
        this.shareCount.set(await this.guidesSvc.shareCount(g.id));
      }
    });
  }

  async onShareLink() {
    const g = this.guide();
    if (!g || !this.canShare) return;
    await feedbackTap();
    await this.runAction(async () => {
      const url = await this.shareSvc.createShareLink(g.id);
      await this.shareSvc.nativeShareLink(url, g.title);
      await feedbackSuccess();
    });
  }

  private async runAction(fn: () => Promise<void>) {
    this.actionLoading.set(true);
    try {
      await fn();
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.actionLoading.set(false);
    }
  }

  private showToast(message: string, isError = true) {
    this.toastMessage.set(toastText(message, isError));
    this.toastColor.set(isError ? 'danger' : 'success');
    this.toastOpen.set(true);
    if (isError) void feedbackError();
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Ocurrió un error inesperado.';
  }

  private formatCategory(category: string): string {
    if (!category) return 'General';
    const lower = category.toLowerCase();
    return CATEGORIES.find((c) => c.toLowerCase() === lower) ?? (
      category.charAt(0).toUpperCase() + category.slice(1)
    );
  }

  private timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / 86_400_000);
    if (days <= 0) return 'actualizada hoy';
    if (days === 1) return 'actualizada hace 1 día';
    if (days < 7) return `actualizada hace ${days} días`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return 'actualizada hace 1 semana';
    if (weeks < 5) return `actualizada hace ${weeks} semanas`;
    const months = Math.floor(days / 30);
    if (months <= 1) return 'actualizada hace 1 mes';
    return `actualizada hace ${months} meses`;
  }
}
