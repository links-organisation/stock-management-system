import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Restricts the Sale route to roles that can actually create a sale (not Compta). */
export const sellGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.canSell()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
