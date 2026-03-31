import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppointmentResponse, MedicalRecordResponse, Role } from '../../core/models';
import { TelemedApiService } from '../../core/telemed-api.service';

@Component({
  selector: 'app-history-panel',
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  template: `
    <section class="board">
      <article class="card">
        <h3>Consultas</h3>
        <div class="timeline">
          <div *ngFor="let appointment of appointments()" class="timeline-item">
            <strong>{{ appointment.scheduledAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
            <span>
              {{ role() === 'DOCTOR' ? appointment.patientName : appointment.doctorName }}
              · {{ appointmentStatusLabel(appointment.status) }}
            </span>
            <span class="helper-text" *ngIf="appointment.notes">Motivo: {{ appointment.notes }}</span>
          </div>
        </div>
      </article>

      <article class="card">
        <h3>{{ role() === 'PATIENT' ? 'Receitas disponiveis' : 'Receitas enviadas' }}</h3>
        <div class="timeline" *ngIf="medicalRecords().length; else emptyState">
          <div *ngFor="let record of medicalRecords()" class="timeline-item">
            <strong>{{ record.createdAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
            <span>{{ role() === 'DOCTOR' ? record.patientName : record.doctorName }}</span>

            <ng-container *ngIf="role() === 'PATIENT'; else doctorView">
              <span class="helper-text">
                {{ record.hasPrescriptionFile ? 'Receita pronta para download.' : 'Aguardando o medico anexar a receita.' }}
              </span>
              <button
                type="button"
                class="download"
                [disabled]="!record.hasPrescriptionFile"
                (click)="downloadPrescription(record)"
              >
                {{ record.hasPrescriptionFile ? 'Baixar receita' : 'Sem receita disponivel' }}
              </button>
            </ng-container>

            <ng-template #doctorView>
              <span class="helper-text">{{ record.hasPrescriptionFile ? 'Receita anexada com sucesso.' : 'Nenhuma receita anexada ainda.' }}</span>
            </ng-template>
          </div>
        </div>
      </article>

      <article class="card wide" *ngIf="role() === 'DOCTOR'">
        <h3>Upload de receita</h3>
        <form [formGroup]="recordForm()" (ngSubmit)="createRecord.emit()">
          <select formControlName="appointmentId">
            <option value="">Selecione a consulta</option>
            <option *ngFor="let appointment of appointments()" [value]="appointment.id">
              #{{ appointment.id }} - {{ appointment.patientName }}
            </option>
          </select>
          <textarea formControlName="diagnosis" placeholder="Observacao ou diagnostico (opcional)"></textarea>
          <label class="upload-box">
            <span>Arquivo da receita</span>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" (change)="handleFileChange($event)" />
            <small>{{ prescriptionFileName() || 'Selecione um PDF ou imagem para salvar no banco e liberar o download.' }}</small>
          </label>
          <button type="submit" class="upload">Salvar receita</button>
        </form>
      </article>
    </section>

    <ng-template #emptyState>
      <p class="empty-state">Nenhum documento emitido ate o momento.</p>
    </ng-template>
  `,
  styles: `
    .board {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    .wide {
      grid-column: 1 / -1;
    }
    .card {
      padding: 22px;
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }
    .timeline { display: grid; gap: 12px; }
    .timeline-item { padding: 14px 0; border-bottom: 1px solid rgba(17, 32, 39, 0.08); display: grid; gap: 8px; }
    span { display: block; color: #516268; }
    .helper-text {
      font-size: 0.92rem;
    }
    .download {
      width: fit-content;
      border: 0;
      border-radius: 14px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
      color: white;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    form {
      display: grid;
      gap: 12px;
    }
    select, textarea {
      width: 100%;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
    }
    textarea {
      min-height: 96px;
      resize: vertical;
    }
    .upload-box {
      border: 1px dashed #d8dfdf;
      border-radius: 20px;
      padding: 14px 16px;
      background: #fff;
      display: grid;
      gap: 8px;
    }
    .upload {
      width: fit-content;
      border: 0;
      border-radius: 14px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
      color: white;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .download[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .empty-state {
      margin: 0;
      color: #516268;
    }
    @media (max-width: 900px) { .board { grid-template-columns: 1fr; } }
  `
})
export class HistoryPanelComponent {
  private readonly api = inject(TelemedApiService);

  readonly appointments = input<AppointmentResponse[]>([]);
  readonly medicalRecords = input<MedicalRecordResponse[]>([]);
  readonly role = input<Role | null>(null);
  readonly recordForm = input.required<FormGroup>();
  readonly prescriptionFileName = input('');
  readonly createRecord = output<void>();
  readonly prescriptionFileChanged = output<File | null>();

  readonly appointmentStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'agendada';
      case 'CONFIRMED':
        return 'confirmada';
      case 'IN_PROGRESS':
        return 'em andamento';
      case 'COMPLETED':
        return 'encerrada';
      case 'CANCELLED':
        return 'cancelada';
      default:
        return status;
    }
  };

  downloadPrescription(record: MedicalRecordResponse): void {
    if (!record.hasPrescriptionFile) {
      return;
    }

    this.api.downloadPrescription(record.id).subscribe((response) => {
      const blob = response.body;
      if (!blob) {
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = record.prescriptionFileName || 'receita';
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.prescriptionFileChanged.emit(input?.files?.[0] ?? null);
  }
}
