import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Role } from './models';

interface LoginPayload {
  email: string;
  password: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

interface MessageResponse {
  message: string;
}

const API_URL = '/api';
const TOKEN_KEY = 'med_front_token';
const USER_KEY = 'med_front_user';
const EXPIRES_AT_KEY = 'med_front_expires_at';
const LAST_ACTIVITY_KEY = 'med_front_last_activity_at';
const OWNER_EMAIL = 'alexandreribeirogp@gmail.com';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenState = signal<string | null>(this.readToken());
  private readonly userState = signal<AuthResponse['user'] | null>(this.readUser());

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenState());
  readonly role = computed<Role | null>(() => this.userState()?.role ?? null);
  readonly isOwner = computed(() => this.userState()?.email?.toLowerCase() === OWNER_EMAIL);

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, payload).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${API_URL}/auth/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${API_URL}/auth/reset-password`, payload);
  }

  logout(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.clearStoredSession();
  }

  private clearStoredSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(EXPIRES_AT_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }

  validateSession(): boolean {
    if (!this.tokenState()) {
      return false;
    }

    if (this.isStoredSessionExpired()) {
      this.logout();
      return false;
    }

    return true;
  }

  private persistSession(response: AuthResponse): void {
    const expiresAt = Date.now() + Math.max(response.expiresIn, 0) * 1000;
    this.tokenState.set(response.accessToken);
    this.userState.set(response.user);
    sessionStorage.setItem(TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
    sessionStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }

  private readToken(): string | null {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    if (this.isStoredSessionExpired()) {
      this.clearStoredSession();
      return null;
    }
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private readUser(): AuthResponse['user'] | null {
    if (this.isStoredSessionExpired()) {
      return null;
    }
    const raw = sessionStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as AuthResponse['user']) : null;
    } catch {
      this.logout();
      return null;
    }
  }

  private isStoredSessionExpired(): boolean {
    const rawExpiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
    if (!rawExpiresAt) {
      return sessionStorage.getItem(TOKEN_KEY) !== null;
    }

    const expiresAt = Number(rawExpiresAt);
    return !Number.isFinite(expiresAt) || Date.now() >= expiresAt;
  }
}
