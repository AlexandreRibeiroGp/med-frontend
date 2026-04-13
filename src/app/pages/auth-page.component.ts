import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { composeAddress } from '../core/address-form';
import { AuthService } from '../core/auth.service';
import { LegalDocumentResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';
import { AnalyticsService } from '../core/analytics.service';

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
            <p>Crie sua conta e avance para um atendimento online em um fluxo claro e organizado.</p>
          </div>

          <div class="price-banner">
            <span>Consulta online</span>
            <strong>R$ 49,90</strong>
            <small>Confirme sua reserva para seguir com o atendimento.</small>
          </div>

        <div class="assurance-strip">
          <span>MedCallOn</span>
          <span>Profissionais com CRM</span>
          <span>Atendimento por plataforma propria</span>
        </div>

        <div class="switcher">
          <button type="button" [class.active]="mode() === 'login'" (click)="openLoginMode()">Entrar</button>
          <button type="button" [class.active]="mode() === 'patient'" (click)="openPatientSignup()">Criar conta</button>
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
            <p>Preencha seus dados para seguir com mais confianca para o pagamento e para a consulta.</p>
          </div>
          <div class="trust-banner">
            <strong>Antes de continuar</strong>
            <p>
              O cadastro existe para proteger seus dados, organizar seus documentos e agilizar sua entrada na consulta.
            </p>
          </div>

          <section class="form-section">
            <div class="section-copy">
              <h3>Dados de acesso</h3>
              <p>Esses dados serao usados para entrar na plataforma e acompanhar sua jornada.</p>
            </div>
            <input formControlName="fullName" placeholder="Nome completo" />
            <p *ngIf="controlError(patientForm, 'fullName') as error" class="field-error">{{ error }}</p>
            <input formControlName="email" placeholder="E-mail" type="email" />
            <p *ngIf="controlError(patientForm, 'email') as error" class="field-error">{{ error }}</p>
            <input formControlName="password" placeholder="Senha" type="password" />
            <p *ngIf="controlError(patientForm, 'password') as error" class="field-error">{{ error }}</p>
          </section>

          <section class="form-section">
            <div class="section-copy">
              <h3>Informacoes pessoais</h3>
              <p>Esses campos ajudam a identificar corretamente o paciente e deixam o atendimento mais fluido.</p>
            </div>
            <div class="form-grid two-columns">
              <input formControlName="phoneNumber" placeholder="Telefone" />
              <input formControlName="documentNumber" placeholder="CPF" />
              <input formControlName="birthDate" placeholder="Nascimento" type="date" />
              <input formControlName="profession" placeholder="Profissao" />
            </div>
          </section>

          <section class="form-section">
            <div class="section-copy">
              <h3>Endereco</h3>
              <p>Preencha na ordem mais comum para manter o cadastro claro e evitar retrabalho depois.</p>
            </div>
            <div class="form-grid two-columns">
              <input formControlName="postalCode" placeholder="CEP" />
              <input formControlName="street" placeholder="Rua" />
              <input formControlName="number" placeholder="Numero" />
              <input formControlName="complement" placeholder="Complemento" />
              <input formControlName="neighborhood" placeholder="Bairro" />
              <input formControlName="city" placeholder="Cidade" />
              <input formControlName="state" placeholder="Estado" class="full-width" />
            </div>
          </section>

          <div class="checkout-summary">
            <strong>Resumo antes do pagamento</strong>
            <ul>
              <li>Consulta online por R$ 49,90</li>
              <li>Fluxo direto para confirmar o atendimento</li>
              <li>Acesso pela plataforma da MedCallOn</li>
            </ul>
          </div>

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
          <p class="helper-text">Seus dados ajudam a agilizar o atendimento, manter sua jornada organizada e liberar o Pix com menos friccao.</p>
        </form>

        <div class="legal-links">
          <a routerLink="/legal/privacidade">Politica de Privacidade</a>
          <a routerLink="/legal/termos">Termos de Uso</a>
          <a routerLink="/legal/cookies">Politica de Cookies</a>
        </div>
      </section>

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
      width: min(760px, 100%);
      margin: 0 auto;
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
    .showcase-tag {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.74rem;
      font-weight: 800;
    }

    .price-banner span {
      color: #0b7480;
    }

    .price-banner strong {
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1;
    }

    .price-banner small {
      color: #5d6d73;
      line-height: 1.45;
    }

    .assurance-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .assurance-strip span {
      padding: 9px 12px;
      border-radius: 999px;
      background: #f7fbfb;
      border: 1px solid rgba(17, 32, 39, 0.08);
      color: #4c6168;
      font-size: 0.88rem;
      font-weight: 700;
    }

    .journey-steps {
      display: grid;
      gap: 10px;
    }

    .journey-steps article,
    .trust-banner,
    .checkout-summary {
      padding: 16px 18px;
      border-radius: 20px;
      background: #fbfdfd;
      border: 1px solid rgba(17, 32, 39, 0.08);
    }

    .journey-steps strong,
    .trust-banner strong,
    .checkout-summary strong {
      display: block;
      margin-bottom: 6px;
      color: #112027;
    }

    .journey-steps p,
    .trust-banner p {
      margin: 0;
      color: #5d6d73;
      line-height: 1.5;
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

    .form-section {
      display: grid;
      gap: 10px;
      padding: 6px 0 2px;
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
    .helper-text {
      margin: 0;
      line-height: 1.5;
    }

    .section-copy {
      display: grid;
      gap: 4px;
      padding-top: 4px;
    }

    .section-copy h3 {
      margin: 0;
      font-size: 1rem;
      color: #112027;
    }

    .section-copy p {
      margin: 0;
      color: #5d6d73;
      line-height: 1.45;
      font-size: 0.92rem;
    }

    .form-grid {
      display: grid;
      gap: 10px;
    }

    .form-grid.two-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .full-width {
      grid-column: 1 / -1;
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

    .checkout-summary ul {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
      color: #4c6168;
      line-height: 1.5;
      font-weight: 700;
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

    @media (max-width: 980px) {
      .shell {
        width: min(760px, 100%);
      }
    }

    @media (max-width: 900px) {
      :host {
        padding: 12px;
        place-items: start;
      }

      .shell {
        width: 100%;
      }

      .brand-logo {
        height: 64px;
        width: calc(100% + 16px);
        margin-inline: -8px;
      }

      .forms {
        gap: 12px;
        padding: 18px 14px;
        border-radius: 22px;
      }

      .hero-copy h1 {
        font-size: 1.35rem;
      }

      .hero-copy p,
      .section-copy p,
      .helper-text {
        font-size: 0.9rem;
      }

      .price-banner {
        padding: 14px 16px;
      }

      .price-banner strong {
        font-size: 2.3rem;
      }

      .assurance-strip {
        gap: 8px;
      }

      .assurance-strip span {
        font-size: 0.82rem;
        padding: 8px 10px;
      }

      .trust-banner,
      .checkout-summary {
        padding: 14px 16px;
      }

      .trust-banner p,
      .checkout-summary ul {
        font-size: 0.9rem;
      }

      .section-copy p,
      .helper-text {
        display: none;
      }

      .form-grid.two-columns {
        grid-template-columns: 1fr;
      }

      .full-width {
        grid-column: auto;
      }

      input {
        padding: 12px 14px;
        border-radius: 14px;
      }

      .switcher {
        padding: 6px;
      }

      .switcher button,
      form button {
        min-height: 46px;
      }

      .legal-links {
        gap: 10px;
        padding-bottom: 8px;
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
  private readonly analytics = inject(AnalyticsService);

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
    postalCode: [''],
    street: [''],
    number: [''],
    complement: [''],
    neighborhood: [''],
    city: [''],
    state: ['']
  });
  readonly termsConsentControl = this.fb.nonNullable.control(false, Validators.requiredTrue);
  readonly telemedicineConsentControl = this.fb.nonNullable.control(false, Validators.requiredTrue);

  constructor() {
    this.analytics.trackOnce('auth_view', 'auth_page_view', {
      mode: 'login'
    });

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

    this.analytics.track('login_submit');
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

    const raw = this.patientForm.getRawValue();
    this.analytics.track('signup_submit');
    this.runRequest(
      this.api.registerPatient({
        fullName: raw.fullName,
        email: raw.email,
        password: raw.password,
        phoneNumber: raw.phoneNumber || null,
        documentNumber: raw.documentNumber || null,
        birthDate: raw.birthDate || null,
        profession: raw.profession || null,
        address: composeAddress(raw),
        acceptedDocumentIds,
        acceptedTelemedicine: true
      }),
      'Paciente cadastrado com sucesso.',
      false,
      'patient-signup'
    );
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.setError('Revise os campos destacados antes de continuar.');
      return;
    }

    this.analytics.track('forgot_password_submit');
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

    this.analytics.track('reset_password_submit');
    this.runRequest(
      this.authService.resetPassword({
        token,
        newPassword: this.resetPasswordForm.getRawValue().newPassword
      }),
      'Senha redefinida com sucesso.'
    );
  }

  openLoginMode(): void {
    this.mode.set('login');
    this.error.set('');
    this.message.set('');
    this.analytics.track('auth_mode_login');
  }

  openPatientSignup(): void {
    this.mode.set('patient');
    this.error.set('');
    this.message.set('');
    this.analytics.track('auth_mode_signup');
  }

  openForgotPassword(): void {
    this.mode.set('forgot');
    this.error.set('');
    this.message.set('');
    this.analytics.track('forgot_password_open');
  }

  backToLogin(): void {
    this.mode.set('login');
    this.error.set('');
    this.message.set('');
    this.analytics.track('auth_back_to_login');
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

  private runRequest(
    request$: Observable<unknown>,
    success: string,
    redirect = false,
    conversionType: 'patient-signup' | null = null
  ): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    request$
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (conversionType === 'patient-signup') {
            this.trackPatientSignupConversion();
          }
          this.setMessage(success);
          if (redirect) {
            void this.router.navigateByUrl('/dashboard');
            return;
          }
          this.mode.set('login');
          this.loginForm.reset();
          this.forgotPasswordForm.reset();
          this.resetPasswordForm.reset();
          this.patientForm.reset();
          this.termsConsentControl.reset(false);
          this.telemedicineConsentControl.reset(false);
          void this.router.navigate([], { queryParams: {}, replaceUrl: true });
        },
        error: (error: { error?: { message?: string } }) => {
          const apiMessage = error.error?.message?.trim();
          if (apiMessage && /bad credentials/i.test(apiMessage)) {
            this.setError('E-mail ou senha incorretos.');
            return;
          }

          this.setError(apiMessage ?? 'Nao foi possivel concluir a operacao.');
        }
      });
  }

  private trackPatientSignupConversion(): void {
    this.analytics.track('signup_complete');
    const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (!gtag) {
      return;
    }

    gtag('event', 'conversion', {
      send_to: 'AW-18059561380/FqVMCPGx25ccEKSTvKND'
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

