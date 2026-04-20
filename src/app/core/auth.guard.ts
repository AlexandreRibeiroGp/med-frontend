import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.validateSession() ? true : router.createUrlTree(['/auth']);
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.validateSession() ? router.createUrlTree(['/dashboard']) : true;
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] as Role[] | undefined) ?? [];

  if (!authService.validateSession()) {
    return router.createUrlTree(['/auth']);
  }

  if (!allowedRoles.length || allowedRoles.includes(authService.role() as Role)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

export const ownerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.validateSession()) {
    return router.createUrlTree(['/auth']);
  }

  return authService.isOwner() ? true : router.createUrlTree(['/dashboard']);
};
