import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

/** Punto de entrada raíz; el guard redirige antes de mostrar contenido. */
@Component({
  selector: 'app-root-redirect',
  template: '<ion-content></ion-content>',
  imports: [IonContent],
})
export class RootRedirectPage {}
