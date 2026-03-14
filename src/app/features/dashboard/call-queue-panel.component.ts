import { CommonModule, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AppointmentResponse, Role } from '../../core/models';

@Component({
  selector: 'app-call-queue-panel',
  imports: [CommonModule, DatePipe],
  template: `
    <article class="card">
      <h3>Consultas com sala</h3>
      <div class="timeline">
        <div *ngFor="let appointment of appointments()" class="timeline-item appointment-line">
          <strong>{{ role() === 'DOCTOR' ? appointment.patientName : appointment.doctorName }}</strong>
          <span>{{ appointment.scheduledAt | date: 'dd/MM HH:mm' }}</span>
          <button type="button" class="call-link" [disabled]="!canJoinAppointment()(appointment)" (click)="joinRequested.emit(appointment)">
            {{ canJoinAppointment()(appointment) ? 'Entrar na sala' : joinAvailabilityLabel()(appointment) }}
          </button>
        </div>
      </div>
    </article>
  `,
  styles: `
    .card {
      padding: 22px;
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }
    .timeline { display: grid; gap: 12px; }
    .timeline-item { padding: 14px 0; border-bottom: 1px solid rgba(17, 32, 39, 0.08); display: grid; gap: 6px; }
    .appointment-line { align-items: start; }
    span { display: block; color: #516268; }
    .call-link {
      border: 0;
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      background: #f6f1e8;
      color: #112027;
      text-align: left;
    }
    .call-link[disabled] { cursor: not-allowed; opacity: 0.55; }
  `
})
export class CallQueuePanelComponent {
  readonly appointments = input<AppointmentResponse[]>([]);
  readonly role = input<Role | null>(null);
  readonly canJoinAppointment = input.required<(appointment: AppointmentResponse) => boolean>();
  readonly joinAvailabilityLabel = input.required<(appointment: AppointmentResponse) => string>();

  readonly joinRequested = output<AppointmentResponse>();
}
