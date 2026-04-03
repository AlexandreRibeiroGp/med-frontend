import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AvailabilitySlotResponse, DoctorResponse, PatientProfileResponse } from '../../core/models';

@Component({
  selector: 'app-patient-care-panel',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="patient-flow">
      <article class="card doctor-card">
        <div class="section-head">
          <p class="eyebrow">Medicos disponiveis</p>
          <h3>Escolha um medico com horario aberto</h3>
          <p class="price-note">Consulta por Pix: <strong>R$ 49,90</strong></p>
        </div>

        <div class="doctor-grid" *ngIf="doctors().length; else emptyDoctors">
          <button
            type="button"
            class="doctor-tile"
            [class.active]="selectedDoctor()?.id === doctor.id"
            *ngFor="let doctor of doctors()"
            (click)="doctorSelected.emit(doctor)"
          >
            <div class="doctor-tile-header">
              <div class="doctor-avatar">
                <img *ngIf="doctor.profilePhotoUrl; else doctorInitial" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
                <ng-template #doctorInitial>{{ doctor.user.fullName.charAt(0) }}</ng-template>
              </div>
              <div class="doctor-text">
                <strong>{{ doctor.user.fullName }}</strong>
                <span>{{ specialtyLabel(doctor.specialty) }}</span>
                <small>{{ doctor.crm }}</small>
              </div>
            </div>
          </button>
        </div>
      </article>

      <article class="card schedule-card" *ngIf="selectedDoctor() as doctor">
        <div class="section-head">
          <p class="eyebrow">Agendamento</p>
          <h3>Descreva o atendimento e escolha o horário</h3>
          <p class="price-note">Valor da consulta: <strong>R$ 49,90</strong></p>
        </div>

        <label class="notes-field">
          <span>Profissao</span>
          <input [formControl]="patientOccupation()" placeholder="Informe sua profissao" />
          <small>Esse dado sera enviado para o medico junto com o agendamento.</small>
        </label>

        <label class="notes-field">
          <span>Motivo da consulta</span>
          <textarea
            [formControl]="consultationReason()"
            placeholder="Descreva o problema, sintomas ou o motivo da consulta"
          ></textarea>
          <small>Esse texto será enviado junto com o agendamento para o médico.</small>
        </label>

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
            [disabled]="!canBookSlot()"
            (click)="slotBooked.emit(slot)"
          >
            <strong>{{ slot.startAt | date: 'HH:mm' }}</strong>
            <span>{{ slot.endAt | date: 'HH:mm' }}</span>
          </button>
        </div>

        <p class="helper-text" *ngIf="!canBookSlot()">
          Informe sua profissao e o motivo da consulta para liberar a escolha do horario.
        </p>
      </article>
    </section>

    <ng-template #emptyDoctors>
      <p class="empty-state">Nenhum medico com horario aberto no momento.</p>
    </ng-template>

    <ng-template #emptySlots>
      <p class="empty-state">Esse médico ainda não publicou horários disponíveis.</p>
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
    .slot-grid button {
      padding: 12px 14px;
      border: 0;
      border-radius: 14px;
      background: #f6f1e8;
      color: #112027;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    input {
      width: 100%;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
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
      margin-bottom: 16px;
      color: #112027;
      font-weight: 700;
    }
    textarea {
      width: 100%;
      min-height: 110px;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
      resize: vertical;
      box-sizing: border-box;
    }
    .notes-field small,
    .helper-text {
      color: #5b6a70;
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
    }
    .slot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
      gap: 6px;
    }
    .slot-grid button {
      display: grid;
      gap: 2px;
      text-align: center;
      min-height: 52px;
      padding: 9px 6px;
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
  readonly patientOccupation = input.required<FormControl<string>>();
  readonly selectedDate = signal('');
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

  specialtyLabel(value: string): string {
    return value === 'GERAL' ? 'Geral' : value;
  }

  canBookSlot(): boolean {
    return !this.patientOccupation().invalid && !this.consultationReason().invalid;
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
  }
}
