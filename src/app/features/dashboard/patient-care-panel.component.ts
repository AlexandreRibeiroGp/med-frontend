import { CommonModule, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AvailabilitySlotResponse, DoctorResponse, PatientProfileResponse } from '../../core/models';

@Component({
  selector: 'app-patient-care-panel',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="board patient-board">
      <article class="card">
        <h3>Meu perfil</h3>
        <p *ngIf="patientProfile() as profile">Convenio: {{ profile.healthInsurance || 'Nao informado' }}</p>
        <p *ngIf="patientProfile() as profile">Documento: {{ profile.documentNumber || 'Nao informado' }}</p>
        <p *ngIf="patientProfile() as profile">Nascimento: {{ profile.birthDate || 'Nao informado' }}</p>
      </article>

      <article class="card">
        <h3>Buscar medicos</h3>
        <div class="toolbar">
          <select [formControl]="specialtyFilter()">
            <option value="">Todas as especialidades</option>
            <option *ngFor="let specialty of specialties()" [value]="specialty">{{ specialty }}</option>
          </select>
          <button type="button" (click)="refreshDoctors.emit()">Atualizar</button>
        </div>
        <div class="list doctor-list">
          <button type="button" class="doctor" *ngFor="let doctor of doctors()" (click)="doctorSelected.emit(doctor)">
            <strong>{{ doctor.user.fullName }}</strong>
            <span>{{ doctor.specialty }}</span>
          </button>
        </div>
      </article>

      <article class="card wide" *ngIf="selectedDoctor() as doctor">
        <h3>Agendar com {{ doctor.user.fullName }}</h3>
        <p class="muted">{{ doctor.biography || 'Sem biografia cadastrada.' }}</p>
        <div class="list slots">
          <button type="button" *ngFor="let slot of selectedDoctorSlots()" (click)="slotBooked.emit(slot)">
            {{ slot.startAt | date: 'dd/MM HH:mm' }} - {{ slot.endAt | date: 'HH:mm' }}
          </button>
        </div>
      </article>
    </section>
  `,
  styles: `
    .board,
    .patient-board {
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
    .toolbar, .list { display: grid; gap: 12px; }
    .toolbar { grid-template-columns: 1fr auto; }
    .doctor-list { max-height: 320px; overflow: auto; }
    .doctor, .slots button, .toolbar button {
      padding: 14px 16px;
      border: 0;
      border-radius: 16px;
      background: #f6f1e8;
      color: #112027;
      text-align: left;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .toolbar button { background: linear-gradient(135deg, #0e7b83, #0a5d65); color: white; }
    select {
      width: 100%;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
    }
    .muted, .doctor span { color: #5b6a70; }
    @media (max-width: 900px) { .board, .patient-board { grid-template-columns: 1fr; } }
  `
})
export class PatientCarePanelComponent {
  readonly patientProfile = input<PatientProfileResponse | null>(null);
  readonly specialties = input<string[]>([]);
  readonly doctors = input<DoctorResponse[]>([]);
  readonly selectedDoctor = input<DoctorResponse | null>(null);
  readonly selectedDoctorSlots = input<AvailabilitySlotResponse[]>([]);
  readonly specialtyFilter = input.required<FormControl<string>>();

  readonly refreshDoctors = output<void>();
  readonly doctorSelected = output<DoctorResponse>();
  readonly slotBooked = output<AvailabilitySlotResponse>();
}
