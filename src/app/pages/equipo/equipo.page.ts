import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { TeamService } from '../../services/team.service';
import { MemberPermissions, Profile, Role } from '../../models/models';
import { handleContentScroll } from '../../utils/preferences.util';
import { feedbackError, feedbackSuccess, feedbackTap, toastText } from '../../utils/ui-feedback.util';

const AVATAR_COLORS = ['#0a84ff', '#7c6cf0', '#2fb380', '#ff9f0a'];

@Component({
  selector: 'app-equipo',
  templateUrl: './equipo.page.html',
  styleUrls: ['./equipo.page.scss'],
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
    IonIcon,
    IonButton,
    IonModal,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
  ],
})
export class EquipoPage implements OnInit {
  private sb = inject(SupabaseService);
  private team = inject(TeamService);
  private route = inject(ActivatedRoute);

  members = signal<Profile[]>([]);
  selectedMember = signal<Profile | null>(null);
  loading = signal(true);
  headerCompact = signal(false);
  saving = signal(false);
  inviteOpen = signal(false);
  permOpen = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');
  toastColor = signal<'danger' | 'success'>('danger');

  inviteEmail = '';
  inviteRole: Role = 'member';
  inviteCanDownload = true;
  inviteCanShare = false;
  inviteCanCreate = false;

  get isAdmin(): boolean {
    return this.sb.isAdmin;
  }

  get currentUserId(): string | undefined {
    return this.sb.user?.id;
  }

  async ngOnInit() {
    await this.loadMembers();
    if (this.route.snapshot.queryParamMap.get('invite') === '1' && this.isAdmin) {
      this.openInvite();
    }
  }

  async onRefresh(event: RefresherCustomEvent) {
    await this.loadMembers();
    event.target.complete();
  }

  onScroll(ev: Event) {
    handleContentScroll(ev, this.headerCompact);
  }

  async loadMembers() {
    this.loading.set(true);
    try {
      const list = await this.team.listMembers();
      this.members.set(list);
      if (this.isAdmin) {
        const selected = this.selectedMember();
        const stillExists = selected && list.some((m) => m.id === selected.id);
        if (!stillExists) {
          const first = list.find(
            (m) => m.id !== this.currentUserId && m.role === 'member',
          ) ?? list.find((m) => m.id !== this.currentUserId) ?? null;
          this.selectedMember.set(first);
        } else if (selected) {
          this.selectedMember.set(list.find((m) => m.id === selected.id) ?? null);
        }
      } else {
        this.selectedMember.set(null);
      }
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  openInvite() {
    void feedbackTap();
    this.resetInviteForm();
    this.inviteOpen.set(true);
  }

  closeInvite() {
    this.inviteOpen.set(false);
  }

  closePerm() {
    this.permOpen.set(false);
  }

  selectMember(member: Profile) {
    if (!this.isAdmin || member.id === this.currentUserId) return;
    void feedbackTap();
    this.selectedMember.set(member);
    this.permOpen.set(true);
  }

  isSelected(member: Profile): boolean {
    return this.selectedMember()?.id === member.id;
  }

  canSelect(member: Profile): boolean {
    return this.isAdmin && member.id !== this.currentUserId;
  }

  avatarColor(member: Profile): string {
    const idx = member.full_name?.charCodeAt(0) ?? 0;
    return AVATAR_COLORS[idx % AVATAR_COLORS.length];
  }

  memberInitials(member: Profile): string {
    const name = member.full_name ?? '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  roleLabel(member: Profile): string {
    return member.role === 'admin' ? 'Administradora' : 'Miembro';
  }

  statusLabel(member: Profile): string | null {
    if (member.status === 'pending') return 'Pendiente';
    if (member.status === 'disabled') return 'Desactivado';
    return null;
  }

  async confirmInvite() {
    const email = this.inviteEmail.trim();
    if (!email) {
      this.showToast('Introduce un email válido.');
      return;
    }

    this.saving.set(true);
    try {
      await this.team.invite(email, {
        role: this.inviteRole,
        can_download: this.inviteCanDownload,
        can_share: this.inviteCanShare,
        can_create_guides: this.inviteCanCreate,
      });
      this.closeInvite();
      this.resetInviteForm();
      await this.loadMembers();
      await feedbackSuccess();
      this.showToast(
        'Invitación enviada. La persona quedará vinculada cuando se registre con ese email.',
        false,
      );
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  async onPermissionChange(field: keyof MemberPermissions, value: boolean) {
    const member = this.selectedMember();
    if (!this.isAdmin || !member) return;

    this.saving.set(true);
    try {
      const updated = await this.team.setPermissions(member.id, { [field]: value });
      this.selectedMember.set(updated);
      this.members.update((list) =>
        list.map((m) => (m.id === updated.id ? updated : m)),
      );
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleMemberStatus() {
    const member = this.selectedMember();
    if (!this.isAdmin || !member) return;

    const next = member.status === 'disabled' ? 'active' : 'disabled';
    const action = next === 'disabled' ? 'desactivar' : 'activar';

    this.saving.set(true);
    try {
      await this.team.setStatus(member.id, next);
      const updated = { ...member, status: next as Profile['status'] };
      this.selectedMember.set(updated);
      this.members.update((list) =>
        list.map((m) => (m.id === updated.id ? updated : m)),
      );
      this.showToast(
        next === 'disabled'
          ? `${member.full_name ?? 'Miembro'} desactivado.`
          : `${member.full_name ?? 'Miembro'} activado de nuevo.`,
        false,
      );
      void feedbackSuccess();
    } catch (err) {
      this.showToast(this.errorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  private resetInviteForm() {
    this.inviteEmail = '';
    this.inviteRole = 'member';
    this.inviteCanDownload = true;
    this.inviteCanShare = false;
    this.inviteCanCreate = false;
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
