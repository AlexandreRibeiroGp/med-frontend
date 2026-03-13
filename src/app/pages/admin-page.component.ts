import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DoctorResponse, UserResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-admin-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header>
        <div>
          <p class="eyebrow">Administração</p>
          <h1>Visão operacional</h1>
          <p>Usuários, médicos e especialidades expostos pelo backend atual.</p>
        </div>
        <a routerLink="/dashboard">Voltar ao painel</a>
      </header>

      <p *ngIf="error()" class="error">{{ error() }}</p>

      <section class="grid">
        <article class="card">
          <h2>Usuários</h2>
          <div class="list">
            <div *ngFor="let user of users()" class="row">
              <strong>{{ user.fullName }}</strong>
              <span>{{ user.email }} · {{ user.role }}</span>
            </div>
          </div>
        </article>

        <article class="card">
          <h2>Médicos</h2>
          <div class="list">
            <div *ngFor="let doctor of doctors()" class="row">
              <strong>{{ doctor.user.fullName }}</strong>
              <span>{{ doctor.specialty }} · {{ doctor.crm }}</span>
            </div>
          </div>
        </article>

        <article class="card">
          <h2>Especialidades</h2>
          <div class="chips">
            <span *ngFor="let specialty of specialties()">{{ specialty }}</span>
          </div>
        </article>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: #f4efe6;
      color: #112027;
      font-family: "Segoe UI", sans-serif;
    }

    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: end;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 0.72rem;
      color: #0e7b83;
      font-weight: 700;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .card {
      background: rgba(255, 253, 249, 0.9);
      border-radius: 28px;
      padding: 22px;
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }

    .list {
      display: grid;
      gap: 12px;
    }

    .row {
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(17, 32, 39, 0.08);
      display: grid;
      gap: 4px;
    }

    .chips {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .chips span,
    a {
      text-decoration: none;
      background: #fff0e8;
      color: #d94f04;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 700;
    }

    .error {
      background: #ffe9e3;
      color: #a33b19;
      padding: 14px 16px;
      border-radius: 18px;
      margin-bottom: 18px;
    }

    @media (max-width: 980px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class AdminPageComponent {
  private readonly api = inject(TelemedApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<UserResponse[]>([]);
  readonly doctors = signal<DoctorResponse[]>([]);
  readonly specialties = signal<string[]>([]);
  readonly error = signal('');

  constructor() {
    forkJoin({
      users: this.api.getUsers(),
      doctors: this.api.getDoctors(),
      specialties: this.api.getSpecialties()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, doctors, specialties }) => {
          this.users.set(users);
          this.doctors.set(doctors);
          this.specialties.set(specialties);
        },
        error: () => this.error.set('Não foi possível carregar os dados administrativos.')
      });
  }
}

