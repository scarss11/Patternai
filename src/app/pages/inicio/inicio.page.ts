import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { GuidesService } from '../../services/guides.service';
import { Guide, Visibility } from '../../models/models';
import { AYUDA_ARTICULOS } from '../../data/ayuda';
import { feedbackError, feedbackTap, toastText } from '../../utils/ui-feedback.util';

export interface GuideCardItem {
  guide: Guide;
  shareCount?: number;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  imports: [
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonToast,
  ],
})
export class InicioPage implements OnInit {
  private sb = inject(SupabaseService);
  private guidesSvc = inject(GuidesService);
  private router = inject(Router);

  readonly ayuda = AYUDA_ARTICULOS;

  items = signal<GuideCardItem[]>([]);
  loading = signal(true);
  toastOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal<'danger' | 'success'>('danger');

  get isAdmin(): boolean {
    return this.sb.isAdmin;
  }

  get sectionTitle(): string {
    return this.isAdmin ? 'Tus guías creadas' : 'Compartidas contigo';
  }

  async ngOnInit() {
    await this.load();
  }

  async onRefresh(event: RefresherCustomEvent) {
    await this.load();
    event.target.complete();
  }

  onScroll(_ev: Event) {
    // reservado para efectos de scroll futuros
  }

  async load() {
    this.loading.set(true);
    try {
      if (this.isAdmin) {
        const guides = await this.guidesSvc.listMine();
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
      } else {
        const guides = await this.guidesSvc.listSharedWithMe();
        this.items.set(guides.map((guide) => ({ guide })));
      }
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  openDetail(guide: Guide) {
    this.router.navigate(['/guia-detalle', guide.id]);
  }

  openAyuda(id: string) {
    void feedbackTap();
    void this.router.navigate(['/ayuda', id]);
  }

  visibilityBadge(item: GuideCardItem): { label: string; css: Visibility | 'shared-count' } {
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
}
