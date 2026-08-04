import { Injectable } from '@angular/core';
import {
  createClient, SupabaseClient, Session, User,
} from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profile } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  /** Sesión actual (null si no hay login). */
  readonly session$ = new BehaviorSubject<Session | null>(null);
  /** Perfil del usuario actual, con rol y permisos. */
  readonly profile$ = new BehaviorSubject<Profile | null>(null);

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      { auth: { persistSession: true, autoRefreshToken: true } },
    );

    this.client.auth.getSession().then(({ data }) => this.setSession(data.session));
    this.client.auth.onAuthStateChange((_e, session) => this.setSession(session));
  }

  private async setSession(session: Session | null) {
    this.session$.next(session);
    if (session?.user) {
      await this.loadProfile();
    } else {
      this.profile$.next(null);
    }
  }

  get user(): User | null {
    return this.session$.value?.user ?? null;
  }

  get isAdmin(): boolean {
    return this.profile$.value?.role === 'admin';
  }

  async loadProfile(): Promise<Profile | null> {
    const uid = this.user?.id;
    if (!uid) return null;
    const { data, error } = await this.client
      .from('profiles').select('*').eq('id', uid).single();
    if (error) { console.error('loadProfile', error); return null; }
    this.profile$.next(data as Profile);
    return data as Profile;
  }

  // --- Auth ---------------------------------------------------------------
  signUp(email: string, password: string, fullName: string) {
    return this.client.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
  }

  signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.client.auth.signOut();
  }

  /** El primer usuario crea su empresa y queda como admin. */
  createOrganization(name: string) {
    return this.client.rpc('create_organization', { org_name: name });
  }
}
