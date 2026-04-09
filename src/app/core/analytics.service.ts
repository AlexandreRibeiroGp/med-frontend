import { DestroyRef, Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly trackedEvents = new Set<string>();
  private clarityInitialized = false;

  constructor() {
    this.initClarity();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.track('page_view', {
          page_path: event.urlAfterRedirects,
          page_title: document.title
        });
      });
  }

  track(eventName: string, params?: Record<string, unknown>): void {
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
}
