import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DoctorResponse, PatientProfileResponse, Role } from '../../core/models';

@Component({
  selector: 'app-profile-panel',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="board">
      <article class="card" *ngIf="role() === 'PATIENT'; else doctorProfileBlock">
        <h3>Meu perfil</h3>
        <p class="helper">Atualize seus dados para facilitar o atendimento e o agendamento.</p>
        <form [formGroup]="patientForm()" (ngSubmit)="savePatient.emit()">
          <div class="grid">
            <label>
              <span>Nome completo</span>
              <input formControlName="fullName" type="text" />
            </label>

            <label>
              <span>Telefone</span>
              <input formControlName="phoneNumber" type="tel" />
            </label>

            <label>
              <span>E-mail</span>
              <input [value]="patientProfile()?.user?.email ?? ''" type="email" readonly />
            </label>

            <label>
              <span>Documento</span>
              <input [value]="patientProfile()?.documentNumber ?? ''" type="text" readonly />
            </label>

            <label>
              <span>Convenio</span>
              <input formControlName="healthInsurance" type="text" />
            </label>

            <label>
              <span>Profissao</span>
              <input formControlName="profession" type="text" />
            </label>

            <label class="full">
              <span>Endereco</span>
              <input formControlName="address" type="text" />
            </label>
          </div>

          <button type="submit">Salvar perfil</button>
        </form>
      </article>

      <ng-template #doctorProfileBlock>
        <article class="card">
          <h3>Meu perfil profissional</h3>
          <p class="helper">Mantenha sua ficha atualizada para os pacientes e para a sua agenda.</p>
          <form [formGroup]="doctorForm()" (ngSubmit)="saveDoctor.emit()">
            <div class="grid">
              <label>
                <span>Nome completo</span>
                <input formControlName="fullName" type="text" />
              </label>

              <label>
                <span>Telefone</span>
                <input formControlName="phoneNumber" type="tel" />
              </label>

              <label>
                <span>E-mail</span>
                <input [value]="doctorProfile()?.user?.email ?? ''" type="email" readonly />
              </label>

              <label>
                <span>CRM</span>
                <input [value]="doctorProfile()?.crm ?? ''" type="text" readonly />
              </label>

              <label>
                <span>Especialidade</span>
                <input [value]="doctorProfile()?.specialty ?? ''" type="text" readonly />
              </label>

              <label class="toggle">
                <span>Telemedicina ativa</span>
                <input formControlName="telemedicineEnabled" type="checkbox" />
              </label>

              <label class="full">
                <span>Biografia</span>
                <textarea formControlName="biography" rows="5"></textarea>
              </label>
            </div>

            <button type="submit">Salvar perfil</button>
          </form>
        </article>
      </ng-template>
    </section>
  `,
  styles: `
    .board {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
    }
    .card {
      padding: 22px;
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }
    h3 {
      margin: 0 0 8px;
      font-size: 1.6rem;
    }
    .helper {
      margin: 0 0 18px;
      color: #516268;
    }
    form {
      display: grid;
      gap: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .full {
      grid-column: 1 / -1;
    }
    label {
      display: grid;
      gap: 8px;
    }
    label span {
      color: #516268;
      font-size: 0.9rem;
      font-weight: 700;
    }
    input, textarea {
      width: 100%;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
      font: inherit;
      box-sizing: border-box;
    }
    input[readonly] {
      background: #f4f0e8;
      color: #667980;
    }
    .toggle {
      align-content: start;
    }
    .toggle input {
      width: 22px;
      height: 22px;
      padding: 0;
    }
    button {
      border: 0;
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      color: white;
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
      justify-self: start;
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .full {
        grid-column: auto;
      }
    }
  `
})
export class ProfilePanelComponent {
  readonly role = input.required<Role>();
  readonly patientProfile = input<PatientProfileResponse | null>(null);
  readonly doctorProfile = input<DoctorResponse | null>(null);
  readonly patientForm = input.required<FormGroup>();
  readonly doctorForm = input.required<FormGroup>();

  readonly savePatient = output<void>();
  readonly saveDoctor = output<void>();
}
