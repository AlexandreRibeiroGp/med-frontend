import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AvailabilitySlotResponse, DoctorResponse, PatientProfileResponse } from '../../core/models';

@Component({
  selector: 'app-patient-care-panel',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="patient-flow">
      <article class="card schedule-card" *ngIf="selectedDoctor() as doctor">
        <div class="section-head">
          <p class="eyebrow">Agendamento</p>
          <h3>Escolha o horario e siga para o pagamento</h3>
          <p class="price-note">Valor da consulta: <strong>R$ 49,90</strong></p>
        </div>

        <section class="selected-doctor-banner">
          <div class="doctor-tile-header">
            <div class="doctor-avatar">
              <img *ngIf="doctor.profilePhotoUrl; else selectedDoctorInitial" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
              <ng-template #selectedDoctorInitial>{{ doctor.user.fullName.charAt(0) }}</ng-template>
            </div>
            <div class="doctor-text">
              <strong>{{ doctor.user.fullName }}</strong>
              <span>{{ specialtyLabel(doctor.specialty) }}</span>
              <small>CRM {{ doctor.crm }}</small>
            </div>
          </div>
          <button
            type="button"
            class="swap-button"
            (click)="showDoctorPicker.set(!showDoctorPicker())"
          >
            {{ showDoctorPicker() ? 'Fechar lista de medicos' : 'Trocar medico' }}
          </button>
        </section>

        <section class="consultation-fields">
          <div class="flow-tip success-tip">
            <strong>Passo 2</strong>
            <span>Os horarios deste medico ja estao abertos abaixo. Escolha o dia e toque no horario desejado.</span>
          </div>

          <label class="notes-field">
            <span>Motivo da consulta (opcional)</span>
            <textarea
              [formControl]="consultationReason()"
              placeholder="Descreva o problema, sintomas ou o motivo da consulta"
            ></textarea>
            <small>Esse texto sera enviado junto com o agendamento para o medico.</small>
          </label>
        </section>

        <div class="date-strip" *ngIf="availableDates().length; else emptySlots">
          <button
            type="button"
            *ngFor="let dateOption of availableDates()"
            [class.active]="selectedDate() === dateOption.value"
            (click)="selectedDate.set(dateOption.value)"
          >
            <strong>{{ dateOption.day }}</strong>
            <span>{{ dateOption.label }}</span>
          </button>
        </div>

        <div class="slot-grid" *ngIf="slotsForSelectedDate().length">
          <button
            type="button"
            *ngFor="let slot of slotsForSelectedDate()"
            [class.active]="selectedSlotId() === slot.id"
            (click)="handleSlotSelection(slot)"
          >
            <strong>{{ slot.startAt | date: 'HH:mm' }}</strong>
            <span>{{ slot.endAt | date: 'HH:mm' }}</span>
          </button>
        </div>
      </article>

      <article class="card doctor-card" *ngIf="!selectedDoctor() || showDoctorPicker()">
        <div class="section-head">
          <p class="eyebrow">Medicos disponiveis</p>
          <h3>{{ selectedDoctor() ? 'Escolha outro medico' : 'Escolha um medico com horario aberto' }}</h3>
          <p class="price-note">Consulta por Pix: <strong>R$ 49,90</strong></p>
        </div>

        <div class="flow-tip">
          <strong>Passo 1</strong>
          <span>Clique em um medico para abrir imediatamente os horarios disponiveis.</span>
        </div>

        <div class="doctor-grid" *ngIf="doctors().length; else emptyDoctors">
          <button
            type="button"
            class="doctor-tile"
            [class.active]="selectedDoctor()?.id === doctor.id"
            *ngFor="let doctor of doctors()"
            (click)="selectDoctorFromPanel(doctor)"
          >
            <div class="doctor-tile-header">
              <div class="doctor-avatar">
                <img *ngIf="doctor.profilePhotoUrl; else doctorInitial" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
                <ng-template #doctorInitial>{{ doctor.user.fullName.charAt(0) }}</ng-template>
              </div>
              <div class="doctor-text">
                <strong>{{ doctor.user.fullName }}</strong>
                <span>{{ specialtyLabel(doctor.specialty) }}</span>
                <small>CRM {{ doctor.crm }}</small>
                <em>Toque para ver horarios</em>
              </div>
            </div>
          </button>
        </div>
      </article>
    </section>

    <ng-template #emptyDoctors>
      <p class="empty-state">Nenhum medico com horario aberto no momento.</p>
    </ng-template>

    <ng-template #emptySlots>
      <p class="empty-state">Esse medico ainda nao publicou horarios disponiveis.</p>
    </ng-template>
  `,
  styles: `
    .patient-flow {
      display: grid;
      gap: 18px;
    }
    .card {
      padding: 18px;
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }
    .section-head {
      margin-bottom: 16px;
    }
    .section-head h3 {
      margin: 0;
      font-size: 1.5rem;
    }
    .flow-tip {
      display: grid;
      gap: 4px;
      padding: 12px 14px;
      margin-bottom: 14px;
      border-radius: 18px;
      background: rgba(17, 32, 39, 0.06);
      color: #31464d;
    }
    .flow-tip strong {
      color: #112027;
      font-size: 0.9rem;
    }
    .flow-tip span {
      font-size: 0.94rem;
      line-height: 1.45;
    }
    .success-tip {
      background: rgba(14, 123, 131, 0.1);
    }
    .price-note {
      margin: 10px 0 0;
      color: #516268;
    }
    .price-note strong {
      color: #112027;
    }
    .eyebrow {
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.72rem;
      color: #64747b;
    }
    .doctor-tile,
    .date-strip button,
    .slot-grid button,
    .swap-button {
      border: 0;
      border-radius: 14px;
      font: inherit;
      cursor: pointer;
    }
    .selected-doctor-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 14px;
      border-radius: 18px;
      background: rgba(14, 123, 131, 0.08);
      margin-bottom: 14px;
    }
    .doctor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }
    .doctor-tile {
      display: grid;
      gap: 6px;
      align-content: start;
      text-align: left;
      min-height: 108px;
      padding: 12px 14px;
      background: #f6f1e8;
      color: #112027;
      font-weight: 700;
      transition: transform 120ms ease, background 120ms ease;
    }
    .doctor-tile-header {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .doctor-text {
      display: grid;
      gap: 4px;
      min-width: 0;
    }
    .doctor-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, rgba(14, 123, 131, 0.14), rgba(217, 79, 4, 0.18));
      color: #0b5860;
      font-size: 1.1rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    .doctor-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .doctor-tile.active {
      background: linear-gradient(135deg, rgba(14, 123, 131, 0.12), rgba(10, 93, 101, 0.2));
      transform: translateY(-2px);
    }
    .doctor-tile span,
    .doctor-tile small {
      color: #5b6a70;
    }
    .doctor-tile em {
      margin-top: 2px;
      color: #0e7b83;
      font-size: 0.78rem;
      font-style: normal;
      font-weight: 700;
    }
    .swap-button {
      padding: 10px 14px;
      background: #112027;
      color: white;
      font-weight: 700;
      white-space: nowrap;
    }
    .consultation-fields {
      display: grid;
      gap: 14px;
      align-items: start;
    }
    .date-strip {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
      margin-bottom: 10px;
    }
    .date-strip button {
      min-width: 72px;
      display: grid;
      gap: 1px;
      text-align: center;
      padding: 10px 8px;
      background: #f6f1e8;
      color: #112027;
      font-weight: 700;
    }
    .date-strip button.active {
      background: linear-gradient(135deg, #112027, #183039);
      color: white;
    }
    .date-strip strong {
      font-size: 0.92rem;
    }
    .date-strip span {
      color: #5b6a70;
      font-size: 0.68rem;
      font-weight: 600;
    }
    .date-strip button.active span {
      color: rgba(255, 255, 255, 0.78);
    }
    .notes-field {
      display: grid;
      gap: 8px;
      margin-bottom: 14px;
      color: #112027;
      font-weight: 700;
    }
    textarea {
      width: 100%;
      min-height: 88px;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
      resize: vertical;
      box-sizing: border-box;
    }
    .notes-field small {
      color: #5b6a70;
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
    }
    .slot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
      gap: 8px;
    }
    .slot-grid button {
      display: grid;
      gap: 2px;
      text-align: center;
      min-height: 56px;
      padding: 10px 8px;
      background: #f6f1e8;
      color: #112027;
      font-weight: 700;
    }
    .slot-grid button.active {
      background: linear-gradient(135deg, #ff8e54, #d94f04);
      color: white;
      box-shadow: 0 12px 24px rgba(217, 79, 4, 0.24);
      transform: translateY(-2px);
    }
    .slot-grid button.active span {
      color: rgba(255, 255, 255, 0.82);
    }
    .slot-grid strong {
      font-size: 0.86rem;
      line-height: 1;
    }
    .slot-grid span {
      color: #5b6a70;
      font-size: 0.62rem;
      font-weight: 600;
      line-height: 1;
    }
    .empty-state {
      margin: 0;
      color: #5b6a70;
    }
    @media (max-width: 768px) {
      .patient-flow {
        gap: 14px;
      }
      .card {
        padding: 16px;
        border-radius: 22px;
      }
      .section-head {
        margin-bottom: 12px;
      }
      .section-head h3 {
        font-size: 1.25rem;
      }
      .selected-doctor-banner {
        display: grid;
        gap: 12px;
        padding: 12px;
        margin-bottom: 14px;
      }
      .consultation-fields {
        grid-template-columns: 1fr;
        gap: 0;
      }
      .doctor-grid {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 4px;
        scroll-snap-type: x proximity;
        margin-inline: -2px;
      }
      .doctor-tile {
        min-width: 250px;
        min-height: auto;
        padding: 14px;
        scroll-snap-align: start;
      }
      .doctor-avatar {
        width: 52px;
        height: 52px;
      }
      .swap-button {
        width: 100%;
      }
      input,
      textarea {
        font-size: 16px;
      }
      .slot-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `
})
export class PatientCarePanelComponent {
  readonly patientProfile = input<PatientProfileResponse | null>(null);
  readonly specialties = input<string[]>([]);
  readonly doctors = input<DoctorResponse[]>([]);
  readonly selectedDoctor = input<DoctorResponse | null>(null);
  readonly selectedDoctorSlots = input<AvailabilitySlotResponse[]>([]);
  readonly selectedSlotId = input<number | null>(null);
  readonly specialtyFilter = input.required<FormControl<string>>();
  readonly consultationReason = input.required<FormControl<string>>();
  readonly selectedDate = signal('');
  readonly showDoctorPicker = signal(false);
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
  readonly availableDates = computed(() => {
    const seen = new Set<string>();
    return this.selectedDoctorSlots()
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
  readonly slotsForSelectedDate = computed(() =>
    this.selectedDoctorSlots().filter(
      (slot) => this.localDateKeyFormatter.format(new Date(slot.startAt)) === this.selectedDate()
    )
  );

  readonly doctorSelected = output<DoctorResponse>();
  readonly slotBooked = output<AvailabilitySlotResponse>();

  selectDoctorFromPanel(doctor: DoctorResponse): void {
    this.showDoctorPicker.set(false);
    this.doctorSelected.emit(doctor);
  }

  handleSlotSelection(slot: AvailabilitySlotResponse): void {
    this.slotBooked.emit(slot);
  }

  specialtyLabel(value: string): string {
    return value === 'GERAL' || value === 'GENERALISTA' ? 'Generalista' : value;
  }

  constructor() {
    effect(() => {
      const dates = this.availableDates();
      const firstDate = dates[0]?.value ?? '';
      if (!firstDate) {
        this.selectedDate.set('');
        return;
      }
      if (!dates.some((dateOption) => dateOption.value === this.selectedDate())) {
        this.selectedDate.set(firstDate);
      }
    });

    effect(() => {
      if (this.selectedDoctor()) {
        this.showDoctorPicker.set(false);
      }
    });
  }
}
