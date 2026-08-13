import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { AppLanguage } from '../utils/preferences.util';

export interface GenerateGuideInput {
  title: string;
  category: string;
  language: AppLanguage;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private sb = inject(SupabaseService);

  async generateGuideContent(input: GenerateGuideInput): Promise<string> {
    const session = (await this.sb.client.auth.getSession()).data.session;
    if (!session?.access_token) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const url = environment.generateGuideUrl;
    if (!url) {
      throw new Error('NOT_CONFIGURED');
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: environment.supabaseAnonKey,
      },
      body: JSON.stringify(input),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = typeof body?.error === 'string' ? body.error : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    if (typeof body?.content_md !== 'string' || !body.content_md.trim()) {
      throw new Error('EMPTY_RESPONSE');
    }

    return body.content_md.trim();
  }
}
