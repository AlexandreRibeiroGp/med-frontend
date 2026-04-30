import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { BookingFlowService } from '../core/booking-flow.service';
import { AvailabilitySlotResponse, DoctorResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-consultation-start-page',
  imports: [CommonModule, RouterLink],
  template: `
    <main class="start-page">
      <section class="hero-card">
        <a routerLink="/" class="back-link">Voltar</a>
        <p class="eyebrow">Agenda online</p>
        <h1>Escolha o dia, veja os médicos online e reserve sua consulta.</h1>
        <p class="lead">
          Selecione a data, clique no médico com horário aberto e siga para cadastro, login e pagamento.
        </p>

        <div class="journey-strip">
          <article>
            <strong>1. Escolha o dia</strong>
            <span>Veja as datas com horários publicados.</span>
          </article>
          <article>
            <strong>2. Clique no médico</strong>
            <span>Os horários desse dia abrem em um popup.</span>
          </article>
          <article>
            <strong>3. Pague e libere a sala</strong>
            <span>Depois do Pix confirmado, a sala fica disponível.</span>
          </article>
        </div>

        <section class="date-card" *ngIf="dateOptions().length; else emptyDoctors">
          <div class="section-head">
            <strong>Escolha o dia</strong>
            <span>Mostramos abaixo apenas médicos com horário aberto na data selecionada.</span>
          </div>
          <div class="date-strip">
            <button
              type="button"
              *ngFor="let option of dateOptions()"
              [class.active]="selectedDate() === option.value"
              (click)="selectedDate.set(option.value)"
            >
              <strong>{{ option.day }}</strong>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </section>

        <section class="doctor-card-list" *ngIf="doctorsForSelectedDate().length; else emptyDoctorsForDate">
          <div class="section-head">
            <strong>Médicos online no dia selecionado</strong>
            <span>Clique no médico para abrir os horários disponíveis.</span>
          </div>

          <div class="doctor-list">
            <button
              type="button"
              class="doctor-card"
              *ngFor="let doctor of doctorsForSelectedDate()"
              (click)="openDoctorSlots(doctor)"
            >
              <div class="doctor-photo">
                <img *ngIf="doctor.profilePhotoUrl; else doctorInitial" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
                <ng-template #doctorInitial>{{ doctor.user.fullName.charAt(0) }}</ng-template>
              </div>
              <div>
                <strong>{{ doctor.user.fullName }}</strong>
                <span>{{ specialtyLabel(doctor.specialty) }}</span>
                <small>CRM {{ doctor.crm }}</small>
                <em>Toque para ver horários</em>
              </div>
            </button>
          </div>
        </section>

        <ng-template #emptyDoctorsForDate>
          <article class="empty-doctors" *ngIf="dateOptions().length">
            <strong>Sem horários nesse dia</strong>
            <p>Escolha outra data para ver médicos com horários abertos.</p>
          </article>
        </ng-template>

        <ng-template #emptyDoctors>
          <article class="empty-doctors">
            <strong>Médicos em atualização</strong>
            <p>Nenhum horário aberto foi encontrado agora. Tente novamente em instantes.</p>
          </article>
        </ng-template>
      </section>

      <aside class="summary-card">
        <span>Consulta online</span>
        <strong>R$ 49,90</strong>
        <p>Fluxo simples: escolha do horário, cadastro ou login, Pix e sala de atendimento.</p>
      </aside>
    </main>

    <div class="modal-backdrop" *ngIf="selectedDoctorForModal() as doctor" (click)="closeDoctorSlots()">
      <section class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Horários disponíveis</p>
            <h2>{{ doctor.user.fullName }}</h2>
            <p>{{ selectedDateLabel() }}</p>
          </div>
          <button type="button" class="close-button" (click)="closeDoctorSlots()">Fechar</button>
        </div>

        <div class="slot-grid" *ngIf="slotsForModalDoctor().length; else emptySlots">
          <button type="button" *ngFor="let slot of slotsForModalDoctor()" (click)="chooseSlot(doctor, slot)">
            <strong>{{ slot.startAt | date: 'HH:mm' }}</strong>
            <span>Selecionar horário</span>
          </button>
        </div>

        <ng-template #emptySlots>
          <p class="empty-text">Esse médico não tem mais horários abertos nessa data.</p>
        </ng-template>
      </section>
    </div>

    <div class="modal-backdrop" *ngIf="showAuthPrompt() && selectedSlotDoctor() as doctor" (click)="closeAuthPrompt()">
      <section class="modal-card auth-modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Continuar reserva</p>
            <h2>{{ doctor.user.fullName }}</h2>
            <p>{{ selectedSlotLabel() }}</p>
          </div>
          <button type="button" class="close-button" (click)="closeAuthPrompt()">Fechar</button>
        </div>

        <p class="auth-copy">Para seguir ao pagamento, crie sua conta ou entre caso já tenha cadastro.</p>

        <div class="auth-actions">
          <a [routerLink]="'/auth'" [queryParams]="authQueryParams('patient')" class="primary">Criar conta</a>
          <a [routerLink]="'/auth'" [queryParams]="authQueryParams('login')" class="secondary">Já tenho conta</a>
        </div>
      </section>
    </div>
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
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 24px;
      align-items: start;
    }
    .hero-card,
    .summary-card,
    .modal-card {
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
      max-width: 13ch;
      margin: 0;
      font-size: clamp(2.3rem, 5vw, 4.2rem);
      line-height: 0.98;
      letter-spacing: -0.05em;
    }
    .lead {
      margin: 0;
      color: #617b82;
      line-height: 1.65;
      font-size: 1.06rem;
      max-width: 720px;
    }
    .journey-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .journey-strip article,
    .date-card,
    .doctor-card-list,
    .empty-doctors {
      padding: 16px 18px;
      border-radius: 24px;
      background: #fbfdfd;
      border: 1px solid rgba(23, 49, 58, 0.07);
    }
    .journey-strip strong,
    .section-head strong,
    .empty-doctors strong {
      display: block;
      margin-bottom: 4px;
    }
    .journey-strip span,
    .section-head span,
    .empty-doctors p,
    .section-head p {
      color: #617b82;
      line-height: 1.5;
    }
    .section-head {
      display: grid;
      gap: 4px;
      margin-bottom: 14px;
    }
    .date-strip {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .date-strip button,
    .slot-grid button,
    .doctor-card,
    .close-button,
    .auth-actions a {
      border: 0;
      border-radius: 18px;
      font: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .date-strip button {
      min-width: 96px;
      padding: 12px 10px;
      display: grid;
      gap: 3px;
      background: #f6f1e8;
      color: #17313a;
      font-weight: 800;
      text-align: center;
    }
    .date-strip button.active {
      background: linear-gradient(135deg, #112027, #183742);
      color: #fff;
    }
    .doctor-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .doctor-card {
      width: 100%;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: center;
      padding: 14px;
      background: #ffffff;
      border: 1px solid rgba(23, 49, 58, 0.07);
      color: #17313a;
      text-align: left;
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
    .doctor-card strong {
      display: block;
      line-height: 1.2;
    }
    .doctor-card span,
    .doctor-card small {
      display: block;
      color: #617b82;
      margin-top: 3px;
    }
    .doctor-card em {
      display: inline-block;
      margin-top: 8px;
      color: #0b7480;
      font-style: normal;
      font-weight: 800;
      font-size: 0.82rem;
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
    .summary-card strong {
      font-size: 3.2rem;
      line-height: 1;
    }
    .summary-card p {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 32, 39, 0.62);
      display: grid;
      place-items: center;
      padding: 16px;
      z-index: 120;
    }
    .modal-card {
      width: min(560px, 100%);
      max-height: min(88vh, 760px);
      overflow: auto;
      padding: 22px;
      background: #fffdf9;
      display: grid;
      gap: 16px;
    }
    .modal-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: start;
    }
    .modal-head h2 {
      margin: 4px 0 0;
    }
    .modal-head p {
      margin: 6px 0 0;
      color: #617b82;
    }
    .close-button {
      padding: 10px 14px;
      background: #f6f1e8;
      color: #17313a;
      font-weight: 800;
    }
    .slot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }
    .slot-grid button {
      padding: 14px 12px;
      display: grid;
      gap: 4px;
      background: linear-gradient(135deg, #112027, #183742);
      color: #fff;
      text-align: center;
      font-weight: 800;
    }
    .slot-grid button span {
      color: rgba(255, 255, 255, 0.82);
      font-size: 0.8rem;
    }
    .empty-text,
    .auth-copy {
      margin: 0;
      color: #617b82;
      line-height: 1.55;
    }
    .auth-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .auth-actions a {
      padding: 14px 18px;
      font-weight: 900;
      text-align: center;
    }
    .auth-actions .primary {
      background: #25c1bb;
      color: #fff;
    }
    .auth-actions .secondary {
      background: #fff;
      color: #17313a;
      border: 1px solid rgba(23, 49, 58, 0.14);
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
        max-width: 12ch;
        font-size: 2rem;
      }
      .lead {
        font-size: 0.96rem;
      }
      .journey-strip,
      .doctor-list {
        grid-template-columns: 1fr;
      }
      .modal-card {
        width: 100%;
        max-height: calc(100vh - 20px);
        border-radius: 22px;
        padding: 16px;
      }
      .modal-head,
      .auth-actions {
        display: grid;
      }
      .auth-actions a,
      .close-button {
        width: 100%;
      }
    }
  `
})
export class ConsultationStartPageComponent {
  private readonly api = inject(TelemedApiService);
  private readonly auth = inject(AuthService);
  private readonly bookingFlow = inject(BookingFlowService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly doctors = signal<DoctorResponse[]>([]);
  readonly availabilityByDoctor = signal<Record<number, AvailabilitySlotResponse[]>>({});
  readonly selectedDate = signal('');
  readonly selectedDoctorForModal = signal<DoctorResponse | null>(null);
  readonly selectedSlotDoctor = signal<DoctorResponse | null>(null);
  readonly selectedSlot = signal<AvailabilitySlotResponse | null>(null);
  readonly showAuthPrompt = signal(false);

  private readonly localDateKeyFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  private readonly localDayFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit'
  });
  private readonly localLabelFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    month: 'short',
    weekday: 'short'
  });

  readonly dateOptions = computed(() => {
    const seen = new Set<string>();
    const allSlots = Object.values(this.availabilityByDoctor()).flat();
    return allSlots
      .filter((slot) => slot.available && new Date(slot.endAt).getTime() > Date.now())
      .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
      .map((slot) => {
        const date = new Date(slot.startAt);
        const value = this.localDateKeyFormatter.format(date);
        if (seen.has(value)) {
          return null;
        }
        seen.add(value);
        return {
          value,
          day: this.localDayFormatter.format(date),
          label: this.localLabelFormatter.format(date)
        };
      })
      .filter((value): value is { value: string; day: string; label: string } => value !== null);
  });

  readonly doctorsForSelectedDate = computed(() =>
    this.doctors().filter((doctor) =>
      this.filteredSlotsForDoctor(doctor.id).some(
        (slot) => this.localDateKeyFormatter.format(new Date(slot.startAt)) === this.selectedDate()
      )
    )
  );

  readonly slotsForModalDoctor = computed(() => {
    const doctor = this.selectedDoctorForModal();
    if (!doctor) {
      return [];
    }
    return this.filteredSlotsForDoctor(doctor.id).filter(
      (slot) => this.localDateKeyFormatter.format(new Date(slot.startAt)) === this.selectedDate()
    );
  });

  readonly selectedDateLabel = computed(() => {
    const option = this.dateOptions().find((item) => item.value === this.selectedDate());
    return option ? `${option.day} ${option.label}` : '';
  });

  readonly selectedSlotLabel = computed(() => {
    const slot = this.selectedSlot();
    return slot ? new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(slot.startAt)) : '';
  });

  constructor() {
    this.api
      .getDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => {
          const enabledDoctors = doctors.filter((doctor) => doctor.telemedicineEnabled);
          this.doctors.set(enabledDoctors);
          if (!enabledDoctors.length) {
            return;
          }

          forkJoin(
            enabledDoctors.map((doctor) =>
              this.api.getDoctorAvailability(doctor.id).pipe(catchError(() => of([] as AvailabilitySlotResponse[])))
            )
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (slotsByDoctor) => {
                const mapped: Record<number, AvailabilitySlotResponse[]> = {};
                enabledDoctors.forEach((doctor, index) => {
                  mapped[doctor.id] = slotsByDoctor[index] ?? [];
                });
                this.availabilityByDoctor.set(mapped);
              },
              error: () => this.availabilityByDoctor.set({})
            });
        },
        error: () => this.doctors.set([])
      });

    effect(() => {
      const firstDate = this.dateOptions()[0]?.value ?? '';
      if (!firstDate) {
        this.selectedDate.set('');
        return;
      }
      if (!this.dateOptions().some((item) => item.value === this.selectedDate())) {
        this.selectedDate.set(firstDate);
      }
    });
  }

  specialtyLabel(value: string): string {
    return value === 'GERAL' || value === 'GENERALISTA' ? 'Generalista' : value;
  }

  openDoctorSlots(doctor: DoctorResponse): void {
    this.selectedDoctorForModal.set(doctor);
  }

  closeDoctorSlots(): void {
    this.selectedDoctorForModal.set(null);
  }

  closeAuthPrompt(): void {
    this.showAuthPrompt.set(false);
  }

  chooseSlot(doctor: DoctorResponse, slot: AvailabilitySlotResponse): void {
    this.bookingFlow.saveIntent({
      doctorId: doctor.id,
      doctorName: doctor.user.fullName,
      slotId: slot.id,
      scheduledAt: slot.startAt
    });

    this.selectedSlotDoctor.set(doctor);
    this.selectedSlot.set(slot);
    this.selectedDoctorForModal.set(null);

    if (this.auth.isAuthenticated() && this.auth.role() === 'PATIENT') {
      void this.router.navigate(['/dashboard'], { queryParams: { flow: 'checkout' } });
      return;
    }

    this.showAuthPrompt.set(true);
  }

  authQueryParams(mode: 'patient' | 'login'): Record<string, string> {
    const doctor = this.selectedSlotDoctor();
    return {
      source: 'start',
      intent: 'consulta',
      mode,
      doctorId: doctor ? String(doctor.id) : '',
      doctorName: doctor?.user.fullName ?? ''
    };
  }

  private filteredSlotsForDoctor(doctorId: number): AvailabilitySlotResponse[] {
    return (this.availabilityByDoctor()[doctorId] ?? [])
      .filter((slot) => slot.available && new Date(slot.endAt).getTime() > Date.now())
      .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime());
  }
}


