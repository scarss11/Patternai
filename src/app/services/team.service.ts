import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile, MemberPermissions, Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TeamService {
  constructor(private sb: SupabaseService) {}

  /** Miembros de mi organización (pestaña Equipo). RLS los limita a mi org. */
  async listMembers(): Promise<Profile[]> {
    const { data, error } = await this.sb.client
      .from('profiles').select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Profile[];
  }

  /** Invitar por email. Al registrarse queda vinculado automáticamente. */
  async invite(email: string, opts?: {
    role?: Role; can_download?: boolean; can_share?: boolean; can_create_guides?: boolean;
  }) {
    const { data, error } = await this.sb.client.rpc('invite_member', {
      p_email: email,
      p_role: opts?.role ?? 'member',
      p_can_download: opts?.can_download ?? true,
      p_can_share: opts?.can_share ?? false,
      p_can_create_guides: opts?.can_create_guides ?? false,
    });
    if (error) throw error;
    return data as string; // invitation id
  }

  /** Guardar los switches de permisos (solo admin; la RLS lo verifica). */
  async setPermissions(memberId: string, perms: Partial<MemberPermissions>): Promise<Profile> {
    const { data, error } = await this.sb.client
      .from('profiles').update(perms).eq('id', memberId).select().single();
    if (error) throw error;
    return data as Profile;
  }

  async setStatus(memberId: string, status: 'active' | 'disabled'): Promise<void> {
    const { error } = await this.sb.client
      .from('profiles').update({ status }).eq('id', memberId);
    if (error) throw error;
  }
}
