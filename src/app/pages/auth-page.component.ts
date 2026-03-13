import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="shell">
      <aside class="panel intro">
        <a routerLink="/" class="back">Voltar</a>
        <p class="tag">Portal clínico</p>
        <h1>Conecte paciente, médico e administração no mesmo ambiente.</h1>
        <p>
          Use os formulários ao lado para entrar ou cadastrar novos perfis no backend Spring Boot.
        </p>
      </aside>

      <section class="panel forms">
        <div class="switcher">
          <button type="button" [class.active]="mode() === 'login'" (click)="mode.set('login')">Entrar</button>
          <button type="button" [class.active]="mode() === 'patient'" (click)="mode.set('patient')">Paciente</button>
          <button type="button" [class.active]="mode() === 'doctor'" (click)="mode.set('doctor')">Médico</button>
          <button type="button" [class.active]="mode() === 'admin'" (click)="mode.set('admin')">Administrador</button>
        </div>

        <p *ngIf="message()" class="message">{{ message() }}</p>
        <p *ngIf="error()" class="error">{{ error() }}</p>

        <form *ngIf="mode() === 'login'" [formGroup]="loginForm" (ngSubmit)="submitLogin()">
          <input formControlName="email" placeholder="E-mail" type="email" />
          <p *ngIf="controlError(loginForm, 'email') as error" class="field-error">{{ error }}</p>
          <input formControlName="password" placeholder="Senha" type="password" />
          <p *ngIf="controlError(loginForm, 'password') as error" class="field-error">{{ error }}</p>
          <button [disabled]="loading()" type="submit">Entrar</button>
        </form>

        <form *ngIf="mode() === 'patient'" [formGroup]="patientForm" (ngSubmit)="submitPatient()">
          <input formControlName="fullName" placeholder="Nome completo" />
          <p *ngIf="controlError(patientForm, 'fullName') as error" class="field-error">{{ error }}</p>
          <input formControlName="email" placeholder="E-mail" type="email" />
          <p *ngIf="controlError(patientForm, 'email') as error" class="field-error">{{ error }}</p>
          <input formControlName="password" placeholder="Senha" type="password" />
          <p *ngIf="controlError(patientForm, 'password') as error" class="field-error">{{ error }}</p>
          <input formControlName="phoneNumber" placeholder="Telefone" />
          <p *ngIf="controlError(patientForm, 'phoneNumber') as error" class="field-error">{{ error }}</p>
          <input formControlName="documentNumber" placeholder="Documento" />
          <p *ngIf="controlError(patientForm, 'documentNumber') as error" class="field-error">{{ error }}</p>
          <input formControlName="birthDate" placeholder="Nascimento" type="date" />
          <p *ngIf="controlError(patientForm, 'birthDate') as error" class="field-error">{{ error }}</p>
          <input formControlName="healthInsurance" placeholder="Convênio" />
          <p *ngIf="controlError(patientForm, 'healthInsurance') as error" class="field-error">{{ error }}</p>
          <button [disabled]="loading()" type="submit">Cadastrar paciente</button>
        </form>

        <form *ngIf="mode() === 'doctor'" [formGroup]="doctorForm" (ngSubmit)="submitDoctor()">
          <input formControlName="fullName" placeholder="Nome completo" />
          <p *ngIf="controlError(doctorForm, 'fullName') as error" class="field-error">{{ error }}</p>
          <input formControlName="email" placeholder="E-mail" type="email" />
          <p *ngIf="controlError(doctorForm, 'email') as error" class="field-error">{{ error }}</p>
          <input formControlName="password" placeholder="Senha" type="password" />
          <p *ngIf="controlError(doctorForm, 'password') as error" class="field-error">{{ error }}</p>
          <input formControlName="phoneNumber" placeholder="Telefone" />
          <p *ngIf="controlError(doctorForm, 'phoneNumber') as error" class="field-error">{{ error }}</p>
          <input formControlName="crm" placeholder="CRM" />
          <p *ngIf="controlError(doctorForm, 'crm') as error" class="field-error">{{ error }}</p>
          <input formControlName="specialty" placeholder="Especialidade" />
          <p *ngIf="controlError(doctorForm, 'specialty') as error" class="field-error">{{ error }}</p>
          <textarea formControlName="biography" placeholder="Biografia"></textarea>
          <p *ngIf="controlError(doctorForm, 'biography') as error" class="field-error">{{ error }}</p>
          <label class="check">
            <input formControlName="telemedicineEnabled" type="checkbox" />
            Telemedicina habilitada
          </label>
          <button [disabled]="loading()" type="submit">Cadastrar médico</button>
        </form>

        <form *ngIf="mode() === 'admin'" [formGroup]="adminForm" (ngSubmit)="submitAdmin()">
          <input formControlName="fullName" placeholder="Nome completo" />
          <p *ngIf="controlError(adminForm, 'fullName') as error" class="field-error">{{ error }}</p>
          <input formControlName="email" placeholder="E-mail" type="email" />
          <p *ngIf="controlError(adminForm, 'email') as error" class="field-error">{{ error }}</p>
          <input formControlName="password" placeholder="Senha" type="password" />
          <p *ngIf="controlError(adminForm, 'password') as error" class="field-error">{{ error }}</p>
          <input formControlName="phoneNumber" placeholder="Telefone" />
          <p *ngIf="controlError(adminForm, 'phoneNumber') as error" class="field-error">{{ error }}</p>
          <button [disabled]="loading()" type="submit">Cadastrar administrador</button>
        </form>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      min-height: 100vh;
      place-items: center;
      background:
        linear-gradient(135deg, rgba(14, 123, 131, 0.92), rgba(17, 32, 39, 0.96)),
        #112027;
      padding: 24px;
      font-family: "Segoe UI", sans-serif;
    }

    .shell {
      width: min(1100px, 100%);
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      background: rgba(250, 247, 240, 0.96);
      border-radius: 32px;
      overflow: hidden;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.22);
    }

    .panel {
      padding: 40px;
    }

    .intro {
      background: linear-gradient(180deg, rgba(255, 142, 84, 0.18), transparent 70%);
      color: #112027;
    }

    .back,
    .tag {
      color: #0e7b83;
      font-weight: 700;
      text-decoration: none;
    }

    h1 {
      font-size: clamp(2.1rem, 4vw, 4rem);
      line-height: 0.98;
      margin: 24px 0 16px;
    }

    .forms {
      background: #fff;
      display: grid;
      gap: 16px;
      align-content: start;
    }

    .switcher {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f4f0e8;
      padding: 8px;
      border-radius: 999px;
    }

    .switcher button,
    form button {
      border: 0;
      border-radius: 999px;
      font-weight: 700;
    }

    .switcher button {
      background: transparent;
      padding: 12px;
      color: #4c5d64;
    }

    .switcher button.active {
      background: #112027;
      color: #fff;
    }

    form {
      display: grid;
      gap: 12px;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid #d9dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      background: #fcfcfb;
    }

    textarea {
      min-height: 110px;
      resize: vertical;
    }

    form button {
      background: linear-gradient(135deg, #ff8e54, #d94f04);
      color: white;
      padding: 14px 18px;
    }

    .check {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #4c5d64;
    }

    .message,
    .error {
      border-radius: 16px;
      padding: 12px 14px;
      margin: 0;
    }

    .message {
      background: #e6f6f2;
      color: #0f684f;
    }

    .error {
      background: #ffe9e3;
      color: #a33b19;
    }

    .field-error {
      margin: -4px 2px 2px;
      color: #a33b19;
      font-size: 0.9rem;
      line-height: 1.35;
    }

    @media (max-width: 900px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .switcher {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `
})
export class AuthPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly api = inject(TelemedApiService);

  readonly mode = signal<'login' | 'patient' | 'doctor' | 'admin'>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly patientForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: [''],
    documentNumber: [''],
    birthDate: [''],
    healthInsurance: ['']
  });

  readonly doctorForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: [''],
    crm: ['', Validators.required],
    specialty: ['', Validators.required],
    biography: [''],
    telemedicineEnabled: [true]
  });

  readonly adminForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: [''],
    documentNumber: [''],
    birthDate: [''],
    healthInsurance: ['']
  });

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error.set('Revise os campos destacados antes de continuar.');
      return;
    }

    this.runRequest(this.authService.login(this.loginForm.getRawValue()), 'Login realizado com sucesso.', true);
  }

  submitPatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      this.error.set('Revise os campos destacados antes de continuar.');
      return;
    }

    this.runRequest(this.api.registerPatient(this.patientForm.getRawValue()), 'Paciente cadastrado com sucesso.');
  }

  submitDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.error.set('Revise os campos destacados antes de continuar.');
      return;
    }

    this.runRequest(this.api.registerDoctor(this.doctorForm.getRawValue()), 'Médico cadastrado com sucesso.');
  }

  submitAdmin(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      this.error.set('Revise os campos destacados antes de continuar.');
      return;
    }

    this.runRequest(this.api.registerAdmin(this.adminForm.getRawValue()), 'Administrador cadastrado com sucesso.');
  }

  controlError(form: { get(path: string): AbstractControl | null }, controlName: string): string {
    const control = form.get(controlName);
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo é obrigatório.';
    }
    if (control.errors['email']) {
      return 'Informe um e-mail válido.';
    }
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength as number;
      return `Informe pelo menos ${requiredLength} caracteres.`;
    }

    return 'Verifique o valor informado.';
  }

  private runRequest(request$: Observable<unknown>, success: string, redirect = false): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    request$
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message.set(success);
          if (redirect) {
            this.router.navigateByUrl('/dashboard');
            return;
          }
          this.mode.set('login');
        },
        error: (error: { error?: { message?: string } }) => {
          this.error.set(error.error?.message ?? 'Não foi possível concluir a operação.');
        }
      });
  }
}
