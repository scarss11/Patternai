import { Component, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabase.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonLabel, IonIcon, TranslatePipe],
})
export class TabsPage {
  readonly sb = inject(SupabaseService);

  get isAdmin(): boolean {
    return this.sb.isAdmin;
  }

  get initials(): string {
    const name = this.sb.profile$.value?.full_name ?? 'U';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
