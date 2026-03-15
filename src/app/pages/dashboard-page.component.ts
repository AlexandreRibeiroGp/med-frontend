import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CallSignalingService } from '../core/call-signaling.service';
import {
  AppointmentResponse,
  AvailabilitySlotResponse,
  DoctorResponse,
  MedicalRecordResponse,
  PatientProfileResponse
} from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';
import { ToastService } from '../core/toast.service';
import { CallQueuePanelComponent } from '../features/dashboard/call-queue-panel.component';
import { DoctorAgendaPanelComponent } from '../features/dashboard/doctor-agenda-panel.component';
import { HistoryPanelComponent } from '../features/dashboard/history-panel.component';
import { PatientCarePanelComponent } from '../features/dashboard/patient-care-panel.component';

function toOffsetIso(localDateTime: string): string {
  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const local = new Date(year, month - 1, day, hour, minute);
  const offsetMinutes = -local.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const offsetRemainingMinutes = String(absoluteOffset % 60).padStart(2, '0');
  const yearValue = String(year).padStart(4, '0');
  const monthValue = String(month).padStart(2, '0');
  const dayValue = String(day).padStart(2, '0');
  const hourValue = String(hour).padStart(2, '0');
  const minuteValue = String(minute).padStart(2, '0');
  return `${yearValue}-${monthValue}-${dayValue}T${hourValue}:${minuteValue}:00${sign}${offsetHours}:${offsetRemainingMinutes}`;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CallQueuePanelComponent,
    DoctorAgendaPanelComponent,
    HistoryPanelComponent,
    PatientCarePanelComponent
  ],
  template: `
    <div class="dashboard">
      <aside class="sidebar">
        <div>
          <p class="label">Sessao ativa</p>
          <h2>{{ auth.user()?.fullName }}</h2>
          <p class="muted">{{ roleLabel() }}</p>
        </div>

        <div class="sidebar-block">
          <p class="label">Navegacao</p>
          <button type="button" [class.active]="section() === primarySection()" (click)="section.set(primarySection())">
            {{ primarySectionLabel() }}
          </button>
          <button type="button" [class.active]="section() === 'calls'" (click)="section.set('calls')">
            Sala de atendimento
          </button>
          <button type="button" [class.active]="section() === 'history'" (click)="section.set('history')">
            Historico clinico
          </button>
          <a *ngIf="auth.role() === 'ADMIN'" routerLink="/admin">Ir para administracao</a>
        </div>

        <button class="logout" type="button" (click)="logout()">Sair</button>
      </aside>

      <main class="content">
        <header class="hero-card">
          <div>
            <p class="eyebrow">Operacao assistida</p>
            <h1>{{ headline() }}</h1>
            <p>{{ subheadline() }}</p>
          </div>
          <div class="stats">
            <div>
              <strong>{{ appointments().length }}</strong>
              <span>Consultas</span>
            </div>
            <div>
              <strong>{{ medicalRecords().length }}</strong>
              <span>Prontuarios</span>
            </div>
            <div>
              <strong>{{ auth.role() === 'DOCTOR' ? availability().length : doctors().length }}</strong>
              <span>{{ auth.role() === 'DOCTOR' ? 'Horarios' : 'Medicos' }}</span>
            </div>
            <div>
              <strong>{{ callService.events().length }}</strong>
              <span>Sinais na sala</span>
            </div>
          </div>
        </header>

        <p *ngIf="feedback()" class="feedback">{{ feedback() }}</p>
        <p *ngIf="error()" class="error">{{ error() }}</p>

        <app-patient-care-panel
          *ngIf="section() === primarySection() && auth.role() === 'PATIENT'"
          [patientProfile]="patientProfile()"
          [specialties]="specialties()"
          [doctors]="doctors()"
          [selectedDoctor]="selectedDoctor()"
          [selectedDoctorSlots]="selectedDoctorSlots()"
          [specialtyFilter]="specialtyFilter"
          (refreshDoctors)="loadDoctors()"
          (doctorSelected)="selectDoctor($event)"
          (slotBooked)="bookSlot($event)"
        />

        <app-doctor-agenda-panel
          *ngIf="section() === primarySection() && auth.role() === 'DOCTOR'"
          [availabilityForm]="availabilityForm"
          [recordForm]="recordForm"
          [availability]="availability()"
          [appointments]="appointments()"
          (createAvailability)="createAvailability()"
          (createRecord)="createMedicalRecord()"
        />

        <section *ngIf="section() === 'calls'" class="calls-board">
          <app-call-queue-panel
            [appointments]="appointments()"
            [role]="auth.role()"
            [canJoinAppointment]="canJoinAppointment"
            [joinAvailabilityLabel]="joinAvailabilityLabel"
            (joinRequested)="openCallRoom($event)"
          />
        </section>

        <app-history-panel
          *ngIf="section() === 'history'"
          [appointments]="appointments()"
          [medicalRecords]="medicalRecords()"
          [role]="auth.role()"
        />
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
      color: #112027;
      font-family: 'Segoe UI', sans-serif;
    }
    .dashboard {
      display: grid;
      grid-template-columns: minmax(260px, 280px) minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }
    .sidebar {
      padding: 28px;
      border-radius: 28px;
      background: linear-gradient(180deg, #112027 0%, #183039 100%);
      color: white;
      display: grid;
      align-content: start;
      gap: 22px;
      height: fit-content;
      position: sticky;
      top: 96px;
      min-width: 0;
      box-sizing: border-box;
    }
    .label, .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.72rem;
      opacity: 0.72;
      margin: 0 0 8px;
    }
    .sidebar-block {
      padding: 18px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.08);
      display: grid;
      gap: 8px;
    }
    .sidebar-block button, .sidebar-block a {
      border: 0;
      border-radius: 14px;
      padding: 12px 14px;
      font: inherit;
      font-weight: 700;
      text-align: left;
      color: white;
      background: rgba(255, 255, 255, 0.08);
      cursor: pointer;
      text-decoration: none;
      width: 100%;
      box-sizing: border-box;
      overflow-wrap: anywhere;
    }
    .sidebar-block button.active { background: linear-gradient(135deg, rgba(255, 142, 84, 0.95), rgba(217, 79, 4, 0.95)); }
    .muted { color: #667980; }
    .sidebar .muted { color: rgba(255, 255, 255, 0.66); }
    .sidebar h2 {
      margin: 0;
      overflow-wrap: anywhere;
    }
    .logout {
      border: 0;
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      background: linear-gradient(135deg, #ff8e54, #d94f04);
      color: white;
      width: 100%;
      box-sizing: border-box;
    }
    .content { display: grid; gap: 18px; min-width: 0; }
    .hero-card {
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
      padding: 28px;
      display: flex;
      justify-content: space-between;
      gap: 22px;
      flex-wrap: wrap;
    }
    h1 { margin: 0 0 10px; font-size: clamp(1.9rem, 4vw, 3.6rem); line-height: 0.98; }
    .stats { display: grid; grid-template-columns: repeat(2, minmax(120px, 1fr)); gap: 12px; min-width: 260px; }
    .stats div { background: #f6f1e8; border-radius: 20px; padding: 18px; }
    .stats strong { display: block; font-size: 1.8rem; }
    .calls-board { display: grid; grid-template-columns: minmax(0, 460px); gap: 18px; }
    .feedback, .error { margin: 0; padding: 14px 16px; border-radius: 18px; }
    .feedback { background: #e6f6f2; color: #0f684f; }
    .error { background: #ffe9e3; color: #a33b19; }
    @media (max-width: 1100px) {
      .dashboard { grid-template-columns: 1fr; }
      .sidebar { position: static; top: auto; }
      .calls-board { grid-template-columns: 1fr; }
    }
  `
})
export class DashboardPageComponent {
  readonly auth = inject(AuthService);
  readonly callService = inject(CallSignalingService);
  private readonly api = inject(TelemedApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly section = signal<'care' | 'agenda' | 'calls' | 'history'>('history');
  readonly error = signal('');
  readonly feedback = signal('');
  readonly doctors = signal<DoctorResponse[]>([]);
  readonly specialties = signal<string[]>([]);
  readonly selectedDoctor = signal<DoctorResponse | null>(null);
  readonly selectedDoctorSlots = signal<AvailabilitySlotResponse[]>([]);
  readonly availability = signal<AvailabilitySlotResponse[]>([]);
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly medicalRecords = signal<MedicalRecordResponse[]>([]);
  readonly patientProfile = signal<PatientProfileResponse | null>(null);
  readonly currentTime = signal(Date.now());

  readonly specialtyFilter = this.fb.nonNullable.control('');
  readonly availabilityForm = this.fb.nonNullable.group({
    startAt: ['', Validators.required],
    endAt: ['', Validators.required]
  });
  readonly recordForm = this.fb.nonNullable.group({
    appointmentId: ['', Validators.required],
    symptoms: [''],
    diagnosis: [''],
    prescription: [''],
    clinicalNotes: ['']
  });

  readonly roleLabel = computed(() => {
    const role = this.auth.role();
    if (role === 'DOCTOR') {
      return 'Medico';
    }
    if (role === 'ADMIN') {
      return 'Administrador';
    }
    return 'Paciente';
  });
  readonly headline = computed(() =>
    this.auth.role() === 'DOCTOR' ? 'Painel de atendimento medico' : 'Painel de jornada do paciente'
  );
  readonly subheadline = computed(() =>
    this.auth.role() === 'DOCTOR'
      ? 'Cadastre horarios, acompanhe consultas e publique prontuarios.'
      : 'Busque especialistas, reserve horarios e acompanhe seu historico clinico.'
  );
  readonly primarySection = computed<'care' | 'agenda'>(() => (this.auth.role() === 'DOCTOR' ? 'agenda' : 'care'));
  readonly primarySectionLabel = computed(() =>
    this.auth.role() === 'DOCTOR' ? 'Agenda do medico' : 'Descobrir medicos'
  );
  constructor() {
    this.section.set(this.primarySection());
    this.destroyRef.onDestroy(() => this.callService.disconnect());
    timer(0, 15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentTime.set(Date.now());
        this.loadBaseData();
      });
  }

