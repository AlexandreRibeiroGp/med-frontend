import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, throwError, timer } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { CallSignalingService } from '../core/call-signaling.service';
import {
  AppointmentResponse,
  AvailabilitySlotResponse,
  DoctorResponse,
  LegalDocumentResponse,
  MedicalRecordResponse,
  PaymentMethod,
  PaymentResponse,
  PatientProfileResponse,
  PrescriptionSignatureStartResponse
} from '../core/models';
import { composeAddress, parseAddress } from '../core/address-form';
import { TelemedApiService } from '../core/telemed-api.service';
import { ToastService } from '../core/toast.service';
import { CallQueuePanelComponent } from '../features/dashboard/call-queue-panel.component';
import { DoctorAgendaPanelComponent } from '../features/dashboard/doctor-agenda-panel.component';
import { HistoryPanelComponent } from '../features/dashboard/history-panel.component';
import { PatientCarePanelComponent } from '../features/dashboard/patient-care-panel.component';
import { ProfilePanelComponent } from '../features/dashboard/profile-panel.component';

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

function monthKeyInSaoPaulo(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit'
  }).format(date);
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
    PatientCarePanelComponent,
    ProfilePanelComponent
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
            Documentos
          </button>
          <button type="button" [class.active]="section() === 'profile'" (click)="section.set('profile')">
            Meu perfil
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
          <div class="stats" *ngIf="auth.role() !== 'PATIENT'">
            <div>
              <strong>{{ completedAppointmentsCount() }}</strong>
              <span>Consultas realizadas</span>
            </div>
            <div *ngIf="auth.role() === 'DOCTOR'">
              <strong>{{ doctorReceivablesLabel() }}</strong>
              <span>Valor a receber</span>
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
          [selectedDoctorSlots]="visibleSelectedDoctorSlots()"
          [selectedSlotId]="pendingBookingSlot()?.id ?? null"
          [specialtyFilter]="specialtyFilter"
          [consultationReason]="consultationReason"
          [patientOccupation]="patientOccupation"
          (doctorSelected)="selectDoctor($event)"
          (slotBooked)="bookSlot($event)"
        />

        <section
          *ngIf="
            auth.role() === 'PATIENT' &&
            section() === primarySection() &&
            pendingBookingSlot() &&
            selectedDoctor() as checkoutDoctor
          "
          #checkoutCard
          class="checkout-card"
        >
          <div>
            <p class="eyebrow">Pagamento</p>
            <h3>Concluir reserva com {{ checkoutDoctor.user.fullName }}</h3>
            <p>
              Horario selecionado:
              <strong>{{ pendingBookingSlot()?.startAt | date: 'dd/MM HH:mm' }}</strong>
            </p>
            <p>
              Nome do paciente:
              <strong>{{ auth.user()?.fullName }}</strong>
            </p>
            <p>
              Profissao:
              <strong>{{ patientOccupation.value }}</strong>
            </p>
            <p>
              Motivo informado:
              <strong>{{ consultationReason.value }}</strong>
            </p>
              <p>
                Valor da consulta:
                <strong>{{ checkoutAmountLabel() }}</strong>
              </p>
            <p class="muted">A consulta so sera liberada depois da confirmacao do pagamento.</p>
            <label class="consent-line">
              <input type="checkbox" [formControl]="checkoutConsentControl" />
              <span>
                Declaro que concordo com o atendimento por telemedicina, com o registro em prontuario
                eletronico e com os
                <a routerLink="/legal/termos">Termos de Uso</a>
                e a
                <a routerLink="/legal/privacidade">Politica de Privacidade</a>.
              </span>
            </label>
            <p *ngIf="checkoutConsentControl.touched && checkoutConsentControl.invalid" class="field-error">
              O consentimento para telemedicina e obrigatorio antes do pagamento.
            </p>
          </div>

          <div class="checkout-actions">
            <button type="button" class="pix" (click)="submitCheckout('PIX')">Pagar com Pix</button>
            <button *ngIf="allowMockPayment" type="button" class="mock" (click)="simulateCheckout()">Simular pagamento</button>
            <button type="button" class="ghost" (click)="cancelCheckout()">Cancelar</button>
          </div>

          <section *ngIf="activePixPayment() as pixPayment" class="pix-panel">
            <div class="pix-panel__content">
              <div>
                <p class="eyebrow">Pix gerado</p>
                <h4>Finalize o pagamento sem sair da MedCallOn</h4>
                <p class="muted">
                  O QR Code e o codigo copia e cola ficam ativos ate
                  <strong>{{ pixPayment.expiresAt | date: 'dd/MM HH:mm' }}</strong>.
                </p>
              </div>

              <img
                *ngIf="pixPayment.pixQrCodeBase64"
                class="pix-panel__qr"
                [src]="'data:image/png;base64,' + pixPayment.pixQrCodeBase64"
                alt="QR Code Pix"
              />

              <label class="pix-panel__label" for="pix-code">Codigo copia e cola</label>
              <textarea id="pix-code" readonly [value]="pixPayment.pixCode || ''"></textarea>

              <div class="pix-panel__actions">
                <button type="button" class="copy" (click)="copyPixCode()">Copiar codigo Pix</button>
              </div>

              <p class="pix-panel__status" [class.confirmed]="pixPayment.paymentStatus === 'CONFIRMED'">
                Status atual:
                <strong>{{ paymentStatusLabel(pixPayment) }}</strong>
              </p>
            </div>
          </section>
        </section>

        <app-doctor-agenda-panel
          *ngIf="section() === primarySection() && auth.role() === 'DOCTOR'"
          [availabilityForm]="availabilityForm"
          [deleteRangeForm]="deleteRangeForm"
          [availability]="visibleAvailability()"
          (createAvailability)="createAvailability()"
          (removeAvailabilityRange)="removeAvailabilityRange()"
          (removeAvailability)="removeAvailability($event)"
        />

        <section *ngIf="section() === 'calls'" class="calls-board">
          <app-call-queue-panel
            [appointments]="callableAppointments()"
            [role]="auth.role()"
            [canJoinAppointment]="canJoinAppointment"
            [joinAvailabilityLabel]="joinAvailabilityLabel"
            (joinRequested)="openCallRoom($event)"
          />
        </section>

        <app-profile-panel
          *ngIf="section() === 'profile' && auth.role() !== 'ADMIN'"
          [role]="auth.role()!"
          [patientProfile]="patientProfile()"
          [doctorProfile]="doctorProfile()"
          [patientForm]="patientProfileForm"
          [doctorForm]="doctorProfileForm"
          (savePatient)="savePatientProfile()"
          (saveDoctor)="saveDoctorProfile()"
          (uploadDoctorPhoto)="uploadDoctorPhoto($event)"
        />

        <app-history-panel
          *ngIf="section() === 'history'"
          [appointments]="appointments()"
          [medicalRecords]="medicalRecords()"
          [role]="auth.role()"
          [recordForm]="recordForm"
          (createRecord)="createMedicalRecord()"
          (generatePrescriptionPdf)="generatePrescriptionPdf($event)"
          (startPrescriptionSignature)="startPrescriptionSignature($event)"
          (signedPrescriptionFileChanged)="uploadSignedPrescription($event)"
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
    .stats { display: grid; grid-template-columns: minmax(160px, 180px); gap: 12px; min-width: 180px; }
    .stats div {
      background: #f6f1e8;
      border-radius: 20px;
      padding: 18px;
      min-width: 0;
      overflow: hidden;
    }
    .stats strong {
      display: block;
      font-size: clamp(1.5rem, 2vw, 1.9rem);
      line-height: 1.05;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .stats span {
      display: block;
      margin-top: 6px;
      overflow-wrap: anywhere;
    }
    .calls-board { display: grid; grid-template-columns: minmax(0, 460px); gap: 18px; }
    .feedback, .error { margin: 0; padding: 14px 16px; border-radius: 18px; }
    .feedback { background: #e6f6f2; color: #0f684f; }
    .error { background: #ffe9e3; color: #a33b19; }
    .field-error { margin: -8px 0 0; color: #a33b19; font-size: 0.84rem; line-height: 1.35; }
    .checkout-card {
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
      padding: 22px;
      display: grid;
      gap: 16px;
    }
    .checkout-card h3 { margin: 0 0 8px; }
    .checkout-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .consent-line {
      margin-top: 14px;
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
      color: #51636b;
      font-size: 0.94rem;
      line-height: 1.5;
    }
    .consent-line input {
      margin-top: 3px;
      width: 18px;
      height: 18px;
    }
    .consent-line a {
      color: #0f8b91;
      font-weight: 700;
      text-decoration: none;
    }
    .checkout-actions button {
      border: 0;
      border-radius: 16px;
      padding: 14px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .checkout-actions .pix {
      color: white;
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
    }
    .checkout-actions .mock {
      color: #112027;
      background: #f6f1e8;
    }
    .checkout-actions .ghost {
      background: #f6f1e8;
      color: #112027;
    }
    .pix-panel {
      border-top: 1px solid rgba(17, 32, 39, 0.08);
      padding-top: 16px;
    }
    .pix-panel__content {
      display: grid;
      gap: 14px;
      max-width: 520px;
    }
    .pix-panel h4 {
      margin: 0;
    }
    .pix-panel__qr {
      width: min(240px, 100%);
      aspect-ratio: 1;
      border-radius: 20px;
      border: 1px solid rgba(17, 32, 39, 0.08);
      background: white;
      padding: 12px;
    }
    .pix-panel__label {
      font-weight: 700;
    }
    .pix-panel textarea {
      min-height: 120px;
      resize: vertical;
      border: 1px solid rgba(17, 32, 39, 0.12);
      border-radius: 18px;
      padding: 14px 16px;
      font: inherit;
      color: #112027;
      background: #fff;
    }
    .pix-panel__actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pix-panel__actions .copy {
      border: 0;
      border-radius: 16px;
      padding: 14px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      color: white;
      background: linear-gradient(135deg, #ff8e54, #d94f04);
    }
    .pix-panel__status {
      margin: 0;
      color: #667980;
    }
    .pix-panel__status.confirmed {
      color: #0f684f;
    }
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  @ViewChild('checkoutCard') private checkoutCard?: ElementRef<HTMLElement>;

  readonly section = signal<'care' | 'agenda' | 'calls' | 'history' | 'profile'>('history');
  readonly error = signal('');
  readonly feedback = signal('');
  private errorTimer: number | null = null;
  private feedbackTimer: number | null = null;
  readonly doctors = signal<DoctorResponse[]>([]);
  readonly specialties = signal<string[]>([]);
  readonly legalDocuments = signal<LegalDocumentResponse[]>([]);
  readonly selectedDoctor = signal<DoctorResponse | null>(null);
  readonly selectedDoctorSlots = signal<AvailabilitySlotResponse[]>([]);
  readonly availability = signal<AvailabilitySlotResponse[]>([]);
  readonly appointments = signal<AppointmentResponse[]>([]);
  readonly medicalRecords = signal<MedicalRecordResponse[]>([]);
  readonly appointmentsUnavailable = signal(false);
  readonly medicalRecordsUnavailable = signal(false);
  readonly patientProfile = signal<PatientProfileResponse | null>(null);
  readonly doctorProfile = signal<DoctorResponse | null>(null);
  readonly pendingBookingSlot = signal<AvailabilitySlotResponse | null>(null);
  readonly activePixPayment = signal<PaymentResponse | null>(null);
  readonly currentTime = signal(Date.now());
  private pixPaymentPollingId: number | null = null;
  readonly visibleSelectedDoctorSlots = computed(() =>
    this.selectedDoctorSlots().filter((slot) => slot.available && new Date(slot.endAt).getTime() > this.currentTime())
  );
  readonly visibleAvailability = computed(() =>
    this.availability().filter((slot) => new Date(slot.endAt).getTime() > this.currentTime())
  );
  readonly callableAppointments = computed(() =>
    this.appointments().filter(
      (appointment) =>
        appointment.status !== 'PENDING_PAYMENT' &&
        appointment.status !== 'CANCELLED' &&
        appointment.status !== 'COMPLETED' &&
        this.canJoinAppointment(appointment)
    )
  );
  readonly currentMonthKey = computed(() => monthKeyInSaoPaulo(new Date(this.currentTime())));
  readonly completedAppointmentsCount = computed(() =>
    this.appointments().filter(
      (appointment) =>
        appointment.status === 'COMPLETED' &&
        monthKeyInSaoPaulo(new Date(appointment.scheduledAt)) === this.currentMonthKey()
    ).length
  );
  readonly doctorReceivables = computed(() => this.completedAppointmentsCount() * 35);
  readonly doctorReceivablesLabel = computed(() =>
    this.doctorReceivables().toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  );
  readonly checkoutAmount = computed(() =>
    this.auth.user()?.email?.toLowerCase() === 'teste@gmail.com' ? 1 : 49.9
  );
  readonly checkoutAmountLabel = computed(() =>
    this.checkoutAmount().toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  );

  readonly specialtyFilter = this.fb.nonNullable.control('');
  readonly patientOccupation = this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]);
  readonly consultationReason = this.fb.nonNullable.control('', [Validators.required, Validators.minLength(5)]);
  readonly checkoutConsentControl = this.fb.nonNullable.control(false, Validators.requiredTrue);
  readonly availabilityForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    startHour: ['07', Validators.required],
    startMinute: ['00', Validators.required],
    endHour: ['23', Validators.required],
    endMinute: ['00', Validators.required]
  });
  readonly deleteRangeForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    startHour: ['07', Validators.required],
    startMinute: ['00', Validators.required],
    endHour: ['23', Validators.required],
    endMinute: ['00', Validators.required]
  });
  readonly recordForm = this.fb.nonNullable.group({
    appointmentId: ['', Validators.required],
    diagnosis: [''],
    prescription: [''],
    requiresDigitalSignature: [false],
    preferredCertificateType: ['A3' as 'A1' | 'A3'],
    clinicalNotes: ['']
  });
  readonly patientProfileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: [''],
    profession: ['', [Validators.required, Validators.minLength(2)]],
    postalCode: [''],
    street: [''],
    number: [''],
    complement: [''],
    neighborhood: [''],
    city: [''],
    state: ['']
  });
  readonly doctorProfileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: [''],
    crm: ['', [Validators.required, Validators.minLength(3)]],
    biography: [''],
    telemedicineEnabled: [true]
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
  readonly allowMockPayment = false;
  constructor() {
    this.section.set(this.primarySection());
    this.api.getPublicLegalDocuments().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (documents) => this.legalDocuments.set(documents),
      error: () => this.handleError('Nao foi possivel carregar os documentos legais atuais.')
    });
    this.destroyRef.onDestroy(() => {
      this.callService.disconnect();
      this.stopPixPaymentPolling();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const paymentStatus = params.get('paymentStatus');
      if (paymentStatus === 'success') {
        this.setFeedback('Pagamento confirmado. A consulta sera liberada assim que o backend receber a notificacao do Mercado Pago.');
      } else if (paymentStatus === 'pending') {
        this.setFeedback('Pagamento pendente. Aguarde a confirmacao para liberar a consulta.');
      } else if (paymentStatus === 'failure') {
        this.handleError('O pagamento nao foi concluido. Tente novamente.');
      }
    });
    effect(() => {
      this.section();
      this.loadBaseData();
    });
    effect(() => {
      const profile = this.patientProfile();
      if (!profile) {
        return;
      }
      this.patientProfileForm.patchValue({
        fullName: profile.user.fullName ?? '',
        phoneNumber: profile.user.phoneNumber ?? '',
        profession: profile.profession ?? '',
        ...parseAddress(profile.address)
      }, { emitEvent: false });
      if (!this.patientOccupation.value.trim() && profile.profession) {
        this.patientOccupation.setValue(profile.profession);
      }
    });
    effect(() => {
      const profile = this.doctorProfile();
      if (!profile) {
        return;
      }
      this.doctorProfileForm.patchValue({
        fullName: profile.user.fullName ?? '',
        phoneNumber: profile.user.phoneNumber ?? '',
        crm: profile.crm ?? '',
        biography: profile.biography ?? '',
        telemedicineEnabled: profile.telemedicineEnabled
      }, { emitEvent: false });
    });

    timer(15000, 15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentTime.set(Date.now());
        if (this.section() !== this.primarySection()) {
          this.loadBaseData();
        }
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
      .getDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => {
          if (!doctors.length) {
            this.doctors.set([]);
            return;
          }

          forkJoin(
            doctors.map((doctor) =>
              this.api.getDoctorAvailability(doctor.id).pipe(
                catchError((error: HttpErrorResponse) => (error.status === 404 ? of([]) : throwError(() => error)))
              )
            )
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (availabilityByDoctor) => {
                const now = this.currentTime();
                const availableDoctors = doctors.filter((doctor, index) =>
                  availabilityByDoctor[index].some((slot) => slot.available && new Date(slot.endAt).getTime() > now)
                );

                this.doctors.set(availableDoctors);
                if (this.selectedDoctor() && !availableDoctors.some((doctor) => doctor.id === this.selectedDoctor()?.id)) {
                  this.selectedDoctor.set(null);
                  this.selectedDoctorSlots.set([]);
                  this.pendingBookingSlot.set(null);
                }
              },
              error: () => this.handleError('Nao foi possivel carregar os medicos disponiveis.')
            });
        },
        error: () => this.handleError('Nao foi possivel carregar os medicos.')
      });
  }

  selectDoctor(doctor: DoctorResponse): void {
    this.selectedDoctor.set(doctor);
    this.pendingBookingSlot.set(null);
    this.api
      .getDoctorAvailability(doctor.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => this.selectedDoctorSlots.set(slots),
        error: () => this.handleError('Nao foi possivel carregar os horarios deste medico.')
      });
  }

  bookSlot(slot: AvailabilitySlotResponse): void {
    if (!this.selectedDoctor()) {
      return;
    }
    if (this.patientOccupation.invalid || this.consultationReason.invalid) {
      this.patientOccupation.markAsTouched();
      this.consultationReason.markAsTouched();
      this.handleError('Informe sua profissao e o motivo da consulta antes de selecionar um horario.');
      return;
    }
    this.pendingBookingSlot.set(slot);
    this.feedback.set('');
    this.error.set('');
    window.setTimeout(() => {
      this.checkoutCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  cancelCheckout(): void {
    this.pendingBookingSlot.set(null);
    this.activePixPayment.set(null);
    this.stopPixPaymentPolling();
    this.checkoutConsentControl.reset(false);
  }

  submitCheckout(paymentMethod: PaymentMethod): void {
    const doctor = this.selectedDoctor();
    const slot = this.pendingBookingSlot();
    const occupation = this.patientOccupation.getRawValue().trim();
    const reason = this.consultationReason.getRawValue().trim();
    const acceptedDocumentIds = this.requiredLegalDocumentIds();
    if (!doctor || !slot) {
      return;
    }
    if (this.checkoutConsentControl.invalid) {
      this.checkoutConsentControl.markAsTouched();
      this.handleError('Aceite o consentimento de telemedicina antes de seguir para o pagamento.');
      return;
    }
    if (acceptedDocumentIds.length < 2) {
      this.handleError('Os documentos legais ativos ainda nao foram carregados. Tente novamente em instantes.');
      return;
    }
    if (!occupation || !reason) {
      this.handleError('Informe profissao e motivo da consulta antes de concluir o agendamento.');
      return;
    }
    this.savePatientOccupationIfNeeded(occupation, () => {
      this.api
        .checkoutAppointment({
          doctorProfileId: doctor.id,
          availabilitySlotId: slot.id,
          appointmentType: 'VIDEO',
          notes: reason,
          paymentMethod,
          acceptedDocumentIds,
          acceptedTelemedicine: true
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (checkout) => {
            if (paymentMethod === 'PIX' && checkout.payment.pixCode) {
              this.activePixPayment.set(checkout.payment);
              this.startPixPaymentPolling(checkout.payment.id, doctor);
              this.setFeedback('Pix gerado com sucesso. Pague pelo QR Code ou pelo codigo copia e cola abaixo.');
              this.toast.success('Pix gerado', 'Conclua o pagamento para liberar automaticamente a consulta.');
              window.setTimeout(() => {
                this.checkoutCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
              return;
            }

            this.pendingBookingSlot.set(null);
            this.activePixPayment.set(null);
            this.stopPixPaymentPolling();
            this.consultationReason.reset('');
            this.checkoutConsentControl.reset(false);
            this.selectDoctor(doctor);
            this.loadBaseData();
            if (checkout.payment.checkoutUrl) {
              this.setFeedback('Redirecionando para o pagamento no Mercado Pago...');
              this.toast.info('Pagamento iniciado', 'Voce sera redirecionado para concluir o pagamento.');
              window.location.href = checkout.payment.checkoutUrl;
              return;
            }

            this.handleError('O checkout foi criado sem URL de pagamento.');
          },
          error: (error: { error?: { message?: string } }) => {
            this.handleError(error.error?.message ?? 'Nao foi possivel iniciar o pagamento da consulta.');
          }
        });
    });
  }

  simulateCheckout(): void {
    const doctor = this.selectedDoctor();
    const slot = this.pendingBookingSlot();
    const occupation = this.patientOccupation.getRawValue().trim();
    const reason = this.consultationReason.getRawValue().trim();
    const acceptedDocumentIds = this.requiredLegalDocumentIds();
    if (!doctor || !slot) {
      return;
    }
    if (this.checkoutConsentControl.invalid) {
      this.checkoutConsentControl.markAsTouched();
      this.handleError('Aceite o consentimento de telemedicina antes de seguir para o pagamento.');
      return;
    }
    if (acceptedDocumentIds.length < 2) {
      this.handleError('Os documentos legais ativos ainda nao foram carregados. Tente novamente em instantes.');
      return;
    }
    if (!occupation || !reason) {
      this.handleError('Informe profissao e motivo da consulta antes de concluir o agendamento.');
      return;
    }
    this.savePatientOccupationIfNeeded(occupation, () => {
      this.api
        .checkoutAppointment({
          doctorProfileId: doctor.id,
          availabilitySlotId: slot.id,
          appointmentType: 'VIDEO',
          notes: reason,
          paymentMethod: 'PIX',
          acceptedDocumentIds,
          acceptedTelemedicine: true
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (checkout) => {
            this.api
              .confirmPayment(checkout.payment.id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.pendingBookingSlot.set(null);
                  this.activePixPayment.set(null);
                  this.stopPixPaymentPolling();
                  this.consultationReason.reset('');
                  this.checkoutConsentControl.reset(false);
                  this.setFeedback('Pagamento simulado com sucesso. A consulta foi liberada para teste.');
                  this.toast.success('Pagamento confirmado', 'Consulta liberada em modo de teste.');
                  this.selectDoctor(doctor);
                  this.loadBaseData();
                },
                error: (error: { error?: { message?: string } }) => {
                  this.handleError(error.error?.message ?? 'Nao foi possivel confirmar o pagamento simulado.');
                }
              });
          },
          error: (error: { error?: { message?: string } }) => {
            this.handleError(error.error?.message ?? 'Nao foi possivel iniciar o pagamento simulado.');
          }
        });
    });
  }

  createAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    const raw = this.availabilityForm.getRawValue();
    const startAt = `${raw.date}T${raw.startHour}:${raw.startMinute}`;
    const endAt = `${raw.date}T${raw.endHour}:${raw.endMinute}`;
    this.api
      .createAvailabilitySlot({
        startAt: toOffsetIso(startAt),
        endAt: toOffsetIso(endAt)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setFeedback('Horarios gerados com sucesso em blocos de 15 minutos.');
          this.toast.success('Agenda atualizada', 'Os horarios do intervalo ja estao disponiveis para agendamento.');
          this.availabilityForm.reset({
            date: '',
            startHour: '07',
            startMinute: '00',
            endHour: '23',
            endMinute: '00'
          });
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel gerar os horarios.');
        }
      });
  }

  removeAvailabilityRange(): void {
    if (this.deleteRangeForm.invalid) {
      this.deleteRangeForm.markAllAsTouched();
      return;
    }

    const raw = this.deleteRangeForm.getRawValue();
    const startAt = `${raw.date}T${raw.startHour}:${raw.startMinute}`;
    const endAt = `${raw.date}T${raw.endHour}:${raw.endMinute}`;
    this.api
      .deleteAvailabilityRange({
        startAt: toOffsetIso(startAt),
        endAt: toOffsetIso(endAt)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setFeedback('Intervalo removido com sucesso.');
          this.toast.success('Agenda atualizada', 'Os horarios do intervalo foram excluidos.');
          this.deleteRangeForm.reset({
            date: '',
            startHour: '07',
            startMinute: '00',
            endHour: '23',
            endMinute: '00'
          });
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel excluir o intervalo.');
        }
      });
  }

  removeAvailability(slotId: number): void {
    this.api
      .deleteAvailabilitySlot(slotId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setFeedback('Horario removido com sucesso.');
          this.toast.success('Agenda atualizada', 'O horario foi excluido da sua agenda.');
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel excluir o horario.');
        }
      });
  }

  savePatientProfile(): void {
    if (this.patientProfileForm.invalid) {
      this.patientProfileForm.markAllAsTouched();
      return;
    }

    const raw = this.patientProfileForm.getRawValue();
    this.api
      .updateCurrentPatientProfile({
        fullName: raw.fullName.trim(),
        phoneNumber: raw.phoneNumber.trim() || null,
        profession: raw.profession.trim(),
        address: composeAddress(raw)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.patientProfile.set(profile);
          this.patientOccupation.setValue(profile.profession ?? '');
          this.setFeedback('Perfil do paciente atualizado com sucesso.');
          this.toast.success('Perfil atualizado', 'Seus dados foram salvos.');
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel atualizar o perfil do paciente.');
        }
      });
  }

  saveDoctorProfile(): void {
    if (this.doctorProfileForm.invalid) {
      this.doctorProfileForm.markAllAsTouched();
      return;
    }

    const raw = this.doctorProfileForm.getRawValue();
    this.api
      .updateCurrentDoctorProfile({
        fullName: raw.fullName.trim(),
        phoneNumber: raw.phoneNumber.trim() || null,
        crm: raw.crm.trim(),
        biography: raw.biography.trim() || null,
        telemedicineEnabled: raw.telemedicineEnabled
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.doctorProfile.set(profile);
          this.setFeedback('Perfil profissional atualizado com sucesso.');
          this.toast.success('Perfil atualizado', 'Seus dados profissionais foram salvos.');
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel atualizar o perfil do medico.');
        }
      });
  }

  uploadDoctorPhoto(file: File): void {
    const profile = this.doctorProfile();
    if (!profile) {
      this.handleError('Nao foi possivel identificar o medico para enviar a foto.');
      return;
    }

    this.api
      .uploadDoctorPhoto(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedProfile) => {
          this.doctorProfile.set(updatedProfile);
          this.setFeedback('Foto do perfil atualizada com sucesso.');
          this.toast.success('Foto atualizada', 'A nova foto do medico ja esta disponivel.');
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel enviar a foto do medico.');
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
          diagnosis: raw.diagnosis,
          prescription: raw.prescription,
          requiresDigitalSignature: raw.requiresDigitalSignature,
          preferredCertificateType: raw.preferredCertificateType,
          clinicalNotes: raw.clinicalNotes
        })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.finishRecordCreation('Documento salvo com receita emitida.'),
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel salvar o documento.');
        }
      });
  }

  generatePrescriptionPdf(recordId: number): void {
    this.api.generatePrescriptionPdf(recordId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setFeedback('PDF da receita gerado com sucesso.');
          this.toast.success('PDF gerado', 'A receita ja pode ser baixada ou enviada para assinatura.');
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel gerar o PDF da receita.');
        }
      });
  }

  startPrescriptionSignature(recordId: number): void {
    this.api.startPrescriptionSignature(recordId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: PrescriptionSignatureStartResponse) => {
          if (response.bridgeUrl && response.bridgePayload) {
            void this.sendToLocalSignatureBridge(response);
          } else if (response.medicalRecord.preferredCertificateType === 'A3') {
            this.toast.info(
              'Assinador local pendente',
              'Configure um bridge local de assinatura A3 para abrir o seletor do certificado no computador do medico.'
            );
          }
          this.setFeedback(response.message || 'Assinatura iniciada.');
          this.toast.success('Assinatura iniciada', response.message || 'O fluxo de assinatura foi iniciado.');
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel iniciar a assinatura digital.');
        }
      });
  }

  private async sendToLocalSignatureBridge(response: PrescriptionSignatureStartResponse): Promise<void> {
    try {
      const token = this.auth.token();
      const bridgePayload = {
        ...response.bridgePayload,
        accessToken: token
      };
      const bridgeResponse = await fetch(response.bridgeUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bridgePayload)
      });

      if (!bridgeResponse.ok) {
        throw new Error('Bridge local indisponivel');
      }

      this.toast.info(
        'Assinador aberto',
        response.medicalRecord.preferredCertificateType === 'A3'
          ? 'O assinador local foi acionado para o medico selecionar o certificado A3.'
          : 'O assinador local foi acionado para o fluxo A1.'
      );
    } catch {
      this.toast.info(
        'Bridge local nao encontrado',
        response.medicalRecord.preferredCertificateType === 'A3'
          ? 'Nenhum assinador local A3 respondeu em 127.0.0.1:18999. Instale ou inicie o bridge no computador do medico.'
          : 'Nenhum assinador local A1 respondeu em 127.0.0.1:18999.'
      );
    }
  }

  uploadSignedPrescription(payload: { recordId: number; file: File | null }): void {
    if (!payload.file) {
      return;
    }

    this.api.uploadSignedPrescription(payload.recordId, payload.file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setFeedback('PDF assinado enviado com sucesso.');
          this.toast.success('Receita assinada', 'O documento assinado foi salvo no prontuario.');
          this.loadBaseData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel enviar o PDF assinado.');
        }
      });
  }

  openCallRoom(appointment: AppointmentResponse): void {
    if (!this.canJoinAppointment(appointment)) {
      const message = 'A sala sera liberada 15 minutos antes da consulta e segue disponivel ate 2 horas depois.';
      this.setFeedback(message);
      this.toast.info('Sala indisponivel', message);
      return;
    }

    void this.router.navigate(['/calls', appointment.id], {
      state: { appointment }
    });
  }

  refreshPixPayment(): void {
    const pixPayment = this.activePixPayment();
    const doctor = this.selectedDoctor();
    if (!pixPayment || !doctor) {
      return;
    }
    this.fetchPixPaymentStatus(pixPayment.id, doctor);
  }

  async copyPixCode(): Promise<void> {
    const pixCode = this.activePixPayment()?.pixCode;
    if (!pixCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pixCode);
      this.toast.success('Codigo copiado', 'O codigo Pix foi copiado para a area de transferencia.');
    } catch {
      this.toast.error('Falha ao copiar', 'Nao foi possivel copiar o codigo Pix automaticamente.');
    }
  }

  paymentStatusLabel(payment: PaymentResponse): string {
    switch (payment.paymentStatus) {
      case 'CONFIRMED':
        return 'Pagamento confirmado';
      case 'FAILED':
        return 'Pagamento recusado';
      case 'CANCELLED':
        return 'Pagamento cancelado';
      case 'EXPIRED':
        return 'Pagamento expirado';
      default:
        return 'Aguardando confirmacao';
    }
  }

  private requiredLegalDocumentIds(): number[] {
    return this.legalDocuments()
      .filter((document) => document.documentType === 'TERMS_OF_USE' || document.documentType === 'PRIVACY_POLICY')
      .map((document) => document.id);
  }

  private loadBaseData(): void {
    if (this.auth.role() === 'PATIENT' && this.section() === 'care') {
      this.api
        .getSpecialties()
        .pipe(
          catchError((error: HttpErrorResponse) => (error.status === 404 ? of([]) : throwError(() => error))),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (specialties) => {
            this.error.set('');
            this.specialties.set(specialties);
            this.medicalRecords.set([]);
            this.appointments.set([]);
            this.loadRoleSpecificData();
          },
          error: () => this.handleError('Nao foi possivel carregar o painel com os dados atuais.')
        });
      return;
    }

    forkJoin({
      appointments: this.appointmentsUnavailable()
        ? of([])
        : this.api.getAppointments().pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 404) {
                this.appointmentsUnavailable.set(true);
                return of([]);
              }
              return throwError(() => error);
            })
          ),
      medicalRecords: this.medicalRecordsUnavailable()
        ? of([])
        : this.api.getMedicalRecords().pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 404) {
                this.medicalRecordsUnavailable.set(true);
                return of([]);
              }
              return throwError(() => error);
            })
          ),
      specialties: this.api.getSpecialties().pipe(
        catchError((error: HttpErrorResponse) => (error.status === 404 ? of([]) : throwError(() => error)))
      )
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
      this.doctorProfile.set(null);
      this.loadDoctors();
      this.api
        .getCurrentPatientProfile()
        .pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 404) {
              this.patientProfile.set(null);
              return of(null);
            }
            throw error;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (profile) => this.patientProfile.set(profile),
          error: () => this.handleError('Nao foi possivel carregar o perfil do paciente.')
        });
    }

    if (this.auth.role() === 'DOCTOR') {
      this.patientProfile.set(null);
      this.api
        .getCurrentDoctorProfile()
        .pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 404) {
              this.doctorProfile.set(null);
              this.availability.set([]);
              return of(null);
            }
            throw error;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (currentDoctor) => {
            if (!currentDoctor) {
              this.availability.set([]);
              return;
            }

            this.doctorProfile.set(currentDoctor);

            this.api
              .getDoctorAvailability(currentDoctor.id)
              .pipe(
                catchError((error: HttpErrorResponse) => {
                  if (error.status === 404) {
                    return of([]);
                  }
                  throw error;
                }),
                takeUntilDestroyed(this.destroyRef)
              )
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
    if (this.errorTimer !== null) {
      window.clearTimeout(this.errorTimer);
    }
    this.errorTimer = window.setTimeout(() => this.error.set(''), 3000);
    this.toast.error('Falha na operacao', message);
  }

  private setFeedback(message: string): void {
    this.feedback.set(message);
    if (this.feedbackTimer !== null) {
      window.clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = window.setTimeout(() => this.feedback.set(''), 3000);
  }

  private finishRecordCreation(message: string): void {
    this.setFeedback(message);
    this.toast.success('Documento salvo', message);
    this.recordForm.reset({ appointmentId: '', diagnosis: '', prescription: '', requiresDigitalSignature: false, preferredCertificateType: 'A3', clinicalNotes: '' });
    this.loadBaseData();
  }

  private savePatientOccupationIfNeeded(occupation: string, onSaved: () => void): void {
    const normalizedOccupation = occupation.trim();
    if (!normalizedOccupation) {
      this.handleError('Informe sua profissao antes de concluir o agendamento.');
      return;
    }

    const currentProfession = this.patientProfile()?.profession?.trim() ?? '';
    if (currentProfession === normalizedOccupation) {
      onSaved();
      return;
    }

    this.api
      .updateCurrentPatientProfession({ profession: normalizedOccupation })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.patientProfile.set(profile);
          this.patientOccupation.setValue(profile.profession ?? normalizedOccupation);
          onSaved();
        },
        error: (error: { error?: { message?: string } }) => {
          this.handleError(error.error?.message ?? 'Nao foi possivel salvar a profissao do paciente.');
        }
      });
  }

  private startPixPaymentPolling(paymentId: number, doctor: DoctorResponse): void {
    this.stopPixPaymentPolling();
    this.pixPaymentPollingId = window.setInterval(() => {
      this.fetchPixPaymentStatus(paymentId, doctor);
    }, 5000);
  }

  private stopPixPaymentPolling(): void {
    if (this.pixPaymentPollingId !== null) {
      window.clearInterval(this.pixPaymentPollingId);
      this.pixPaymentPollingId = null;
    }
  }

  private fetchPixPaymentStatus(paymentId: number, doctor: DoctorResponse): void {
    this.api
      .getPayment(paymentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payment) => {
          this.activePixPayment.set(payment);
          if (payment.paymentStatus === 'CONFIRMED') {
            this.stopPixPaymentPolling();
            this.pendingBookingSlot.set(null);
            this.consultationReason.reset('');
            this.setFeedback('Pagamento confirmado. A consulta foi liberada.');
            this.toast.success('Pagamento confirmado', 'A consulta ja esta liberada para atendimento.');
            this.selectDoctor(doctor);
            this.loadBaseData();
            return;
          }

          if (payment.paymentStatus === 'FAILED' || payment.paymentStatus === 'CANCELLED' || payment.paymentStatus === 'EXPIRED') {
            this.stopPixPaymentPolling();
            this.handleError(`O pagamento Pix foi finalizado com status ${payment.paymentStatus.toLowerCase()}. Gere um novo Pix para tentar novamente.`);
          }
        },
        error: () => {
          this.stopPixPaymentPolling();
          this.handleError('Nao foi possivel atualizar o status do pagamento Pix.');
        }
      });
  }
}
