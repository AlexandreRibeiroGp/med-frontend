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
                {{ patientPrescriptionStatus(record) }}
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
              <span class="helper-text">{{ doctorPrescriptionStatus(record) }}</span>
              <div class="actions">
                <button type="button" class="download" [disabled]="!record.hasPrescriptionFile" (click)="downloadPrescription(record)">
                  {{ record.hasPrescriptionFile ? 'Baixar PDF' : 'Sem PDF' }}
                </button>
                <button type="button" class="download secondary" (click)="generatePrescriptionPdf.emit(record.id)">
                  Gerar PDF
                </button>
                <button
                  *ngIf="record.requiresDigitalSignature && record.prescriptionSignatureStatus !== 'SIGNED'"
                  type="button"
                  class="download secondary"
                  (click)="startPrescriptionSignature.emit(record.id)"
                >
                  Assinar digitalmente
                </button>
              </div>
              <label *ngIf="record.requiresDigitalSignature && record.prescriptionSignatureStatus !== 'SIGNED'" class="upload-box compact">
                <span>Enviar PDF assinado pelo provedor ICP-Brasil</span>
                <input type="file" accept=".pdf" (change)="handleSignedFileChange(record.id, $event)" />
              </label>
            </ng-template>
          </div>
        </div>
      </article>

      <article class="card wide" *ngIf="role() === 'DOCTOR'">
        <h3>Emitir receita</h3>
        <form [formGroup]="recordForm()" (ngSubmit)="createRecord.emit()">
          <select formControlName="appointmentId">
            <option value="">Selecione a consulta</option>
            <option *ngFor="let appointment of appointments()" [value]="appointment.id">
              #{{ appointment.id }} - {{ appointment.patientName }}
            </option>
          </select>
          <textarea formControlName="diagnosis" placeholder="Observacao ou diagnostico (opcional)"></textarea>
          <textarea formControlName="prescription" placeholder="Texto da receita ou orientacoes ao paciente"></textarea>
          <textarea formControlName="clinicalNotes" placeholder="Observacoes clinicas internas (opcional)"></textarea>
          <label class="signature-checkbox">
            <input type="checkbox" formControlName="requiresDigitalSignature" />
            <span>Receita controlada ou com exigencia de assinatura ICP-Brasil</span>
          </label>
          <select *ngIf="recordForm().get('requiresDigitalSignature')?.value" formControlName="preferredCertificateType">
            <option value="A3">Certificado A3 no computador do medico</option>
            <option value="A1">Certificado A1 ou certificado em nuvem</option>
          </select>
          <small class="helper-text">O PDF sai com nome, endereco e profissao do paciente salvos no cadastro.</small>
          <button type="submit" class="upload">Salvar e emitir</button>
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
    .secondary {
      background: #f6f1e8;
      color: #112027;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
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
    .compact {
      margin-top: 10px;
      padding: 12px 14px;
    }
    .signature-checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #112027;
      font-weight: 600;
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
  readonly createRecord = output<void>();
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

  patientPrescriptionStatus(record: MedicalRecordResponse): string {
    if (!record.hasPrescriptionFile) {
      return 'Aguardando o medico gerar a receita.';
    }
    if (record.requiresDigitalSignature && record.prescriptionSignatureStatus !== 'SIGNED') {
      return 'Receita gerada e aguardando assinatura digital do medico.';
    }
    return 'Receita pronta para download.';
  }

  doctorPrescriptionStatus(record: MedicalRecordResponse): string {
    if (record.prescriptionSignatureStatus === 'SIGNED') {
      return `Receita assinada${record.prescriptionSignatureProvider ? ' via ' + record.prescriptionSignatureProvider : ''}.`;
    }
    if (record.prescriptionSignatureStatus === 'PENDING_PROVIDER') {
      return record.preferredCertificateType === 'A3'
        ? 'Assinatura A3 em andamento. O provedor deve abrir o seletor local do certificado do medico.'
        : 'Assinatura A1 em andamento no provedor ICP-Brasil.';
    }
    if (record.hasPrescriptionFile) {
      return `PDF da receita gerado e pronto para assinatura ${record.preferredCertificateType}.`;
    }
    return 'Nenhum PDF de receita gerado ainda.';
  }

  handleSignedFileChange(recordId: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.signedPrescriptionFileChanged.emit({ recordId, file: input?.files?.[0] ?? null });
  }
}
