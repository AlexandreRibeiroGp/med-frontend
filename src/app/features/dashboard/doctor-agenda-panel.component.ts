import { CommonModule, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AvailabilitySlotResponse } from '../../core/models';

@Component({
  selector: 'app-doctor-agenda-panel',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="board">
      <article class="card">
        <h3>Gerar horarios do dia</h3>
        <form [formGroup]="availabilityForm()" (ngSubmit)="createAvailability.emit()">
          <div class="availability-grid">
            <label class="full">
              <span>Dia</span>
              <input formControlName="date" type="date" />
            </label>

            <label>
              <span>Hora inicial</span>
              <div class="time-pair">
                <select formControlName="startHour">
                  <option *ngFor="let hour of hourOptions" [value]="hour">{{ hour }}</option>
                </select>
                <select formControlName="startMinute">
                  <option *ngFor="let minute of minuteOptions" [value]="minute">{{ minute }}</option>
                </select>
              </div>
            </label>

            <label>
              <span>Hora final</span>
              <div class="time-pair">
                <select formControlName="endHour">
                  <option *ngFor="let hour of hourOptions" [value]="hour">{{ hour }}</option>
                </select>
                <select formControlName="endMinute">
                  <option *ngFor="let minute of minuteOptions" [value]="minute">{{ minute }}</option>
                </select>
              </div>
            </label>
          </div>
          <p class="helper">Os minutos seguem blocos de 15 em 15 para os pacientes.</p>
          <button type="submit">Gerar horarios</button>
        </form>
      </article>

      <article class="card">
        <h3>Fechar horarios por intervalo</h3>
        <form [formGroup]="deleteRangeForm()" (ngSubmit)="removeAvailabilityRange.emit()">
          <div class="availability-grid">
            <label class="full">
              <span>Dia</span>
              <input formControlName="date" type="date" />
            </label>

            <label>
              <span>Hora inicial</span>
              <div class="time-pair">
                <select formControlName="startHour">
                  <option *ngFor="let hour of hourOptions" [value]="hour">{{ hour }}</option>
                </select>
                <select formControlName="startMinute">
                  <option *ngFor="let minute of minuteOptions" [value]="minute">{{ minute }}</option>
                </select>
              </div>
            </label>

            <label>
              <span>Hora final</span>
              <div class="time-pair">
                <select formControlName="endHour">
                  <option *ngFor="let hour of hourOptions" [value]="hour">{{ hour }}</option>
                </select>
                <select formControlName="endMinute">
                  <option *ngFor="let minute of minuteOptions" [value]="minute">{{ minute }}</option>
                </select>
              </div>
            </label>
          </div>
          <button type="submit" class="danger-fill">Excluir intervalo</button>
        </form>
      </article>

      <article class="card">
        <h3>Minha agenda aberta</h3>
        <div class="timeline compact">
          <div *ngFor="let slot of availability()" class="timeline-item">
            <div class="timeline-main">
              <strong>{{ slot.startAt | date: 'dd/MM HH:mm' }}</strong>
              <span>ate {{ slot.endAt | date: 'HH:mm' }}</span>
            </div>
            <button type="button" class="danger" (click)="removeAvailability.emit(slot.id)">Excluir</button>
          </div>
        </div>
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
    .timeline, form { display: grid; gap: 12px; }
    .availability-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .full { grid-column: 1 / -1; }
    label {
      display: grid;
      gap: 8px;
    }
    label span {
      color: #516268;
      font-size: 0.9rem;
      font-weight: 700;
    }
    .time-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .helper { margin: 0; color: #516268; font-size: 0.95rem; }
    .timeline-item {
      padding: 12px 0;
      border-bottom: 1px solid rgba(17, 32, 39, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .timeline-main {
      display: grid;
      gap: 4px;
    }
    .compact { max-height: 360px; overflow: auto; }
    input, select, textarea {
      width: 100%;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
    }
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
    .danger {
      width: auto;
      background: #ffe9e3;
      color: #a33b19;
      padding: 10px 14px;
      flex: 0 0 auto;
    }
    .danger-fill {
      background: linear-gradient(135deg, #ff8e54, #d94f04);
    }
    span { color: #516268; }
    @media (max-width: 900px) {
      .board { grid-template-columns: 1fr; }
      .availability-grid { grid-template-columns: 1fr; }
      .full { grid-column: auto; }
    }
  `
})
export class DoctorAgendaPanelComponent {
  readonly availabilityForm = input.required<FormGroup>();
  readonly deleteRangeForm = input.required<FormGroup>();
  readonly availability = input<AvailabilitySlotResponse[]>([]);

  readonly createAvailability = output<void>();
  readonly removeAvailabilityRange = output<void>();
  readonly removeAvailability = output<number>();

  readonly hourOptions = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'));
  readonly minuteOptions = ['00', '15', '30', '45'];
}
