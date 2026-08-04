import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { SupabaseService } from './supabase.service';
import { GuideShareLink, Guide } from '../models/models';
import { environment } from '../../environments/environment';

// npm i pdfmake html-to-pdfmake marked
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';
import { marked } from 'marked';

// pdfmake 0.3.x exporta las fuentes directamente, no en pdfFonts.pdfMake.vfs
(pdfMake as any).vfs = pdfFonts;

@Injectable({ providedIn: 'root' })
export class ShareService {
  constructor(private sb: SupabaseService) {}

  // --- 1. Compartir DENTRO de la app (aparece en el Inicio del destinatario) ---
  async shareWithMember(guideId: string, memberId: string, permission: 'view' | 'download' = 'view') {
    const { error } = await this.sb.client.from('guide_shares').upsert(
      { guide_id: guideId, shared_with: memberId, permission, shared_by: this.sb.user?.id },
      { onConflict: 'guide_id,shared_with' },
    );
    if (error) throw error;
  }

  async unshareWithMember(guideId: string, memberId: string) {
    const { error } = await this.sb.client
      .from('guide_shares').delete()
      .eq('guide_id', guideId).eq('shared_with', memberId);
    if (error) throw error;
  }

  // --- 2. Compartir como LINK público (Edge Function /share-guide) -------------
  async createShareLink(guideId: string, expiresInDays?: number): Promise<string> {
    const expires_at = expiresInDays
      ? new Date(Date.now() + expiresInDays * 864e5).toISOString()
      : null;

    const { data, error } = await this.sb.client
      .from('guide_share_links')
      .insert({ guide_id: guideId, created_by: this.sb.user?.id, expires_at })
      .select().single();
    if (error) throw error;

    const link = data as GuideShareLink;
    return `${environment.shareBaseUrl}/${link.token}`;
  }

  async revokeShareLink(linkId: string) {
    const { error } = await this.sb.client
      .from('guide_share_links').update({ revoked: true }).eq('id', linkId);
    if (error) throw error;
  }

  /** Abre el selector nativo de Android (WhatsApp, Gmail, etc.) con el link. */
  async nativeShareLink(url: string, title = 'Guía PatternAI') {
    await Share.share({ title, text: `${title}: ${url}`, url });
  }

  // --- 3. Descargar / compartir PDF (generado en el dispositivo) ---------------
  /**
   * Genera el PDF a partir del markdown de la guía en el propio dispositivo.
   * Al ser on-device, respeta la RLS (el usuario solo puede leer lo permitido)
   * y el PDF nunca queda expuesto en una URL pública.
   */
  async generatePdfBase64(guide: Guide): Promise<string> {
    const html = await marked.parse(guide.content_md);
    const content = htmlToPdfmake(
      `<h1>${guide.title}</h1><p><em>${guide.category}</em></p>${html}`,
    );
    const doc = {
      content,
      defaultStyle: { fontSize: 11, lineHeight: 1.3 },
      pageMargins: [40, 48, 40, 48] as [number, number, number, number],
    };
    return new Promise((resolve) => {
      (pdfMake as any).createPdf(doc).getBase64((b64: string) => resolve(b64));
    });
  }

  /** Guarda el PDF y abre el share nativo con el archivo adjunto. */
  async downloadAndSharePdf(guide: Guide) {
    const base64 = await this.generatePdfBase64(guide);
    const fileName = `${guide.title.replace(/[^\w\s-]/g, '').trim() || 'guia'}.pdf`;

    const saved = await Filesystem.writeFile({
      path: fileName, data: base64, directory: Directory.Cache,
    });
    await Share.share({
      title: guide.title,
      url: saved.uri,           // adjunta el PDF en el selector nativo
      dialogTitle: 'Compartir PDF',
    });
    return saved.uri;
  }
}
