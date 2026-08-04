import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/** Redirige la raíz según sesión: autenticado → inicio, si no → login. */
export const rootRedirectGuard: CanActivateFn = async () => {
  const sb = inject(SupabaseService);
  const router = inject(Router);

  let hasSession = !!sb.session$.value;
  if (!hasSession) {
    const { data } = await sb.client.auth.getSession();
    hasSession = !!data.session;
  }

  return hasSession
    ? router.createUrlTree(['/tabs/inicio'])
    : router.createUrlTree(['/auth']);
};
