import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../core/auth.service';
import { CookieConsentService } from '../core/cookie-consent.service';
import { FloatingCallService } from '../core/floating-call.service';
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
            <span>Consulta médica online</span>
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
          <p class="eyebrow">Sessão ativa</p>
          <strong>{{ auth.user()?.fullName }}</strong>
        </div>
        <span>{{ roleLabel() }}</span>
      </section>

      <main class="content" [class.auth-content]="isAuthRoute() || isStartRoute()">
        <router-outlet />
      </main>

      <section
        *ngIf="auth.isAuthenticated() && floatingCall.isOpen()"
        class="floating-call"
        [class.minimized]="floatingCall.minimized()"
        [style.right.px]="floatingCallRight()"
        [style.top.px]="floatingCallTop()"
      >
        <header class="floating-call__header" (pointerdown)="startFloatingDrag($event)">
          <strong>Consulta em andamento</strong>
          <div class="floating-call__actions">
            <button type="button" (click)="toggleFloatingCall($event)">
              {{ floatingCall.minimized() ? 'Abrir' : 'Minimizar' }}
            </button>
            <button type="button" class="danger" (click)="closeFloatingCall($event)">Fechar</button>
          </div>
        </header>

        <iframe
          *ngIf="!floatingCall.minimized()"
          class="floating-call__frame"
          [src]="floatingCallUrl()"
          title="Sala de atendimento"
        ></iframe>
      </section>

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
            Usamos cookies para melhorar sua navegação, medir acesso e personalizar a experiência da
            MedCallOn. Leia a
            <a routerLink="/legal/privacidade">Política de Privacidade</a>
            e a
            <a routerLink="/legal/cookies">Política de Cookies</a>.
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

    .floating-call {
      position: fixed;
      width: min(420px, calc(100vw - 20px));
      height: min(760px, calc(100vh - 92px));
      z-index: 130;
      display: grid;
      grid-template-rows: auto 1fr;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(17, 32, 39, 0.12);
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 24px 60px rgba(17, 32, 39, 0.24);
      backdrop-filter: blur(12px);
    }

    .floating-call.minimized {
      width: min(320px, calc(100vw - 20px));
      height: auto;
      grid-template-rows: auto;
    }

    .floating-call__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      background: #112027;
      color: white;
      cursor: move;
      user-select: none;
    }

    .floating-call__header strong {
      font-size: 0.95rem;
    }

    .floating-call__actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .floating-call__actions button {
      border: 0;
      border-radius: 999px;
      padding: 8px 12px;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.12);
      color: white;
    }

    .floating-call__actions .danger {
      background: rgba(255, 233, 227, 0.95);
      color: #a33b19;
    }

    .floating-call__frame {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      background: #f5f2ea;
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

      .floating-call {
        left: 8px;
        right: 8px;
        top: 78px !important;
        width: auto;
        height: calc(100dvh - 88px);
        max-height: calc(100dvh - 88px);
        border-radius: 18px;
      }

      .floating-call.minimized {
        height: auto;
        max-height: none;
      }

      .floating-call__header {
        padding: 10px 12px;
      }

      .floating-call__header strong {
        font-size: 0.88rem;
      }

      .floating-call__actions {
        gap: 6px;
      }

      .floating-call__actions button {
        padding: 8px 10px;
        font-size: 0.78rem;
      }
    }
  `
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cookieConsent = inject(CookieConsentService);
  readonly floatingCall = inject(FloatingCallService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly showCookieBanner = this.cookieConsent.showBanner;
  private draggingFloatingCall = false;
  private dragOffset = { x: 0, y: 0 };
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
      return 'Médico';
    }
    if (role === 'PATIENT') {
      return 'Paciente';
    }
    return 'Visitante';
  });
  readonly floatingCallUrl = computed<SafeResourceUrl | null>(() => {
    const appointmentId = this.floatingCall.appointmentId();
    if (!appointmentId) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(`/calls/${appointmentId}?embed=1`);
  });
  readonly floatingCallRight = computed(() => this.floatingCall.position().x);
  readonly floatingCallTop = computed(() => this.floatingCall.position().y);

  constructor() {
    window.addEventListener('message', this.handleFloatingCallMessage);
    window.addEventListener('pointermove', this.handleFloatingPointerMove);
    window.addEventListener('pointerup', this.stopFloatingDrag);
  }

  startFloatingDrag(event: PointerEvent): void {
    if (window.innerWidth <= 720) {
      return;
    }

    this.draggingFloatingCall = true;
    const { x, y } = this.floatingCall.position();
    this.dragOffset = {
      x: window.innerWidth - x - event.clientX,
      y: event.clientY - y
    };
  }

  toggleFloatingCall(event: Event): void {
    event.stopPropagation();
    this.floatingCall.toggleMinimized();
  }

  closeFloatingCall(event?: Event): void {
    event?.stopPropagation();
    this.floatingCall.close();
  }

  logout(): void {
    this.floatingCall.close();
    this.auth.logout();
    void this.router.navigateByUrl('/auth');
  }

  setCookiePreference(value: 'accepted' | 'rejected' | 'custom'): void {
    this.cookieConsent.setPreference(value);
  }

  private readonly handleFloatingPointerMove = (event: PointerEvent): void => {
    if (!this.draggingFloatingCall || window.innerWidth <= 720) {
      return;
    }

    const desiredRight = window.innerWidth - event.clientX - this.dragOffset.x;
    const desiredTop = event.clientY - this.dragOffset.y;
    this.floatingCall.setPosition(desiredRight, desiredTop);
  };

  private readonly stopFloatingDrag = (): void => {
    this.draggingFloatingCall = false;
  };

  private readonly handleFloatingCallMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data === 'medcallon-close-floating-call') {
      this.floatingCall.close();
    }
  };
}

