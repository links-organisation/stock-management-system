import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Restricts a route to Super Admin / Admin, matching the backend's
 * "manage products/inventory/users" permission boundary. Assumes authGuard
 * already confirmed the user is logged in.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdminOrAbove()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
