import { CommonModule, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { AppointmentResponse, MedicalRecordResponse, Role } from '../../core/models';

@Component({
  selector: 'app-history-panel',
  imports: [CommonModule, DatePipe],
  template: `
    <section class="board">
      <article class="card">
        <h3>Consultas</h3>
        <div class="timeline">
          <div *ngFor="let appointment of appointments()" class="timeline-item">
            <strong>{{ appointment.scheduledAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
            <span>
              {{ role() === 'DOCTOR' ? appointment.patientName : appointment.doctorName }}
              · {{ appointment.status }} · sala {{ appointment.meetingRoomCode || 'a definir' }}
            </span>
          </div>
        </div>
      </article>

      <article class="card">
        <h3>Prontuários</h3>
        <div class="timeline">
          <div *ngFor="let record of medicalRecords()" class="timeline-item">
            <strong>{{ record.createdAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
            <span>{{ record.diagnosis || 'Sem diagnóstico' }}</span>
            <code>{{ record.prescription || 'Sem prescrição' }}</code>
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
    .timeline { display: grid; gap: 12px; }
    .timeline-item { padding: 14px 0; border-bottom: 1px solid rgba(17, 32, 39, 0.08); display: grid; gap: 6px; }
    span { display: block; color: #516268; }
    code {
      display: block;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f6f1e8;
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 0.84rem;
    }
    @media (max-width: 900px) { .board { grid-template-columns: 1fr; } }
  `
})
export class HistoryPanelComponent {
  readonly appointments = input<AppointmentResponse[]>([]);
  readonly medicalRecords = input<MedicalRecordResponse[]>([]);
  readonly role = input<Role | null>(null);
}

