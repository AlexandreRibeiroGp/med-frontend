import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CookieConsentService } from './cookie-consent.service';
import { resolveClarityProjectId } from './runtime-config';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cookieConsent = inject(CookieConsentService);
  private readonly trackedEvents = new Set<string>();
  private clarityInitialized = false;
  private currentPageViewKey: string | null = null;

  constructor() {
    effect(() => {
      if (!this.cookieConsent.allowsAnalytics()) {
        return;
      }

      this.initClarity();
      this.trackCurrentPageView();
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.currentPageViewKey = event.urlAfterRedirects;
        this.trackCurrentPageView();
      });
  }

  track(eventName: string, params?: Record<string, unknown>): void {
    if (!this.cookieConsent.allowsAnalytics()) {
      return;
    }
    window.gtag?.('event', eventName, params ?? {});
  }

  trackOnce(eventKey: string, eventName: string, params?: Record<string, unknown>): void {
    if (this.trackedEvents.has(eventKey)) {
      return;
    }

    this.trackedEvents.add(eventKey);
    this.track(eventName, params);
  }

  private initClarity(): void {
    const projectId = resolveClarityProjectId();
    if (!projectId || this.clarityInitialized) {
      return;
    }

    this.clarityInitialized = true;
    ((c: Window, l: Document, a: string, r: string, i: string, t?: HTMLScriptElement, y?: HTMLScriptElement) => {
      const clarity = c[a as 'clarity'];
      if (!clarity) {
        const queuedClarity = function (...args: unknown[]) {
          queuedClarity.q = queuedClarity.q || [];
          queuedClarity.q.push(args);
        } as ((...args: unknown[]) => void) & { q?: unknown[][] };
        c[a as 'clarity'] = queuedClarity;
      }
      t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = `https://www.clarity.ms/tag/${i}`;
      y = l.getElementsByTagName(r)[0] as HTMLScriptElement;
      y.parentNode?.insertBefore(t, y);
    })(window, document, 'clarity', 'script', projectId);
  }

  private trackCurrentPageView(): void {
    if (!this.cookieConsent.allowsAnalytics()) {
      return;
    }

    const pagePath = this.currentPageViewKey ?? this.router.url;
    this.track('page_view', {
      page_path: pagePath,
      page_title: document.title
    });
  }
}
