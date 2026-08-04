import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AYUDA_ARTICULOS } from '../../data/ayuda';
import { feedbackTap } from '../../utils/ui-feedback.util';

@Component({
  selector: 'app-cuenta-ayuda',
  templateUrl: './cuenta-ayuda.page.html',
  styleUrls: ['./cuenta-ayuda.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
  ],
})
export class CuentaAyudaPage {
  private router = inject(Router);

  readonly ayuda = AYUDA_ARTICULOS;

  openArticle(id: string) {
    void feedbackTap();
    void this.router.navigate(['/ayuda', id]);
  }
}
