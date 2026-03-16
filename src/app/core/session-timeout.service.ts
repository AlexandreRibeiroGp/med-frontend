import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CallSignalingService } from './call-signaling.service';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly callSignaling = inject(CallSignalingService);

  private lastActivityAt = Date.now();
  private readonly activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

  constructor() {
    for (const eventName of this.activityEvents) {
      window.addEventListener(eventName, this.registerActivity, { passive: true });
    }

    window.setInterval(() => {
      this.enforceIdleTimeout();
    }, CHECK_INTERVAL_MS);
  }

  private readonly registerActivity = () => {
    this.lastActivityAt = Date.now();
  };

  private enforceIdleTimeout(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    if (this.isInCall()) {
      this.lastActivityAt = Date.now();
      return;
    }

    if (Date.now() - this.lastActivityAt < IDLE_TIMEOUT_MS) {
      return;
    }

    this.auth.logout();
    void this.router.navigateByUrl('/auth');
  }

  private isInCall(): boolean {
    return this.router.url.startsWith('/calls') || this.callSignaling.currentRoom() !== null;
  }
}
