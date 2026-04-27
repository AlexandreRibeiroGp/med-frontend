import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppointmentResponse, MedicalRecordResponse, PatientProfileResponse, Role } from '../../core/models';
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
            <span>{{ role() === 'DOCTOR' ? appointment.patientName : appointment.doctorName }} · {{ appointmentStatusLabel(appointment.status) }}</span>
            <span class="helper-text" *ngIf="appointment.notes">Motivo: {{ appointment.notes }}</span>
          </div>
        </div>
      </article>

      <article class="card">
        <h3>{{ role() === 'PATIENT' ? 'Receitas disponíveis' : 'Receitas enviadas' }}</h3>
        <div class="timeline" *ngIf="medicalRecords().length; else emptyState">
          <div *ngFor="let record of medicalRecords()" class="timeline-item">
            <strong>{{ record.createdAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
            <span>{{ role() === 'DOCTOR' ? record.patientName : record.doctorName }}</span>
            <span class="helper-text">{{ role() === 'DOCTOR' ? doctorPrescriptionStatus(record) : patientPrescriptionStatus(record) }}</span>
            <button
              type="button"
              class="download"
              [disabled]="!hasAccessiblePrescription(record)"
              (click)="openPrescription(record)"
            >
              {{ prescriptionActionLabel(record) }}
            </button>
          </div>
        </div>
      </article>

      <article class="card wide" *ngIf="role() === 'DOCTOR'">
        <h3>Salvar documento</h3>
        <form [formGroup]="recordForm()">
          <select formControlName="appointmentId" (change)="appointmentSelected.emit(selectedAppointmentId())">
            <option value="">Selecione a consulta</option>
            <option *ngFor="let appointment of appointments()" [value]="appointment.id">
              #{{ appointment.id }} - {{ appointment.patientName }}
            </option>
          </select>

          <div class="patient-card" *ngIf="selectedPatientProfile() as patient">
            <strong>Dados do paciente</strong>
            <div class="patient-grid">
              <span><strong>Nome:</strong> {{ patient.user.fullName }}</span>
              <span><strong>E-mail:</strong> {{ patient.user.email }}</span>
              <span><strong>Telefone:</strong> {{ patient.user.phoneNumber || 'Não informado' }}</span>
              <span><strong>Documento:</strong> {{ patient.documentNumber || 'Não informado' }}</span>
              <span><strong>Nascimento:</strong> {{ patient.birthDate ? (patient.birthDate | date: 'dd/MM/yyyy') : 'Não informado' }}</span>
              <span><strong>Convênio:</strong> {{ patient.healthInsurance || 'Não informado' }}</span>
              <span><strong>Profissão:</strong> {{ patient.profession || 'Não informado' }}</span>
              <span class="full-row"><strong>Endereço:</strong> {{ patient.address || 'Não informado' }}</span>
            </div>
          </div>

          <div class="form-section">
            <label class="section-label" for="prescription-link">Link da receita</label>
            <textarea id="prescription-link" formControlName="prescription" placeholder="Cole aqui o link da receita para o paciente"></textarea>
            <small class="helper-text">O paciente verá esse link na aba de documentos.</small>
            <button type="button" class="upload" (click)="savePrescriptionLink.emit()">Enviar link</button>
          </div>

          <div class="form-section">
            <label class="section-label" for="clinical-notes">Prontuário clínico</label>
            <textarea id="clinical-notes" formControlName="clinicalNotes" placeholder="Digite aqui o prontuário da consulta"></textarea>
            <button type="button" class="upload secondary" (click)="saveClinicalNotes.emit()">Salvar prontuário</button>
          </div>
        </form>
      </article>
    </section>

    <ng-template #emptyState>
      <p class="empty-state">Nenhum documento emitido até o momento.</p>
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
    .patient-card {
      border-radius: 20px;
      border: 1px solid rgba(17, 32, 39, 0.08);
      background: #f8faf8;
      padding: 16px 18px;
      display: grid;
      gap: 12px;
    }
    .patient-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 18px;
    }
    .full-row {
      grid-column: 1 / -1;
    }
    .form-section {
      display: grid;
      gap: 10px;
      padding-top: 4px;
    }
    .section-label {
      font-weight: 700;
      color: #112027;
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
    .upload.secondary {
      background: linear-gradient(135deg, #1d6f75, #0e7b83);
    }
    .download[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .empty-state {
      margin: 0;
      color: #516268;
    }
    @media (max-width: 900px) {
      .board { grid-template-columns: 1fr; }
      .patient-grid { grid-template-columns: 1fr; }
    }
  `
})
export class HistoryPanelComponent {
  private readonly api = inject(TelemedApiService);

  readonly appointments = input<AppointmentResponse[]>([]);
  readonly medicalRecords = input<MedicalRecordResponse[]>([]);
  readonly role = input<Role | null>(null);
  readonly recordForm = input.required<FormGroup>();
  readonly selectedPatientProfile = input<PatientProfileResponse | null>(null);
  readonly appointmentSelected = output<number | null>();
  readonly savePrescriptionLink = output<void>();
  readonly saveClinicalNotes = output<void>();
  readonly generatePrescriptionPdf = output<number>();
  readonly startPrescriptionSignature = output<number>();
  readonly signedPrescriptionFileChanged = output<{ recordId: number; file: File | null }>();

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

  readonly selectedAppointmentId = (): number | null => {
    const value = this.recordForm().get('appointmentId')?.value;
    if (!value) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  openPrescription(record: MedicalRecordResponse): void {
    const prescriptionLink = this.extractPrescriptionLink(record);
    if (prescriptionLink) {
      window.open(prescriptionLink, '_blank', 'noopener,noreferrer');
      return;
    }

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

  patientPrescriptionStatus(record: MedicalRecordResponse): string {
    if (this.extractPrescriptionLink(record)) {
      return 'Receita disponível por link.';
    }
    if (!record.hasPrescriptionFile) {
      return 'Aguardando o médico gerar a receita.';
    }
    return 'Receita pronta para download.';
  }

  doctorPrescriptionStatus(record: MedicalRecordResponse): string {
    if (this.extractPrescriptionLink(record)) {
      return 'Link da receita salvo e disponível para o paciente.';
    }
    if (record.hasPrescriptionFile) {
      return 'PDF da receita disponível para download.';
    }
    return 'Nenhuma receita salva ainda.';
  }

  hasAccessiblePrescription(record: MedicalRecordResponse): boolean {
    return !!this.extractPrescriptionLink(record) || record.hasPrescriptionFile;
  }

  prescriptionActionLabel(record: MedicalRecordResponse): string {
    if (this.extractPrescriptionLink(record)) {
      return 'Abrir receita';
    }
    return record.hasPrescriptionFile ? 'Baixar receita' : 'Sem receita disponível';
  }

  handleSignedFileChange(recordId: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.signedPrescriptionFileChanged.emit({ recordId, file: input?.files?.[0] ?? null });
  }

  private extractPrescriptionLink(record: MedicalRecordResponse): string | null {
    const value = record.prescription?.trim() ?? '';
    if (!value) {
      return null;
    }

    return value.startsWith('http://') || value.startsWith('https://') ? value : null;
  }
}
