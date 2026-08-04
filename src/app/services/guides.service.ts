import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Guide, Visibility } from '../models/models';

@Injectable({ providedIn: 'root' })
export class GuidesService {
  constructor(private sb: SupabaseService) {}

  /**
   * Guías visibles para el usuario actual.
   * La RLS ya filtra: el admin recibe todo el catálogo de su organización;
   * un miembro recibe solo las suyas y las que le compartieron.
   */
  async list(): Promise<Guide[]> {
    const { data, error } = await this.sb.client
      .from('guides').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return data as Guide[];
  }

  /** Solo las que me compartieron (para la sección "Compartidas contigo" en Inicio). */
  async listSharedWithMe(): Promise<Guide[]> {
    const uid = this.sb.user?.id;
    const { data, error } = await this.sb.client
      .from('guide_shares')
      .select('guides(*)')
      .eq('shared_with', uid);
    if (error) throw error;
    return (data ?? []).map((r: any) => r.guides) as Guide[];
  }

  /** Las que YO creé (sección "Tus guías creadas" en Inicio del admin). */
  async listMine(): Promise<Guide[]> {
    const uid = this.sb.user?.id;
    const { data, error } = await this.sb.client
      .from('guides').select('*')
      .eq('created_by', uid)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as Guide[];
  }

  async get(id: string): Promise<Guide> {
    const { data, error } = await this.sb.client
      .from('guides').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Guide;
  }

  async create(input: {
    title: string; category?: string; content_md: string; visibility?: Visibility;
  }): Promise<Guide> {
    const profile = this.sb.profile$.value;
    const { data, error } = await this.sb.client
      .from('guides')
      .insert({
        title: input.title,
        category: input.category ?? 'general',
        content_md: input.content_md,
        visibility: input.visibility ?? 'private',
        organization_id: profile?.organization_id,
        created_by: this.sb.user?.id,
      })
      .select().single();
    if (error) throw error;
    return data as Guide;
  }

  async update(id: string, patch: Partial<Guide>): Promise<Guide> {
    const { data, error } = await this.sb.client
      .from('guides').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data as Guide;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from('guides').delete().eq('id', id);
    if (error) throw error;
  }

  /** Nº de personas con las que está compartida (para el badge "3 personas"). */
  async shareCount(guideId: string): Promise<number> {
    const { count, error } = await this.sb.client
      .from('guide_shares')
      .select('id', { count: 'exact', head: true })
      .eq('guide_id', guideId);
    if (error) throw error;
    return count ?? 0;
  }
}
