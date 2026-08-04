import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { marked } from 'marked';
import { getAyudaById } from '../../data/ayuda';

@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    RouterLink,
  ],
})
export class AyudaPage implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  title = signal('');
  category = signal('');
  htmlContent = signal<SafeHtml>('');
  notFound = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const article = getAyudaById(id);
    if (!article) {
      this.notFound.set(true);
      return;
    }
    this.title.set(article.title);
    this.category.set(article.category);
    const html = await marked.parse(article.content_md);
    this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
  }
}