  readonly canJoinAppointment = (appointment: AppointmentResponse): boolean => {
    const scheduledAt = new Date(appointment.scheduledAt).getTime();
    const now = this.currentTime();
    const earlyWindow = 15 * 60 * 1000;
    const lateWindow = 2 * 60 * 60 * 1000;
    return now >= scheduledAt - earlyWindow && now <= scheduledAt + lateWindow;
  };

  readonly joinAvailabilityLabel = (appointment: AppointmentResponse): string => {
    const scheduledAt = new Date(appointment.scheduledAt).getTime();
    const now = this.currentTime();
    const earlyWindow = 15 * 60 * 1000;
    if (now < scheduledAt - earlyWindow) {
      const diffMinutes = Math.ceil((scheduledAt - earlyWindow - now) / 60000);
      return `Liberada em ${diffMinutes} min`;
    }
    return 'Janela encerrada';
  };

  logout(): void {
    this.callService.disconnect();
    this.auth.logout();
    this.router.navigateByUrl('/auth');
  }

  loadDoctors(): void {
    this.api
      .getDoctors(this.specialtyFilter.value || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => this.doctors.set(doctors),
        error: () => this.handleError('Nao foi possivel carregar os medicos.')
      });
  }

  selectDoctor(doctor: DoctorResponse): void {
    this.selectedDoctor.set(doctor);
    this.api
      .getDoctorAvailability(doctor.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => this.selectedDoctorSlots.set(slots),
        error: () => this.handleError('Nao foi possivel carregar os horarios deste medico.')
      });
  }

  bookSlot(slot: AvailabilitySlotResponse): void {
    const doctor = this.selectedDoctor();
    if (!doctor) {
      return;
    }

    this.api
      .createAppointment({
        doctorProfileId: doctor.id,
        availabilitySlotId: slot.id,
        appointmentType: 'VIDEO',
        notes: 'Consulta agendada pelo painel Angular'
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedback.set('Consulta agendada com sucesso.');
          this.toast.success('Consulta criada', 'O horario foi reservado. O medico recebe e-mail quando o SMTP estiver configurado.');
          this.section.set('history');
          this.selectDoctor(doctor);
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel agendar a consulta.');
        }
      });
  }

  createAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    const raw = this.availabilityForm.getRawValue();
    this.api
      .createAvailabilitySlot({
        startAt: toOffsetIso(raw.startAt),
        endAt: toOffsetIso(raw.endAt)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedback.set('Horarios gerados com sucesso em blocos de 15 minutos.');
          this.toast.success('Agenda atualizada', 'Os horarios do intervalo ja estao disponiveis para agendamento.');
          this.availabilityForm.reset();
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel gerar os horarios.');
        }
      });
  }

  createMedicalRecord(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const raw = this.recordForm.getRawValue();
    this.api
      .createMedicalRecord({
        appointmentId: Number(raw.appointmentId),
        symptoms: raw.symptoms,
        diagnosis: raw.diagnosis,
        prescription: raw.prescription,
        clinicalNotes: raw.clinicalNotes
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedback.set('Prontuario salvo com sucesso.');
          this.toast.success('Prontuario salvo', 'O registro clinico foi publicado com sucesso.');
          this.recordForm.reset({ appointmentId: '', symptoms: '', diagnosis: '', prescription: '', clinicalNotes: '' });
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel salvar o prontuario.');
        }
      });
  }

  openCallRoom(appointment: AppointmentResponse): void {
    if (!this.canJoinAppointment(appointment)) {
      const message = 'A sala sera liberada 15 minutos antes da consulta e segue disponivel ate 2 horas depois.';
      this.feedback.set(message);
      this.toast.info('Sala indisponivel', message);
      return;
    }

    void this.router.navigate(['/calls', appointment.id], {
      state: { appointment }
    });
  }

  private loadBaseData(): void {
    forkJoin({
      appointments: this.api.getAppointments(),
      medicalRecords: this.api.getMedicalRecords(),
      specialties: this.api.getSpecialties()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ appointments, medicalRecords, specialties }) => {
          this.error.set('');
          this.appointments.set(appointments);
          this.medicalRecords.set(medicalRecords);
          this.specialties.set(specialties);
          this.loadRoleSpecificData();
        },
        error: () => this.handleError('Nao foi possivel carregar o painel com os dados atuais.')
      });
  }

  private loadRoleSpecificData(): void {
    if (this.auth.role() === 'PATIENT') {
      this.loadDoctors();
      this.api
        .getCurrentPatientProfile()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (profile) => this.patientProfile.set(profile),
          error: () => this.handleError('Nao foi possivel carregar o perfil do paciente.')
        });
    }

    if (this.auth.role() === 'DOCTOR') {
      this.api
        .getDoctors()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (doctors) => {
            const currentDoctor = doctors.find((doctor) => doctor.user.id === this.auth.user()?.id);
            if (!currentDoctor) {
              this.handleError('Nao foi possivel localizar o perfil do medico.');
              return;
            }

            this.api
              .getDoctorAvailability(currentDoctor.id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (slots) => this.availability.set(slots),
                error: () => this.handleError('Nao foi possivel carregar sua agenda.')
              });
          },
          error: () => this.handleError('Nao foi possivel localizar os dados do medico.')
        });
    }
  }

  private handleError(message: string): void {
    this.error.set(message);
    this.toast.error('Falha na operacao', message);
  }
}
