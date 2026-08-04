import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { GuidesService } from '../../services/guides.service';
import { TeamService } from '../../services/team.service';
import { ShareService } from '../../services/share.service';
import { Guide, Profile, Visibility } from '../../models/models';
import { handleContentScroll } from '../../utils/preferences.util';
import { feedbackError, feedbackSuccess, feedbackTap, toastText } from '../../utils/ui-feedback.util';

export interface GuideCardItem {
  guide: Guide;
  shareCount?: number;
}

const CATEGORIES = ['Backend', 'Frontend', 'Infraestructura', 'General'] as const;

@Component({
  selector: 'app-guias',
  templateUrl: './guias.page.html',
  styleUrls: ['./guias.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonToast,
    IonModal,
    IonIcon,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
  ],
})
export class GuiasPage implements OnInit {
  private sb = inject(SupabaseService);
  private guidesSvc = inject(GuidesService);
  private teamSvc = inject(TeamService);
  private shareSvc = inject(ShareService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly categories = CATEGORIES;

  items = signal<GuideCardItem[]>([]);
  search = signal('');
  loading = signal(true);
  headerCompact = signal(false);
  actionLoading = signal(false);
  createOpen = signal(false);
  shareSheetOpen = signal(false);
  shareMembers = signal<Profile[]>([]);
  shareTargetGuide = signal<Guide | null>(null);
  saving = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal<'danger' | 'success'>('danger');

  formTitle = '';
  formCategory = 'General';
  formVisibility: Visibility = 'private';
  formContent = '';

  get isAdmin(): boolean {
    return this.sb.isAdmin;
  }

  get canCreate(): boolean {
    return this.isAdmin || (this.sb.profile$.value?.can_create_guides ?? false);
  }

  get totalCount(): number {
    return this.items().length;
  }

  async ngOnInit() {
    await this.load();
    if (this.route.snapshot.queryParamMap.get('create') === '1' && this.canCreate) {
      this.openCreate();
    }
  }

  filteredItems(): GuideCardItem[] {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      ({ guide }) =>
        guide.title.toLowerCase().includes(q) ||
        guide.category.toLowerCase().includes(q),
    );
  }

  async onRefresh(event: RefresherCustomEvent) {
    await this.load();
    event.target.complete();
  }

  onScroll(ev: Event) {
    handleContentScroll(ev, this.headerCompact);
  }

  async load() {
    this.loading.set(true);
    try {
      const guides = await this.guidesSvc.list();
      const cards = await Promise.all(
        guides.map(async (guide) => ({
          guide,
          shareCount:
            guide.visibility === 'shared'
              ? await this.guidesSvc.shareCount(guide.id)
              : undefined,
        })),
      );
      this.items.set(cards);
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  openCreate() {
    void feedbackTap();
    this.resetForm();
    this.createOpen.set(true);
  }

  closeCreate() {
    this.createOpen.set(false);
  }

  async saveGuide() {
    const title = this.formTitle.trim();
    const content_md = this.formContent.trim();
    if (!title || !content_md) {
      this.showToast('Completa el título y el contenido.');
      return;
    }

    this.saving.set(true);
    try {
      await this.guidesSvc.create({
        title,
        category: this.formCategory.toLowerCase(),
        content_md,
        visibility: this.formVisibility,
      });
      this.closeCreate();
      this.resetForm();
      await this.load();
      await feedbackSuccess();
      this.showToast('Guía creada correctamente.', false);
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  openDetail(guide: Guide) {
    this.router.navigate(['/guia-detalle', guide.id]);
  }

  visibilityBadge(item: GuideCardItem): { label: string; css: Visibility } {
    const { guide, shareCount } = item;
    if (guide.visibility === 'shared') {
      const n = shareCount ?? 0;
      return {
        label: n === 1 ? '1 persona' : `${n} personas`,
        css: 'shared',
      };
    }
    if (guide.visibility === 'company') {
      return { label: 'Empresa', css: 'company' };
    }
    return { label: 'Privada', css: 'private' };
  }

  subtitle(guide: Guide): string {
    const category = this.formatCategory(guide.category);
    return `${category} · ${this.timeAgo(guide.updated_at)}`;
  }

  async onPdf(guide: Guide, event: Event) {
    event.stopPropagation();
    await feedbackTap();
    await this.runAction(async () => {
      await this.shareSvc.downloadAndSharePdf(guide);
      await feedbackSuccess();
    });
  }

  async onShareMember(guide: Guide, event: Event) {
    event.stopPropagation();

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
    this.shareTargetGuide.set(guide);
    this.shareMembers.set(members);
    this.shareSheetOpen.set(true);
  }

  closeShareSheet() {
    this.shareSheetOpen.set(false);
    this.shareTargetGuide.set(null);
  }

  async pickShareMember(member: Profile) {
    const guide = this.shareTargetGuide();
    if (!guide) return;
    this.closeShareSheet();
    await this.runAction(async () => {
      await this.shareSvc.shareWithMember(guide.id, member.id);
      await feedbackSuccess();
      this.showToast(`Guía compartida con ${member.full_name ?? 'el miembro'}.`, false);
      await this.load();
    });
  }

  async onShareLink(guide: Guide, event: Event) {
    event.stopPropagation();
    await feedbackTap();
    await this.runAction(async () => {
      const url = await this.shareSvc.createShareLink(guide.id);
      await this.shareSvc.nativeShareLink(url, guide.title);
      await feedbackSuccess();
    });
  }

  private resetForm() {
    this.formTitle = '';
    this.formCategory = 'General';
    this.formVisibility = 'private';
    this.formContent = '';
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
    return category.charAt(0).toUpperCase() + category.slice(1);
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
