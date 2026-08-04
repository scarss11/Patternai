import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { rootRedirectGuard } from './guards/root-redirect.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'guia-detalle/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/guia-detalle/guia-detalle.page').then((m) => m.GuiaDetallePage),
  },
  {
    path: 'cuenta/ayuda',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/cuenta-ayuda/cuenta-ayuda.page').then((m) => m.CuentaAyudaPage),
  },
  {
    path: 'cuenta/terminos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/terminos/terminos.page').then((m) => m.TerminosPage),
  },
  {
    path: 'cuenta/privacidad',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/privacidad/privacidad.page').then((m) => m.PrivacidadPage),
  },
  {
    path: 'ayuda/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ayuda/ayuda.page').then((m) => m.AyudaPage),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootRedirectGuard],
    loadComponent: () =>
      import('./pages/root/root.page').then((m) => m.RootRedirectPage),
  },
];
