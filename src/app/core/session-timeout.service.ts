import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CallSignalingService } from './call-signaling.service';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const LAST_ACTIVITY_KEY = 'med_front_last_activity_at';

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly callSignaling = inject(CallSignalingService);

  private lastActivityAt = this.readLastActivityAt();
  private readonly activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

  constructor() {
    for (const eventName of this.activityEvents) {
      window.addEventListener(eventName, this.registerActivity, { passive: true });
    }
    window.addEventListener('pageshow', this.enforceCurrentSession);
    window.addEventListener('focus', this.enforceCurrentSession);
    document.addEventListener('visibilitychange', this.enforceCurrentSession);

    window.setInterval(() => {
      this.enforceIdleTimeout();
    }, CHECK_INTERVAL_MS);
    this.enforceIdleTimeout();
  }

  private readonly registerActivity = () => {
    this.lastActivityAt = Date.now();
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(this.lastActivityAt));
  };

  private readonly enforceCurrentSession = () => {
    if (document.visibilityState === 'hidden') {
      return;
    }
    this.enforceIdleTimeout();
  };

  private enforceIdleTimeout(): void {
    if (!this.auth.validateSession()) {
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

  private readLastActivityAt(): number {
    const parsed = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
  }

  private isInCall(): boolean {
    return this.router.url.startsWith('/calls') || this.callSignaling.currentRoom() !== null;
  }
}
