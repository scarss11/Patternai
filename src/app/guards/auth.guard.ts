import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const sb = inject(SupabaseService);
  const router = inject(Router);

  if (sb.session$.value) return true;

  const { data } = await sb.client.auth.getSession();
  if (data.session) return true;

  return router.createUrlTree(['/auth']);
};
