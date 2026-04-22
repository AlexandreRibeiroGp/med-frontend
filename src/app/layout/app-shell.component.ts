import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <header class="topbar" *ngIf="!isAuthRoute()">
        <a class="brand" routerLink="/">
          <img src="/medcallon.png" alt="MedCallOn" class="brand-logo" />
          <div class="brand-copy">
            <strong>MedCallOn</strong>
            <span>Consulta medica online</span>
          </div>
        </a>

        <nav class="nav" *ngIf="auth.isAuthenticated(); else guestActions">
          <a routerLink="/dashboard" routerLinkActive="active">Painel</a>
          <a *ngIf="auth.isOwner()" routerLink="/admin" routerLinkActive="active">Gestao interna</a>
          <button type="button" (click)="logout()">Sair</button>
        </nav>

        <ng-template #guestActions>
          <div class="nav guest-nav">
            <a href="#como-funciona">Como funciona</a>
            <a href="#faq">FAQ</a>
            <a routerLink="/auth">Entrar</a>
            <a routerLink="/comece" class="cta-link">Quero me consultar</a>
          </div>
        </ng-template>
      </header>

      <section class="context" *ngIf="auth.isAuthenticated() && !isAuthRoute()">
        <div>
          <p class="eyebrow">Sessao ativa</p>
          <strong>{{ auth.user()?.fullName }}</strong>
        </div>
        <span>{{ roleLabel() }}</span>
      </section>

      <main class="content" [class.auth-content]="isAuthRoute() || isStartRoute()">
        <router-outlet />
      </main>

      <a
        *ngIf="!auth.isAuthenticated() && !isAuthRoute() && !isStartRoute()"
        routerLink="/comece"
        class="mobile-cta"
      >
        Quero me consultar
      </a>

      <aside class="cookie-banner" *ngIf="showCookieBanner()">
        <div class="cookie-copy">
          <strong>Utilizamos cookies</strong>
          <p>
            Usamos cookies para melhorar sua navegacao, medir acesso e personalizar a experiencia da
            MedCallOn. Leia a
            <a routerLink="/legal/privacidade">Politica de Privacidade</a>
            e a
            <a routerLink="/legal/cookies">Politica de Cookies</a>.
          </p>
        </div>
        <div class="cookie-actions">
          <button type="button" class="ghost-button" (click)="setCookiePreference('custom')">Personalizar</button>
          <button type="button" class="ghost-button" (click)="setCookiePreference('rejected')">Rejeitar</button>
          <button type="button" class="solid-button" (click)="setCookiePreference('accepted')">Aceitar todos</button>
        </div>
      </aside>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: #ffffff;
      color: #112027;
      font-family: 'Segoe UI', sans-serif;
    }

    .shell {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto auto 1fr;
    }

    .topbar,
    .context {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 24px;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(14px);
      background: rgba(255, 255, 255, 0.92);
      border-bottom: 1px solid rgba(17, 32, 39, 0.08);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      color: inherit;
      text-decoration: none;
    }

    .brand-logo {
      height: 54px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .brand-copy {
      display: grid;
      gap: 2px;
    }

    .brand-copy strong {
      font-size: 1.05rem;
      line-height: 1.1;
      color: #112027;
    }

    .brand-copy span {
      font-size: 0.82rem;
      line-height: 1.2;
      color: #5d6d73;
    }

    .brand small,
    .eyebrow {
      color: #5d6d73;
    }

    .eyebrow {
      margin: 0 0 4px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.7rem;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .nav a,
    .nav button,
    .context span {
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      text-decoration: none;
      background: rgba(17, 32, 39, 0.08);
      color: inherit;
    }

    .nav a.active {
      background: #112027;
      color: white;
    }

    .guest-nav .cta-link {
      background: linear-gradient(135deg, #1dbec4, #0f8b91);
      color: white;
    }

    .nav button {
      cursor: pointer;
    }

    .context {
      padding-top: 12px;
      padding-bottom: 0;
    }

    .content {
      padding: 24px;
    }

    .content.auth-content {
      padding: 0;
    }

    .cookie-banner {
      position: fixed;
      left: 24px;
      right: 24px;
      bottom: 24px;
      z-index: 120;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 20px 24px;
      border-radius: 26px;
      background: rgba(255, 253, 249, 0.96);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 24px 60px rgba(17, 32, 39, 0.18);
      backdrop-filter: blur(18px);
    }

    .cookie-copy {
      display: grid;
      gap: 6px;
      max-width: 760px;
    }

    .cookie-copy strong {
      font-size: 1.05rem;
    }

    .cookie-copy p {
      margin: 0;
      color: #5d6d73;
      line-height: 1.5;
    }

    .cookie-copy a {
      color: #0f8b91;
      font-weight: 700;
      text-decoration: none;
    }

    .cookie-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .ghost-button,
    .solid-button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    .ghost-button {
      background: rgba(17, 32, 39, 0.06);
      color: #112027;
    }

    .solid-button {
      background: linear-gradient(135deg, #1dbec4, #0f8b91);
      color: white;
    }

    .mobile-cta {
      display: none;
    }

    @media (max-width: 720px) {
      .topbar,
      .context,
      .content {
        padding-left: 16px;
        padding-right: 16px;
      }

      .topbar {
        gap: 8px;
        padding-top: 12px;
        padding-bottom: 12px;
      }

      .brand-logo {
        height: 38px;
      }

      .brand-copy strong {
        font-size: 0.92rem;
      }

      .brand-copy span {
        display: none;
      }

      .guest-nav {
        gap: 6px;
      }

      .guest-nav a[href^="#"] {
        display: none;
      }

      .guest-nav a:not(.cta-link):not([routerLink="/auth"]) {
        display: none;
      }

      .guest-nav a,
      .guest-nav .cta-link {
        padding: 8px 11px;
        font-size: 0.88rem;
      }

      .cookie-banner {
        left: 16px;
        right: 16px;
        bottom: 16px;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 18px;
      }

      .cookie-copy {
        gap: 4px;
      }

      .cookie-copy strong {
        font-size: 0.95rem;
      }

      .cookie-copy p {
        display: none;
      }

      .cookie-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .ghost-button,
      .solid-button {
        padding: 9px 10px;
        font-size: 0.82rem;
      }

      .mobile-cta {
        display: inline-flex;
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 16px;
        z-index: 115;
        align-items: center;
        justify-content: center;
        min-height: 50px;
        border-radius: 999px;
        background: linear-gradient(135deg, #1dbec4, #0f8b91);
        color: #fff;
        text-decoration: none;
        font-weight: 700;
        box-shadow: 0 16px 32px rgba(15, 139, 145, 0.28);
      }

      .cookie-banner {
        bottom: 80px;
      }
    }
  `
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly showCookieBanner = signal(false);
  readonly isAuthRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/auth')),
      startWith(this.router.url.startsWith('/auth'))
    ),
    { initialValue: this.router.url.startsWith('/auth') }
  );
  readonly isStartRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/comece')),
      startWith(this.router.url.startsWith('/comece'))
    ),
    { initialValue: this.router.url.startsWith('/comece') }
  );

  readonly roleLabel = computed(() => {
    const role = this.auth.role();
    if (role === 'ADMIN') {
      return 'Administrador';
    }
    if (role === 'DOCTOR') {
      return 'Medico';
    }
    if (role === 'PATIENT') {
      return 'Paciente';
    }
    return 'Visitante';
  });

  constructor() {
    const cookiePreference = window.localStorage.getItem('medcallon-cookie-preference');
    this.showCookieBanner.set(!cookiePreference);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth');
  }

  setCookiePreference(value: 'accepted' | 'rejected' | 'custom'): void {
    window.localStorage.setItem('medcallon-cookie-preference', value);
    this.showCookieBanner.set(false);
  }
}

