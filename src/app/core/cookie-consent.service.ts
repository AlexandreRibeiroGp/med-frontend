import { Injectable, signal } from '@angular/core';

export type CookiePreference = 'accepted' | 'rejected' | 'custom' | null;

const COOKIE_PREFERENCE_KEY = 'medcallon-cookie-preference';

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  readonly preference = signal<CookiePreference>(this.readPreference());
  readonly showBanner = signal(this.preference() === null);

  setPreference(value: Exclude<CookiePreference, null>): void {
    window.localStorage.setItem(COOKIE_PREFERENCE_KEY, value);
    this.preference.set(value);
    this.showBanner.set(false);
  }

  clearPreference(): void {
    window.localStorage.removeItem(COOKIE_PREFERENCE_KEY);
    this.preference.set(null);
    this.showBanner.set(true);
  }

  allowsAnalytics(): boolean {
    return this.preference() === 'accepted';
  }

  private readPreference(): CookiePreference {
    const value = window.localStorage.getItem(COOKIE_PREFERENCE_KEY);
    if (value === 'accepted' || value === 'rejected' || value === 'custom') {
      return value;
    }
    return null;
  }
}
