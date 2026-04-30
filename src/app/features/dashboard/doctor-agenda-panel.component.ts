import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AvailabilitySlotResponse } from '../../core/models';

interface CalendarCell {
  iso: string;
  label: number;
  currentMonth: boolean;
  today: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-doctor-agenda-panel',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="board">
      <article class="card">
        <h3>Gerar horários do dia</h3>
        <form [formGroup]="availabilityForm()" (ngSubmit)="createAvailability.emit()">
          <div class="availability-grid">
            <div class="full">
              <span class="field-label">Dia</span>
              <div class="calendar-shell">
                <div class="calendar-header">
                  <button type="button" class="nav-button" (click)="changeGenerateMonth(-1)">&lt;</button>
                  <strong>{{ monthLabel(generateMonth()) }}</strong>
                  <button type="button" class="nav-button" (click)="changeGenerateMonth(1)">&gt;</button>
                </div>
                <div class="weekdays">
                  <span *ngFor="let weekday of weekdays">{{ weekday }}</span>
                </div>
                <div class="calendar-grid">
                  <button
                    *ngFor="let day of generateCalendarDays()"
                    type="button"
                    class="day"
                    [class.outside]="!day.currentMonth"
                    [class.today]="day.today"
                    [class.selected]="day.selected"
                    (click)="selectAvailabilityDate(day.iso)"
                  >
                    {{ day.label }}
                  </button>
                </div>
              </div>
            </div>

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
          <button type="submit">Gerar horários</button>
        </form>
      </article>

      <article class="card">
        <h3>Fechar horários por intervalo</h3>
        <form [formGroup]="deleteRangeForm()" (ngSubmit)="removeAvailabilityRange.emit()">
          <div class="availability-grid">
            <div class="full">
              <span class="field-label">Dia</span>
              <div class="calendar-shell">
                <div class="calendar-header">
                  <button type="button" class="nav-button" (click)="changeDeleteMonth(-1)">&lt;</button>
                  <strong>{{ monthLabel(deleteMonth()) }}</strong>
                  <button type="button" class="nav-button" (click)="changeDeleteMonth(1)">&gt;</button>
                </div>
                <div class="weekdays">
                  <span *ngFor="let weekday of weekdays">{{ weekday }}</span>
                </div>
                <div class="calendar-grid">
                  <button
                    *ngFor="let day of deleteCalendarDays()"
                    type="button"
                    class="day"
                    [class.outside]="!day.currentMonth"
                    [class.today]="day.today"
                    [class.selected]="day.selected"
                    (click)="selectDeleteDate(day.iso)"
                  >
                    {{ day.label }}
                  </button>
                </div>
              </div>
            </div>

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

      <article class="card full-width">
        <h3>Minha agenda aberta</h3>
        <div class="timeline compact">
          <div *ngFor="let slot of availability()" class="timeline-item">
            <div class="timeline-main">
              <strong>{{ slot.startAt | date: 'dd/MM HH:mm' }}</strong>
              <span>até {{ slot.endAt | date: 'HH:mm' }}</span>
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
    .full-width {
      grid-column: 1 / -1;
    }
    .timeline, form { display: grid; gap: 12px; }
    .availability-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .full { grid-column: 1 / -1; }
    label, .full {
      display: grid;
      gap: 8px;
    }
    label span, .field-label {
      color: #516268;
      font-size: 0.9rem;
      font-weight: 700;
    }
    .calendar-shell {
      border: 1px solid #d8dfdf;
      border-radius: 20px;
      background: white;
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .nav-button {
      width: 40px;
      height: 40px;
      padding: 0;
      border-radius: 999px;
      background: #f4f0e8;
      color: #112027;
    }
    .weekdays, .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 6px;
    }
    .weekdays span {
      text-align: center;
      font-size: 0.8rem;
      color: #667980;
      font-weight: 700;
    }
    .day {
      border: 0;
      border-radius: 12px;
      min-height: 40px;
      padding: 0;
      background: #f8f4ec;
      color: #112027;
      font-weight: 700;
    }
    .day.outside {
      opacity: 0.45;
    }
    .day.today {
      outline: 2px solid rgba(14, 123, 131, 0.35);
    }
    .day.selected {
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
      color: white;
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
    select {
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
      .full, .full-width { grid-column: auto; }
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
  readonly weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  readonly generateMonth = signal(this.resolveInitialMonth(null));
  readonly deleteMonth = signal(this.resolveInitialMonth(null));
  readonly generateCalendarDays = computed(() =>
    this.buildCalendarDays(this.generateMonth(), this.availabilityForm().get('date')?.value ?? '')
  );
  readonly deleteCalendarDays = computed(() =>
    this.buildCalendarDays(this.deleteMonth(), this.deleteRangeForm().get('date')?.value ?? '')
  );

  selectAvailabilityDate(iso: string): void {
    this.availabilityForm().patchValue({ date: iso });
    this.generateMonth.set(this.resolveInitialMonth(iso));
  }

  selectDeleteDate(iso: string): void {
    this.deleteRangeForm().patchValue({ date: iso });
    this.deleteMonth.set(this.resolveInitialMonth(iso));
  }

  changeGenerateMonth(delta: number): void {
    this.generateMonth.set(this.shiftMonth(this.generateMonth(), delta));
  }

  changeDeleteMonth(delta: number): void {
    this.deleteMonth.set(this.shiftMonth(this.deleteMonth(), delta));
  }

  monthLabel(month: Date): string {
    return month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  private resolveInitialMonth(value: unknown): Date {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private shiftMonth(current: Date, delta: number): Date {
    return new Date(current.getFullYear(), current.getMonth() + delta, 1);
  }

  private buildCalendarDays(month: Date, selectedIso: string): CalendarCell[] {
    const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - startOffset);
    const todayIso = this.toIsoDate(new Date());

    return Array.from({ length: 42 }, (_, index) => {
      const current = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const iso = this.toIsoDate(current);
      return {
        iso,
        label: current.getDate(),
        currentMonth: current.getMonth() === month.getMonth(),
        today: iso === todayIso,
        selected: iso === selectedIso
      };
    });
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}



