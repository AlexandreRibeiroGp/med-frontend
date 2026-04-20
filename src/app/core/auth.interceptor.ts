import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isPublicAuthRequest = req.url.includes('/api/auth/login')
    || req.url.includes('/api/auth/forgot-password')
    || req.url.includes('/api/auth/reset-password')
    || req.url.includes('/api/auth/register/');

  const hasStoredSession = !!authService.token();
  if (req.url.includes('/api/') && !isPublicAuthRequest && hasStoredSession && !authService.validateSession()) {
    void router.navigateByUrl('/auth');
  }
  const token = authService.token();

  if (!token || isPublicAuthRequest) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  ).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        void router.navigateByUrl('/auth');
      }
      return throwError(() => error);
    })
  );
};
