import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { AppointmentResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';
import { CallRoomPanelComponent } from '../features/calls/call-room-panel.component';

@Component({
  selector: 'app-call-room-page',
  imports: [CommonModule, RouterLink, CallRoomPanelComponent],
  template: `
    <div class="room-page" [class.compact]="compactMode()">
      <header class="topbar" [class.compact]="compactMode()">
        <div class="topbar-brand">
          <img src="/medcallon.png" alt="MedCallOn" class="brand-logo" />
          <a routerLink="/dashboard" class="back-link">Voltar para o painel</a>
        </div>
        <div class="title-block">
          <p class="eyebrow">Sala de atendimento</p>
          <h1>Consulta agendada</h1>
        </div>
      </header>

      <p *ngIf="error()" class="error">{{ error() }}</p>

      <app-call-room-panel [appointment]="appointment()" [compactMode]="compactMode()" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(255, 142, 84, 0.16), transparent 24%),
        radial-gradient(circle at top right, rgba(14, 123, 131, 0.18), transparent 22%),
        linear-gradient(180deg, #f5f2ea 0%, #ebe6db 100%);
      color: #112027;
      font-family: 'Segoe UI', sans-serif;
    }
    .room-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 28px 24px 40px;
      display: grid;
      gap: 18px;
    }
    .room-page.compact {
      max-width: 980px;
      padding: 16px 14px 24px;
      gap: 12px;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: end;
      flex-wrap: wrap;
    }
    .topbar.compact {
      gap: 10px;
      align-items: center;
    }
    .topbar-brand {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand-logo {
      height: 64px;
      width: auto;
      display: block;
      object-fit: contain;
    }
    .compact .brand-logo {
      height: 44px;
    }
    .back-link {
      text-decoration: none;
      color: #112027;
      background: rgba(255, 255, 255, 0.76);
      border: 1px solid rgba(17, 32, 39, 0.08);
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 700;
    }
    .compact .back-link {
      padding: 10px 14px;
      font-size: 0.92rem;
    }
    .eyebrow {
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.72rem;
      color: #5a6a71;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.8rem, 4vw, 3.2rem);
      line-height: 1;
    }
    .compact h1 {
      font-size: clamp(1.35rem, 3vw, 2rem);
    }
    .error {
      margin: 0;
      padding: 14px 16px;
      border-radius: 18px;
      background: #ffe9e3;
      color: #a33b19;
    }
    @media (max-width: 720px) {
      .brand-logo {
        height: 52px;
      }
    }
  `
})
export class CallRoomPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TelemedApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly appointment = signal<AppointmentResponse | null>(null);
  readonly error = signal('');
  readonly compactMode = signal(false);
  private errorTimer: number | null = null;

  constructor() {
    this.compactMode.set(window.location.search.includes('popup=1') || !!window.opener || window.innerWidth <= 920);
    const navigationState = this.router.getCurrentNavigation()?.extras.state as { appointment?: AppointmentResponse } | undefined;
    const historyState = history.state as { appointment?: AppointmentResponse } | undefined;
    const preloadedAppointment = navigationState?.appointment ?? historyState?.appointment ?? null;
    if (preloadedAppointment?.id) {
      this.appointment.set(preloadedAppointment);
    }

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const appointmentId = Number(params.get('appointmentId'));
      if (!appointmentId) {
        this.setError('Consulta invalida.');
        void this.router.navigateByUrl('/dashboard');
        return;
      }

      if (this.appointment()?.id === appointmentId) {
        this.error.set('');
        return;
      }

      this.api
        .getAppointments()
        .pipe(timeout(10000))
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (appointments) => {
            const appointment = appointments.find((item) => item.id === appointmentId) ?? null;
            if (!appointment) {
              this.setError('Nao foi possivel localizar a consulta informada.');
              void this.router.navigateByUrl('/dashboard');
              return;
            }

            this.error.set('');
            this.appointment.set(appointment);
          },
          error: () => {
            this.setError('Nao foi possivel carregar os dados da consulta. Volte ao painel e tente novamente.');
          }
        });
    });
  }

  private setError(message: string): void {
    this.error.set(message);
    if (this.errorTimer !== null) {
      window.clearTimeout(this.errorTimer);
    }
    this.errorTimer = window.setTimeout(() => this.error.set(''), 3000);
  }
}
