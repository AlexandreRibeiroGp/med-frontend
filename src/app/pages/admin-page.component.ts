import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { DoctorResponse, DoctorSpecialty, UserResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-admin-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page" *ngIf="auth.isOwner(); else denied">
      <header>
        <div>
          <p class="eyebrow">Gestao interna</p>
          <h1>Cadastros internos</h1>
          <p>Somente o seu usuario pode cadastrar medicos e administradores.</p>
        </div>
        <a routerLink="/dashboard">Voltar ao painel</a>
      </header>

      <p *ngIf="message()" class="message">{{ message() }}</p>
      <p *ngIf="error()" class="error">{{ error() }}</p>

      <section class="grid">
        <article class="card">
          <h2>Cadastrar medico</h2>
          <form [formGroup]="doctorForm" (ngSubmit)="submitDoctor()">
            <input formControlName="fullName" placeholder="Nome completo" />
            <input formControlName="email" type="email" placeholder="E-mail" />
            <input formControlName="password" type="password" placeholder="Senha" />
            <input formControlName="phoneNumber" placeholder="Telefone" />
            <input formControlName="crm" placeholder="CRM" />
            <select formControlName="specialty">
              <option *ngFor="let specialty of specialtyOptions" [value]="specialty">{{ specialtyLabel(specialty) }}</option>
            </select>
            <textarea formControlName="biography" placeholder="Biografia"></textarea>
            <label class="upload-field">
              <span>Foto do medico</span>
              <input type="file" accept="image/*" (change)="onDoctorPhotoSelected($event)" />
              <small *ngIf="doctorPhotoName()">{{ doctorPhotoName() }}</small>
            </label>
            <label class="check">
              <input formControlName="telemedicineEnabled" type="checkbox" />
              Telemedicina habilitada
            </label>
            <button [disabled]="loading()" type="submit">Salvar medico</button>
          </form>
        </article>

        <article class="card">
          <h2>Cadastrar administrador</h2>
          <form [formGroup]="adminForm" (ngSubmit)="submitAdmin()">
            <input formControlName="fullName" placeholder="Nome completo" />
            <input formControlName="email" type="email" placeholder="E-mail" />
            <input formControlName="password" type="password" placeholder="Senha" />
            <input formControlName="phoneNumber" placeholder="Telefone" />
            <button [disabled]="loading()" type="submit">Salvar administrador</button>
          </form>
        </article>

        <article class="card wide">
          <h2>Medicos cadastrados</h2>
          <div class="list">
            <div *ngFor="let doctor of doctors()" class="row">
              <div class="doctor-summary">
                <div class="doctor-avatar">
                  <img *ngIf="doctor.profilePhotoUrl; else doctorInitial" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
                  <ng-template #doctorInitial>{{ doctor.user.fullName.charAt(0) }}</ng-template>
                </div>
                <div class="doctor-summary-text">
                  <strong>{{ doctor.user.fullName }}</strong>
                  <span>{{ specialtyLabel(doctor.specialty) }} · {{ doctor.crm }}</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>

    <ng-template #denied>
      <div class="page">
        <article class="card denied">
          <h2>Acesso restrito</h2>
          <p>Essa area interna esta disponivel somente para o dono do sistema.</p>
          <a routerLink="/dashboard">Voltar ao painel</a>
        </article>
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: #f4efe6;
      color: #112027;
      font-family: 'Segoe UI', sans-serif;
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .wide {
      grid-column: 1 / -1;
    }

    .card {
      background: rgba(255, 253, 249, 0.9);
      border-radius: 28px;
      padding: 22px;
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }

    form,
    .list {
      display: grid;
      gap: 12px;
    }

    input,
    select,
    textarea,
    button {
      width: 100%;
      border-radius: 16px;
      font: inherit;
    }

    input,
    select,
    textarea {
      border: 1px solid #d8dfdf;
      padding: 14px 16px;
      background: white;
    }

    textarea {
      min-height: 96px;
      resize: vertical;
    }

    .upload-field {
      display: grid;
      gap: 8px;
      color: #112027;
      font-weight: 700;
    }

    .upload-field input[type='file'] {
      padding: 12px 14px;
    }

    .upload-field small {
      color: #5b6a70;
      font-weight: 500;
    }

    button {
      border: 0;
      padding: 14px 16px;
      font-weight: 700;
      cursor: pointer;
      background: linear-gradient(135deg, #ff8e54, #d94f04);
      color: white;
    }

    .check {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .check input {
      width: auto;
    }

    .row {
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(17, 32, 39, 0.08);
      display: grid;
      gap: 4px;
    }

    .doctor-summary {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .doctor-summary-text {
      display: grid;
      gap: 4px;
    }

    .doctor-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(14, 123, 131, 0.14), rgba(217, 79, 4, 0.18));
      color: #0b5860;
      font-weight: 800;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .doctor-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .message,
    .error {
      border-radius: 16px;
      padding: 12px 14px;
      margin: 0 0 18px;
    }

    .message {
      background: #e6f6f2;
      color: #0f684f;
    }

    .error {
      background: #ffe9e3;
      color: #a33b19;
    }

    a {
      text-decoration: none;
      background: #fff0e8;
      color: #d94f04;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 700;
      display: inline-flex;
      width: fit-content;
    }

    .denied {
      display: grid;
      gap: 16px;
      justify-items: start;
    }

    @media (max-width: 980px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class AdminPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(TelemedApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly specialtyOptions: DoctorSpecialty[] = ['GERAL'];
  readonly doctors = signal<DoctorResponse[]>([]);
  readonly users = signal<UserResponse[]>([]);
  readonly error = signal('');
  readonly message = signal('');
  readonly loading = signal(false);
  readonly doctorPhotoName = signal('');
  private selectedDoctorPhoto: File | null = null;
  private errorTimer: number | null = null;
  private messageTimer: number | null = null;

  readonly doctorForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: [''],
    crm: ['', Validators.required],
    specialty: this.fb.nonNullable.control<DoctorSpecialty>('GERAL', Validators.required),
    biography: [''],
    telemedicineEnabled: [true]
  });

  readonly adminForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: [''],
    documentNumber: [''],
    birthDate: [''],
    healthInsurance: ['']
  });

  constructor() {
    this.loadData();
  }

  specialtyLabel(specialty: DoctorSpecialty): string {
    return specialty === 'GERAL' ? 'Geral' : specialty;
  }

  submitDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.setError('Revise os campos do medico antes de continuar.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.api.registerDoctor(this.doctorForm.getRawValue())
      .pipe(
        switchMap((doctor) =>
          this.selectedDoctorPhoto
            ? this.api.uploadDoctorPhoto(doctor.id, this.selectedDoctorPhoto)
            : of(doctor)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.setMessage('Medico cadastrado com sucesso.');
          this.selectedDoctorPhoto = null;
          this.doctorPhotoName.set('');
          this.doctorForm.reset({
            fullName: '',
            email: '',
            password: '',
            phoneNumber: '',
            crm: '',
            specialty: 'GERAL',
            biography: '',
            telemedicineEnabled: true
          });
          this.loadData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.setError(error.error?.message ?? 'Nao foi possivel cadastrar o medico.');
        }
      });
  }

  onDoctorPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedDoctorPhoto = file;
    this.doctorPhotoName.set(file?.name ?? '');
  }

  submitAdmin(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      this.setError('Revise os campos do administrador antes de continuar.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.api.registerAdmin(this.adminForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.setMessage('Administrador cadastrado com sucesso.');
          this.adminForm.reset({
            fullName: '',
            email: '',
            password: '',
            phoneNumber: '',
            documentNumber: '',
            birthDate: '',
            healthInsurance: ''
          });
          this.loadData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.setError(error.error?.message ?? 'Nao foi possivel cadastrar o administrador.');
        }
      });
  }

  private loadData(): void {
    if (!this.auth.isOwner()) {
      return;
    }

    forkJoin({
      users: this.api.getUsers(),
      doctors: this.api.getDoctors()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, doctors }) => {
          this.error.set('');
          this.users.set(users);
          this.doctors.set(doctors);
        },
        error: () => this.setError('Nao foi possivel carregar os dados internos.')
      });
  }

  private setError(message: string): void {
    this.error.set(message);
    if (this.errorTimer !== null) {
      window.clearTimeout(this.errorTimer);
    }
    this.errorTimer = window.setTimeout(() => this.error.set(''), 3000);
  }

  private setMessage(message: string): void {
    this.message.set(message);
    if (this.messageTimer !== null) {
      window.clearTimeout(this.messageTimer);
    }
    this.messageTimer = window.setTimeout(() => this.message.set(''), 3000);
  }
}
