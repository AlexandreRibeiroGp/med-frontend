import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { LegalDocumentResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="shell">
      <section class="panel forms">
        <a routerLink="/" class="back">Voltar</a>
        <img src="/medcallon.png" alt="MedCallOn" class="brand-logo" />
        <div class="hero-copy">
          <p class="tag">Portal clinico</p>
          <h1>Entre ou crie sua conta</h1>
          <p>Acesse consultas, agenda e acompanhamento em um so lugar.</p>
        </div>

        <div class="price-banner">
          <span>Consulta online</span>
          <strong>R$ 49,90</strong>
          <small>Pagamento por Pix para liberar o atendimento.</small>
        </div>

        <div class="switcher">
          <button type="button" [class.active]="mode() === 'login'" (click)="mode.set('login')">Entrar</button>
          <button type="button" [class.active]="mode() === 'patient'" (click)="mode.set('patient')">Criar conta</button>
        </div>

        <p *ngIf="message()" class="message">{{ message() }}</p>
        <p *ngIf="error()" class="error">{{ error() }}</p>

        <form *ngIf="mode() === 'login'" [formGroup]="loginForm" (ngSubmit)="submitLogin()">
          <div class="form-copy">
            <h2>Acesse sua conta</h2>
          </div>
          <input formControlName="email" placeholder="E-mail" type="email" />
          <p *ngIf="controlError(loginForm, 'email') as error" class="field-error">{{ error }}</p>
          <input formControlName="password" placeholder="Senha" type="password" />
          <p *ngIf="controlError(loginForm, 'password') as error" class="field-error">{{ error }}</p>
          <button [disabled]="loading()" type="submit">Entrar</button>
          <button type="button" class="text-link" (click)="openForgotPassword()">Esqueci minha senha</button>
          <p class="helper-text">Se voce e medico, use o e-mail e a senha cadastrados pela administracao da clinica.</p>
        </form>

        <form *ngIf="mode() === 'forgot'" [formGroup]="forgotPasswordForm" (ngSubmit)="submitForgotPassword()">
          <div class="form-copy">
            <h2>Recuperar senha</h2>
            <p>Informe seu e-mail para receber o link de redefinicao.</p>
          </div>
          <input formControlName="email" placeholder="E-mail" type="email" />
          <p *ngIf="controlError(forgotPasswordForm, 'email') as error" class="field-error">{{ error }}</p>
          <button [disabled]="loading()" type="submit">Enviar link</button>
          <button type="button" class="text-link" (click)="backToLogin()">Voltar ao login</button>
        </form>

        <form *ngIf="mode() === 'reset'" [formGroup]="resetPasswordForm" (ngSubmit)="submitResetPassword()">
          <div class="form-copy">
            <h2>Redefinir senha</h2>
            <p>Crie uma nova senha para entrar no sistema.</p>
          </div>
          <input formControlName="newPassword" placeholder="Nova senha" type="password" />
          <p *ngIf="controlError(resetPasswordForm, 'newPassword') as error" class="field-error">{{ error }}</p>
          <input formControlName="confirmPassword" placeholder="Confirmar nova senha" type="password" />
          <p *ngIf="controlError(resetPasswordForm, 'confirmPassword') as error" class="field-error">{{ error }}</p>
          <p *ngIf="passwordConfirmationError()" class="field-error">{{ passwordConfirmationError() }}</p>
          <button [disabled]="loading()" type="submit">Redefinir senha</button>
          <button type="button" class="text-link" (click)="backToLogin()">Voltar ao login</button>
        </form>

        <form *ngIf="mode() === 'patient'" [formGroup]="patientForm" (ngSubmit)="submitPatient()">
          <div class="form-copy">
            <h2>Crie sua conta de paciente</h2>
            <p>Preencha seus dados para agendar consultas e acompanhar seu atendimento com facilidade.</p>
          </div>
          <input formControlName="fullName" placeholder="Nome completo" />
          <p *ngIf="controlError(patientForm, 'fullName') as error" class="field-error">{{ error }}</p>
          <input formControlName="email" placeholder="E-mail" type="email" />
          <p *ngIf="controlError(patientForm, 'email') as error" class="field-error">{{ error }}</p>
          <input formControlName="password" placeholder="Senha" type="password" />
          <p *ngIf="controlError(patientForm, 'password') as error" class="field-error">{{ error }}</p>
          <input formControlName="phoneNumber" placeholder="Telefone" />
          <input formControlName="documentNumber" placeholder="CPF" />
          <input formControlName="birthDate" placeholder="Nascimento" type="date" />
          <input formControlName="profession" placeholder="Profissao" />
          <input formControlName="address" placeholder="Endereco completo: rua, numero, complemento e CEP" />
          <label class="checkbox-line">
            <input type="checkbox" [formControl]="termsConsentControl" />
            <span>
              Li e aceito os
              <a routerLink="/legal/termos">Termos de Uso</a>
              e a
              <a routerLink="/legal/privacidade">Politica de Privacidade</a>.
            </span>
          </label>
          <p *ngIf="termsConsentControl.touched && termsConsentControl.invalid" class="field-error">
            O aceite dos documentos legais e obrigatorio.
          </p>
          <label class="checkbox-line">
            <input type="checkbox" [formControl]="telemedicineConsentControl" />
            <span>Concordo com atendimento por telemedicina, quando aplicavel, e com o registro em prontuario eletronico.</span>
          </label>
          <p *ngIf="telemedicineConsentControl.touched && telemedicineConsentControl.invalid" class="field-error">
            O consentimento para telemedicina e obrigatorio para cadastro e atendimento remoto.
          </p>
          <button [disabled]="loading()" type="submit">Cadastrar paciente</button>
          <p class="helper-text">Seus dados ajudam a personalizar o atendimento e agilizar o contato com o medico.</p>
        </form>

        <div class="legal-links">
          <a routerLink="/legal/privacidade">Politica de Privacidade</a>
          <a routerLink="/legal/termos">Termos de Uso</a>
          <a routerLink="/legal/cookies">Politica de Cookies</a>
        </div>
      </section>

      <aside class="panel showcase">
        <p class="showcase-tag">Atendimento online</p>
        <h2>Comece sua consulta sem sair de casa.</h2>
        <p class="showcase-copy">
          Entre no portal, escolha o atendimento e siga com pagamento por Pix para liberar a jornada com o medico.
        </p>

        <div class="showcase-price">
          <span>Consulta a partir de</span>
          <strong>R$ 49,90</strong>
          <small>Valor pensado para um fluxo rapido de conversao.</small>
        </div>

        <div class="showcase-points">
          <article>
            <strong>24h</strong>
            <p>Portal pronto para receber pacientes a qualquer hora.</p>
          </article>
          <article>
            <strong>Pix</strong>
            <p>Pagamento simples para seguir direto ao atendimento.</p>
          </article>
          <article>
            <strong>Online</strong>
            <p>Agenda, documentos e acompanhamento em um unico ambiente.</p>
          </article>
        </div>
      </aside>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      min-height: 100vh;
      place-items: center;
      background:
        radial-gradient(circle at top left, rgba(74, 208, 214, 0.26), transparent 22%),
        radial-gradient(circle at right center, rgba(255, 147, 70, 0.18), transparent 24%),
        linear-gradient(135deg, #0b5f68 0%, #0f3f49 45%, #102830 100%);
      padding: 24px;
      font-family: 'Segoe UI', sans-serif;
    }

    .shell {
      width: min(1180px, 100%);
      display: grid;
      grid-template-columns: minmax(0, 540px) minmax(320px, 1fr);
      gap: 24px;
      align-items: stretch;
    }

    .panel {
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 28px 70px rgba(3, 17, 23, 0.28);
      backdrop-filter: blur(18px);
    }

    .forms {
      display: grid;
      gap: 14px;
      padding: 28px;
      background: rgba(255, 253, 249, 0.94);
    }

    .showcase {
      padding: 36px;
      background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 28%),
        linear-gradient(145deg, rgba(29, 190, 196, 0.96), rgba(18, 89, 122, 0.96));
      color: white;
      display: grid;
      align-content: space-between;
      gap: 22px;
    }

    .back,
    .tag {
      color: #0b7480;
      font-weight: 700;
      text-decoration: none;
    }

    .brand-logo {
      height: 96px;
      width: calc(100% + 32px);
      max-width: none;
      margin-inline: -16px;
      display: block;
      object-fit: contain;
      justify-self: center;
    }

    .hero-copy {
      display: grid;
      gap: 6px;
      text-align: center;
    }

    .hero-copy h1,
    .showcase h2,
    .form-copy h2 {
      margin: 0;
      line-height: 1.02;
      letter-spacing: -0.03em;
    }

    .hero-copy h1 {
      font-size: clamp(1.7rem, 3vw, 2.3rem);
    }

    .hero-copy p {
      margin: 0;
      color: #5d6d73;
      line-height: 1.45;
    }

    .price-banner {
      display: grid;
      gap: 6px;
      padding: 16px 18px;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(29, 190, 196, 0.12), rgba(255, 142, 84, 0.16));
      border: 1px solid rgba(17, 32, 39, 0.08);
    }

    .price-banner span,
    .showcase-tag,
    .showcase-price span {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.74rem;
      font-weight: 800;
    }

    .price-banner span {
      color: #0b7480;
    }

    .price-banner strong,
    .showcase-price strong {
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1;
    }

    .price-banner small {
      color: #5d6d73;
      line-height: 1.45;
    }

    .switcher {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      background: #f1ece3;
      padding: 8px;
      border-radius: 999px;
      box-shadow: inset 0 0 0 1px rgba(17, 32, 39, 0.05);
    }

    .switcher button,
    form button {
      border: 0;
      border-radius: 999px;
      font-weight: 700;
    }

    .switcher button {
      background: transparent;
      padding: 11px;
      color: #4c5d64;
    }

    .switcher button.active {
      background: linear-gradient(135deg, #112027, #183742);
      color: #fff;
      box-shadow: 0 10px 22px rgba(17, 32, 39, 0.18);
    }

    form {
      display: grid;
      gap: 10px;
      padding: 4px 0 0;
    }

    .form-copy {
      display: grid;
      gap: 4px;
      margin-bottom: 2px;
    }

    .form-copy h2 {
      font-size: 1.35rem;
      color: #112027;
      text-align: center;
    }

    .form-copy p,
    .helper-text,
    .showcase-copy,
    .showcase-points p,
    .showcase-price small {
      margin: 0;
      line-height: 1.5;
    }

    .form-copy p,
    .helper-text {
      color: #5d6d73;
    }

    input {
      width: 100%;
      border: 1px solid #d9dfdf;
      border-radius: 16px;
      padding: 13px 15px;
      font: inherit;
      background: #fcfcfb;
      box-sizing: border-box;
      transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
    }

    input:focus {
      outline: none;
      border-color: rgba(14, 123, 131, 0.55);
      box-shadow: 0 0 0 4px rgba(14, 123, 131, 0.12);
      transform: translateY(-1px);
    }

    form button {
      background: linear-gradient(135deg, #ff8e54, #d94f04);
      color: white;
      padding: 13px 18px;
      font-size: 0.98rem;
      box-shadow: 0 14px 30px rgba(217, 79, 4, 0.22);
      cursor: pointer;
    }

    .text-link {
      background: transparent;
      color: #0b7480;
      box-shadow: none;
      padding: 4px 0 0;
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
      font-size: 0.84rem;
      line-height: 1.25;
    }

    .checkbox-line {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
      color: #51636b;
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .checkbox-line input {
      margin-top: 3px;
      width: 18px;
      height: 18px;
      padding: 0;
      border-radius: 6px;
    }

    .checkbox-line a {
      color: #0b7480;
      font-weight: 700;
      text-decoration: none;
    }

    .legal-links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      padding-top: 6px;
    }

    .legal-links a {
      color: #0b7480;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .showcase-tag,
    .showcase-price span {
      color: rgba(255, 255, 255, 0.78);
    }

    .showcase h2 {
      font-size: clamp(2.2rem, 4vw, 3.6rem);
      max-width: 9ch;
    }

    .showcase-copy {
      max-width: 34ch;
      color: rgba(255, 255, 255, 0.86);
    }

    .showcase-price {
      display: grid;
      gap: 8px;
      padding: 22px;
      border-radius: 26px;
      background: rgba(10, 28, 39, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .showcase-points {
      display: grid;
      gap: 12px;
    }

    .showcase-points article {
      padding: 18px 20px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .showcase-points strong {
      display: block;
      margin-bottom: 6px;
      font-size: 1.1rem;
    }

    @media (max-width: 980px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .showcase {
        order: -1;
      }
    }

    @media (max-width: 900px) {
      .brand-logo {
        height: 76px;
        width: calc(100% + 16px);
        margin-inline: -8px;
      }

      .forms,
      .showcase {
        padding: 22px 18px;
      }

      .hero-copy h1 {
        font-size: 1.45rem;
      }
    }
  `
})
export class AuthPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly api = inject(TelemedApiService);

  readonly mode = signal<'login' | 'patient' | 'forgot' | 'reset'>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly resetToken = signal('');
  readonly legalDocuments = signal<LegalDocumentResponse[]>([]);
  private errorTimer: number | null = null;
  private messageTimer: number | null = null;

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly resetPasswordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly patientForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: [''],
    documentNumber: [''],
    birthDate: [''],
    profession: [''],
    address: ['']
  });
  readonly termsConsentControl = this.fb.nonNullable.control(false, Validators.requiredTrue);
  readonly telemedicineConsentControl = this.fb.nonNullable.control(false, Validators.requiredTrue);

  constructor() {
    this.api.getPublicLegalDocuments().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (documents) => this.legalDocuments.set(documents),
      error: () => this.setError('Nao foi possivel carregar os documentos legais atuais.')
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const token = params.get('token')?.trim() ?? '';
      this.resetToken.set(token);
      if (token) {
        this.mode.set('reset');
        this.error.set('');
        this.message.set('');
        return;
      }

      if (this.mode() === 'reset') {
        this.mode.set('login');
      }
    });
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.setError('Revise os campos destacados antes de continuar.');
      return;
    }

    this.runRequest(this.authService.login(this.loginForm.getRawValue()), 'Login realizado com sucesso.', true);
  }

  submitPatient(): void {
    if (this.patientForm.invalid || this.termsConsentControl.invalid || this.telemedicineConsentControl.invalid) {
      this.patientForm.markAllAsTouched();
      this.termsConsentControl.markAsTouched();
      this.telemedicineConsentControl.markAsTouched();
      this.setError('Revise os campos destacados antes de continuar.');
      return;
    }

    const acceptedDocumentIds = this.requiredLegalDocumentIds();
    if (acceptedDocumentIds.length < 2) {
      this.setError('Os documentos legais ativos ainda nao foram carregados. Tente novamente em instantes.');
      return;
    }

    this.runRequest(
      this.api.registerPatient({
        ...this.patientForm.getRawValue(),
        acceptedDocumentIds,
        acceptedTelemedicine: true
      }),
      'Paciente cadastrado com sucesso.'
    );
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.setError('Revise os campos destacados antes de continuar.');
      return;
    }

    this.runRequest(
      this.authService.forgotPassword(this.forgotPasswordForm.getRawValue()),
      'Se o e-mail estiver cadastrado, enviaremos as instrucoes de recuperacao.'
    );
  }

  submitResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.setError('Revise os campos destacados antes de continuar.');
      return;
    }

    if (this.passwordConfirmationError()) {
      this.setError('As senhas informadas precisam ser iguais.');
      return;
    }

    const token = this.resetToken();
    if (!token) {
      this.setError('Token de redefinicao invalido.');
      return;
    }

    this.runRequest(
      this.authService.resetPassword({
        token,
        newPassword: this.resetPasswordForm.getRawValue().newPassword
      }),
      'Senha redefinida com sucesso.'
    );
  }

  openForgotPassword(): void {
    this.mode.set('forgot');
    this.error.set('');
    this.message.set('');
  }

  backToLogin(): void {
    this.mode.set('login');
    this.error.set('');
    this.message.set('');
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  passwordConfirmationError(): string {
    const { newPassword, confirmPassword } = this.resetPasswordForm.getRawValue();
    if (!confirmPassword || !newPassword || newPassword === confirmPassword) {
      return '';
    }

    return 'As senhas informadas precisam ser iguais.';
  }

  private requiredLegalDocumentIds(): number[] {
    return this.legalDocuments()
      .filter((document) => document.documentType === 'TERMS_OF_USE' || document.documentType === 'PRIVACY_POLICY')
      .map((document) => document.id);
  }

  controlError(form: { get(path: string): AbstractControl | null }, controlName: string): string {
    const control = form.get(controlName);
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo e obrigatorio.';
    }
    if (control.errors['email']) {
      return 'Informe um e-mail valido.';
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
          this.setMessage(success);
          if (redirect) {
            void this.router.navigateByUrl('/dashboard');
            return;
          }
          this.mode.set('login');
          this.loginForm.reset();
          this.forgotPasswordForm.reset();
          this.resetPasswordForm.reset();
          this.termsConsentControl.reset(false);
          this.telemedicineConsentControl.reset(false);
          void this.router.navigate([], { queryParams: {}, replaceUrl: true });
        },
        error: (error: { error?: { message?: string } }) => {
          this.setError(error.error?.message ?? 'Nao foi possivel concluir a operacao.');
        }
      });
  }

  private setError(message: string): void {
    this.error.set(message);
    if (this.errorTimer !== null) {
      window.clearTimeout(this.errorTimer);
    }
    this.errorTimer = window.setTimeout(() => this.error.set(''), 3000);
  }

  private setMessage(message: string): void {
    this.message.set(message);
    if (this.messageTimer !== null) {
      window.clearTimeout(this.messageTimer);
    }
    this.messageTimer = window.setTimeout(() => this.message.set(''), 3000);
  }
}
