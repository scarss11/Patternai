import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

// Protege la pestaña Equipo y la creación de guías.
export const adminGuard: CanActivateFn = () => {
  const sb = inject(SupabaseService);
  const router = inject(Router);
  if (sb.isAdmin) return true;
  router.navigate(['/tabs/inicio']);
  return false;
};
