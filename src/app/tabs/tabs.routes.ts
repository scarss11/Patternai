import { Routes } from '@angular/router';
import { adminGuard } from '../guards/admin.guard';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('../pages/inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'guias',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('../pages/guias/guias.page').then((m) => m.GuiasPage),
      },
      {
        path: 'equipo',
        loadComponent: () =>
          import('../pages/equipo/equipo.page').then((m) => m.EquipoPage),
      },
      {
        path: 'cuenta',
        loadComponent: () =>
          import('../pages/cuenta/cuenta.page').then((m) => m.CuentaPage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
];
