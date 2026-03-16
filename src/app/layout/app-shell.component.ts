import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <header class="topbar">
        <a class="brand" routerLink="/">
          <span class="mark"></span>
          <div>
            <strong>MedFront</strong>
            <small>Telemedicina integrada</small>
          </div>
        </a>

        <nav class="nav" *ngIf="auth.isAuthenticated(); else guestActions">
          <a routerLink="/dashboard" routerLinkActive="active">Painel</a>
          <a *ngIf="auth.isOwner()" routerLink="/admin" routerLinkActive="active">Gestao interna</a>
          <button type="button" (click)="logout()">Sair</button>
        </nav>

        <ng-template #guestActions>
          <div class="nav">
            <a routerLink="/auth">Entrar</a>
          </div>
        </ng-template>
      </header>

      <section class="context" *ngIf="auth.isAuthenticated()">
        <div>
          <p class="eyebrow">Sessao ativa</p>
          <strong>{{ auth.user()?.fullName }}</strong>
        </div>
        <span>{{ roleLabel() }}</span>
      </section>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top right, rgba(255, 142, 84, 0.16), transparent 20%),
        radial-gradient(circle at left center, rgba(14, 123, 131, 0.16), transparent 18%),
        #f0ece2;
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
      background: rgba(240, 236, 226, 0.82);
      border-bottom: 1px solid rgba(17, 32, 39, 0.08);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      color: inherit;
      text-decoration: none;
    }

    .mark {
      width: 40px;
      height: 40px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ff8e54, #d94f04);
      box-shadow: 0 12px 24px rgba(217, 79, 4, 0.2);
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

    @media (max-width: 720px) {
      .topbar,
      .context,
      .content {
        padding-left: 16px;
        padding-right: 16px;
      }
    }
  `
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/auth');
  }
}
