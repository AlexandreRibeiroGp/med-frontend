import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DoctorResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-consultation-start-page',
  imports: [CommonModule, RouterLink],
  template: `
    <main class="start-page">
      <section class="hero-card">
        <a routerLink="/" class="back-link">Voltar</a>
        <p class="eyebrow">Médicos disponíveis</p>
        <h1>Veja nossos médicos disponíveis e siga para sua consulta.</h1>
        <p class="lead">
          Cadastre-se para escolher um horario, pagar por Pix e entrar na sala de atendimento.
          Se voce ja tem conta, entre para continuar do ponto em que parou.
        </p>

        <div class="doctor-list" *ngIf="doctors().length; else emptyDoctors">
          <article class="doctor-card" *ngFor="let doctor of doctors()">
            <div class="doctor-photo">
              <img *ngIf="doctor.profilePhotoUrl; else doctorInitial" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
              <ng-template #doctorInitial>{{ doctor.user.fullName.charAt(0) }}</ng-template>
            </div>
            <div>
              <strong>{{ doctor.user.fullName }}</strong>
              <span>{{ specialtyLabel(doctor.specialty) }}</span>
              <small>CRM {{ doctor.crm }}</small>
            </div>
          </article>
        </div>

        <ng-template #emptyDoctors>
          <article class="empty-doctors">
            <strong>Médicos em atualização</strong>
            <p>Você ainda pode criar sua conta e acompanhar os horários assim que forem publicados.</p>
          </article>
        </ng-template>

        <div class="actions">
          <a routerLink="/auth" [queryParams]="signupQueryParams()" class="primary">Quero me cadastrar</a>
          <a routerLink="/auth" [queryParams]="loginQueryParams()" class="secondary">Já tenho conta</a>
        </div>
      </section>

      <aside class="summary-card">
        <span>Consulta online</span>
        <strong>R$ 49,90</strong>
        <p>Fluxo simples: cadastro, escolha do horário, Pix e sala de atendimento.</p>
      </aside>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      color: #17313a;
      background:
        radial-gradient(circle at top left, rgba(37, 193, 187, 0.18), transparent 28%),
        radial-gradient(circle at right center, rgba(37, 193, 187, 0.12), transparent 26%),
        #ffffff;
      font-family: 'Segoe UI', sans-serif;
    }

    .start-page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 48px 24px 72px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 24px;
      align-items: start;
    }

    .hero-card,
    .summary-card {
      border-radius: 32px;
      border: 1px solid rgba(23, 49, 58, 0.08);
      box-shadow: 0 22px 60px rgba(23, 49, 58, 0.1);
    }

    .hero-card {
      display: grid;
      gap: 18px;
      padding: 34px;
      background: rgba(255, 255, 255, 0.96);
    }

    .back-link,
    .eyebrow {
      color: #20a8a4;
      font-weight: 800;
      text-decoration: none;
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.76rem;
    }

    h1 {
      max-width: 12ch;
      margin: 0;
      font-size: clamp(2.4rem, 5vw, 4.3rem);
      line-height: 0.98;
      letter-spacing: -0.05em;
    }

    .lead {
      max-width: 680px;
      margin: 0;
      color: #617b82;
      line-height: 1.65;
      font-size: 1.08rem;
    }

    .doctor-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .doctor-card,
    .empty-doctors {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: center;
      padding: 14px;
      border-radius: 20px;
      background: #f8fbfb;
      border: 1px solid rgba(23, 49, 58, 0.07);
    }

    .doctor-photo {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: #1f666b;
      color: #ffffff;
      font-size: 1.35rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .doctor-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .doctor-card strong,
    .empty-doctors strong {
      display: block;
      color: #17313a;
      line-height: 1.2;
    }

    .doctor-card span,
    .doctor-card small,
    .empty-doctors p {
      display: block;
      color: #617b82;
      margin-top: 3px;
    }

    .empty-doctors {
      grid-template-columns: 1fr;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .actions a {
      border-radius: 999px;
      padding: 15px 22px;
      font-weight: 900;
      text-decoration: none;
      text-align: center;
    }

    .primary {
      background: #25c1bb;
      color: #ffffff;
    }

    .secondary {
      background: #ffffff;
      color: #17313a;
      border: 1px solid rgba(23, 49, 58, 0.14);
    }

    .summary-card {
      position: sticky;
      top: 96px;
      display: grid;
      gap: 10px;
      padding: 26px;
      background: linear-gradient(180deg, #28c2bc 0%, #18ada8 100%);
      color: #ffffff;
    }

    .summary-card span {
      color: rgba(255, 255, 255, 0.88);
    }

    .summary-card strong {
      font-size: 3.2rem;
      line-height: 1;
    }

    .summary-card p {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
    }

    @media (max-width: 900px) {
      .start-page {
        grid-template-columns: 1fr;
        padding: 18px 14px 64px;
      }

      .summary-card {
        position: static;
        order: -1;
        border-radius: 22px;
        padding: 18px;
      }

      .summary-card strong {
        font-size: 2.4rem;
      }

      .hero-card {
        border-radius: 24px;
        padding: 20px 16px;
      }

      h1 {
        max-width: 13ch;
        font-size: 2rem;
      }

      .lead {
        font-size: 0.96rem;
      }

      .doctor-list {
        display: flex;
        overflow-x: auto;
        gap: 10px;
        padding-bottom: 2px;
      }

      .doctor-card {
        min-width: 240px;
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr;
      }
    }
  `
})
export class ConsultationStartPageComponent {
  private readonly api = inject(TelemedApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly doctors = signal<DoctorResponse[]>([]);

  constructor() {
    this.api
      .getDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => this.doctors.set(doctors.filter((doctor) => doctor.telemedicineEnabled).slice(0, 4)),
        error: () => this.doctors.set([])
      });
  }

  signupQueryParams(): Record<string, string> {
    return { source: 'start', intent: 'consulta', mode: 'patient' };
  }

  loginQueryParams(): Record<string, string> {
    return { source: 'start', intent: 'consulta', mode: 'login' };
  }

  specialtyLabel(value: string): string {
    return value === 'GERAL' || value === 'GENERALISTA' ? 'Generalista' : value;
  }
}
