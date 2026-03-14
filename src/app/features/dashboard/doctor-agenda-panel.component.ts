import { CommonModule, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AppointmentResponse, AvailabilitySlotResponse } from '../../core/models';

@Component({
  selector: 'app-doctor-agenda-panel',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="board">
      <article class="card">
        <h3>Gerar horarios do dia</h3>
        <form [formGroup]="availabilityForm()" (ngSubmit)="createAvailability.emit()">
          <input formControlName="startAt" type="datetime-local" />
          <input formControlName="endAt" type="datetime-local" />
          <p class="helper">O sistema divide o intervalo em horarios de 15 minutos para os pacientes.</p>
          <button type="submit">Gerar horarios</button>
        </form>
      </article>

      <article class="card">
        <h3>Minha agenda aberta</h3>
        <div class="timeline compact">
          <div *ngFor="let slot of availability()" class="timeline-item">
            <strong>{{ slot.startAt | date: 'dd/MM HH:mm' }}</strong>
            <span>ate {{ slot.endAt | date: 'HH:mm' }}</span>
          </div>
        </div>
      </article>

      <article class="card wide">
        <h3>Emitir prontuario</h3>
        <form [formGroup]="recordForm()" (ngSubmit)="createRecord.emit()">
          <select formControlName="appointmentId">
            <option value="">Selecione a consulta</option>
            <option *ngFor="let appointment of appointments()" [value]="appointment.id">
              #{{ appointment.id }} - {{ appointment.patientName }}
            </option>
          </select>
          <textarea formControlName="symptoms" placeholder="Sintomas"></textarea>
          <textarea formControlName="diagnosis" placeholder="Diagnostico"></textarea>
          <textarea formControlName="prescription" placeholder="Prescricao"></textarea>
          <textarea formControlName="clinicalNotes" placeholder="Notas clinicas"></textarea>
          <button type="submit">Salvar prontuario</button>
        </form>
      </article>
    </section>
  `,
  styles: `
    .board {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    .card {
      padding: 22px;
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }
    .wide { grid-column: 1 / -1; }
    .timeline, form { display: grid; gap: 12px; }
    .helper { margin: 0; color: #516268; font-size: 0.95rem; }
    .timeline-item { padding: 14px 0; border-bottom: 1px solid rgba(17, 32, 39, 0.08); display: grid; gap: 6px; }
    .compact { max-height: 360px; overflow: auto; }
    input, select, textarea {
      width: 100%;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
    }
    textarea { min-height: 96px; resize: vertical; }
    button {
      border: 0;
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
      color: white;
    }
    span { color: #516268; }
    @media (max-width: 900px) { .board { grid-template-columns: 1fr; } }
  `
})
export class DoctorAgendaPanelComponent {
  readonly availabilityForm = input.required<FormGroup>();
  readonly recordForm = input.required<FormGroup>();
  readonly availability = input<AvailabilitySlotResponse[]>([]);
  readonly appointments = input<AppointmentResponse[]>([]);

  readonly createAvailability = output<void>();
  readonly createRecord = output<void>();
}
