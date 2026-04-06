import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { DoctorResponse, DoctorSpecialty, LegalDocumentResponse, LegalDocumentType, UserResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-admin-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page" *ngIf="auth.isOwner(); else denied">
      <header>
        <div>
          <p class="eyebrow">Gestao interna</p>
          <h1>Cadastros internos</h1>
          <p>Somente o seu usuario pode cadastrar medicos e administradores.</p>
        </div>
        <a routerLink="/dashboard">Voltar ao painel</a>
      </header>

      <p *ngIf="message()" class="message">{{ message() }}</p>
      <p *ngIf="error()" class="error">{{ error() }}</p>

      <section class="grid">
        <article class="card">
          <h2>Cadastrar medico</h2>
          <form [formGroup]="doctorForm" (ngSubmit)="submitDoctor()">
            <input formControlName="fullName" placeholder="Nome completo" />
            <input formControlName="email" type="email" placeholder="E-mail" />
            <input formControlName="password" type="password" placeholder="Senha" />
            <input formControlName="phoneNumber" placeholder="Telefone" />
            <input formControlName="crm" placeholder="CRM" />
            <select formControlName="specialty">
              <option *ngFor="let specialty of specialtyOptions" [value]="specialty">{{ specialtyLabel(specialty) }}</option>
            </select>
            <textarea formControlName="biography" placeholder="Biografia"></textarea>
            <label class="upload-field">
              <span>Foto do medico</span>
              <input type="file" accept="image/*" (change)="onDoctorPhotoSelected($event)" />
              <small *ngIf="doctorPhotoName()">{{ doctorPhotoName() }}</small>
            </label>
            <label class="check">
              <input formControlName="telemedicineEnabled" type="checkbox" />
              Telemedicina habilitada
            </label>
            <button [disabled]="loading()" type="submit">Salvar medico</button>
          </form>
        </article>

        <article class="card">
          <h2>Cadastrar administrador</h2>
          <form [formGroup]="adminForm" (ngSubmit)="submitAdmin()">
            <input formControlName="fullName" placeholder="Nome completo" />
            <input formControlName="email" type="email" placeholder="E-mail" />
            <input formControlName="password" type="password" placeholder="Senha" />
            <input formControlName="phoneNumber" placeholder="Telefone" />
            <button [disabled]="loading()" type="submit">Salvar administrador</button>
          </form>
        </article>

        <article class="card wide">
          <h2>Medicos cadastrados</h2>
          <div class="list">
            <div *ngFor="let doctor of doctors()" class="row">
              <div class="doctor-summary">
                <div class="doctor-avatar">
                  <img *ngIf="doctor.profilePhotoUrl; else doctorInitial" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
                  <ng-template #doctorInitial>{{ doctor.user.fullName.charAt(0) }}</ng-template>
                </div>
                <div class="doctor-summary-text">
                  <strong>{{ doctor.user.fullName }}</strong>
                  <span>{{ specialtyLabel(doctor.specialty) }} - {{ doctor.crm }}</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="card wide">
          <h2>Documentos legais ativos</h2>
          <div class="legal-grid">
            <section class="legal-editor">
              <div class="legal-head">
                <div>
                  <h3>Termos de uso</h3>
                  <small>{{ legalVersionLabel('TERMS_OF_USE') }}</small>
                </div>
                <button type="button" class="secondary-button" (click)="submitLegalDocument('TERMS_OF_USE', termsForm)">
                  Publicar nova versao
                </button>
              </div>
              <form [formGroup]="termsForm">
                <input formControlName="title" placeholder="Titulo" />
                <input formControlName="summary" placeholder="Resumo" />
                <textarea formControlName="content" placeholder="Conteudo completo"></textarea>
              </form>
            </section>

            <section class="legal-editor">
              <div class="legal-head">
                <div>
                  <h3>Politica de privacidade</h3>
                  <small>{{ legalVersionLabel('PRIVACY_POLICY') }}</small>
                </div>
                <button type="button" class="secondary-button" (click)="submitLegalDocument('PRIVACY_POLICY', privacyForm)">
                  Publicar nova versao
                </button>
              </div>
              <form [formGroup]="privacyForm">
                <input formControlName="title" placeholder="Titulo" />
                <input formControlName="summary" placeholder="Resumo" />
                <textarea formControlName="content" placeholder="Conteudo completo"></textarea>
              </form>
            </section>

            <section class="legal-editor">
              <div class="legal-head">
                <div>
                  <h3>Politica de cookies</h3>
                  <small>{{ legalVersionLabel('COOKIE_POLICY') }}</small>
                </div>
                <button type="button" class="secondary-button" (click)="submitLegalDocument('COOKIE_POLICY', cookiesForm)">
                  Publicar nova versao
                </button>
              </div>
              <form [formGroup]="cookiesForm">
                <input formControlName="title" placeholder="Titulo" />
                <input formControlName="summary" placeholder="Resumo" />
                <textarea formControlName="content" placeholder="Conteudo completo"></textarea>
              </form>
            </section>
          </div>
        </article>

        <article class="card wide">
          <h2>Checklist operacional por prioridade</h2>
          <div class="ops-grid">
            <article class="ops-item" *ngFor="let item of operationalChecklist">
              <div class="ops-head">
                <strong>{{ item.title }}</strong>
                <span class="priority" [class.high]="item.priority === 'Alta'" [class.medium]="item.priority === 'Media'">
                  {{ item.priority }}
                </span>
              </div>
              <p>{{ item.description }}</p>
              <small>{{ item.action }}</small>
            </article>
          </div>
        </article>
      </section>
    </div>

    <ng-template #denied>
      <div class="page">
        <article class="card denied">
          <h2>Acesso restrito</h2>
          <p>Essa area interna esta disponivel somente para o dono do sistema.</p>
          <a routerLink="/dashboard">Voltar ao painel</a>
        </article>
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: #f4efe6;
      color: #112027;
      font-family: 'Segoe UI', sans-serif;
    }

    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: end;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 0.72rem;
      color: #0e7b83;
      font-weight: 700;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .wide {
      grid-column: 1 / -1;
    }

    .card {
      background: rgba(255, 253, 249, 0.9);
      border-radius: 28px;
      padding: 22px;
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }

    form,
    .list {
      display: grid;
      gap: 12px;
    }

    .legal-grid {
      display: grid;
      gap: 18px;
    }

    .ops-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .legal-editor {
      display: grid;
      gap: 14px;
      padding: 18px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(17, 32, 39, 0.06);
    }

    .legal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }

    .legal-head h3,
    .legal-head small {
      margin: 0;
    }

    .legal-head small {
      color: #5b6a70;
    }

    .ops-item {
      display: grid;
      gap: 10px;
      padding: 18px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(17, 32, 39, 0.06);
    }

    .ops-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    .ops-item p,
    .ops-item small {
      margin: 0;
      color: #5b6a70;
      line-height: 1.6;
    }

    .priority {
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      background: #e8f7f5;
      color: #0e7b83;
      flex-shrink: 0;
    }

    .priority.high {
      background: #ffe8e0;
      color: #b54a1c;
    }

    .priority.medium {
      background: #fff4de;
      color: #9a6812;
    }

    input,
    select,
    textarea,
    button {
      width: 100%;
      border-radius: 16px;
      font: inherit;
    }

    input,
    select,
    textarea {
      border: 1px solid #d8dfdf;
      padding: 14px 16px;
      background: white;
    }

    textarea {
      min-height: 96px;
      resize: vertical;
    }

    .upload-field {
      display: grid;
      gap: 8px;
      color: #112027;
      font-weight: 700;
    }

    .upload-field input[type='file'] {
      padding: 12px 14px;
    }

    .upload-field small {
      color: #5b6a70;
      font-weight: 500;
    }

    button {
      border: 0;
      padding: 14px 16px;
      font-weight: 700;
      cursor: pointer;
      background: linear-gradient(135deg, #ff8e54, #d94f04);
      color: white;
    }

    .secondary-button {
      width: auto;
      background: #112027;
      color: white;
      box-shadow: none;
    }

    .check {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .check input {
      width: auto;
    }

    .row {
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(17, 32, 39, 0.08);
      display: grid;
      gap: 4px;
    }

    .doctor-summary {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .doctor-summary-text {
      display: grid;
      gap: 4px;
    }

    .doctor-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(14, 123, 131, 0.14), rgba(217, 79, 4, 0.18));
      color: #0b5860;
      font-weight: 800;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .doctor-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .message,
    .error {
      border-radius: 16px;
      padding: 12px 14px;
      margin: 0 0 18px;
    }

    .message {
      background: #e6f6f2;
      color: #0f684f;
    }

    .error {
      background: #ffe9e3;
      color: #a33b19;
    }

    a {
      text-decoration: none;
      background: #fff0e8;
      color: #d94f04;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 700;
      display: inline-flex;
      width: fit-content;
    }

    .denied {
      display: grid;
      gap: 16px;
      justify-items: start;
    }

    @media (max-width: 980px) {
      .grid,
      .ops-grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class AdminPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(TelemedApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly specialtyOptions: DoctorSpecialty[] = ['GENERALISTA'];
  readonly doctors = signal<DoctorResponse[]>([]);
  readonly users = signal<UserResponse[]>([]);
  readonly legalDocuments = signal<LegalDocumentResponse[]>([]);
  readonly error = signal('');
  readonly message = signal('');
  readonly loading = signal(false);
  readonly doctorPhotoName = signal('');
  readonly operationalChecklist = [
    {
      priority: 'Alta',
      title: 'Completar identificacao juridica nas politicas',
      description: 'Preencha razao social, CNPJ, endereco, canal de contato e encarregado de dados nos textos publicados.',
      action: 'Ajuste os tres documentos legais antes de anunciar ou captar pacientes em escala.'
    },
    {
      priority: 'Alta',
      title: 'Formalizar estrutura medica da operacao',
      description: 'Defina responsavel tecnico, vinculo com os medicos e valide o enquadramento da operacao perante CRM e regras locais.',
      action: 'Isso depende de documentacao externa e nao pode ser resolvido so com codigo.'
    },
    {
      priority: 'Alta',
      title: 'Assinatura digital para documentos clinicos',
      description: 'Receitas, atestados e outros documentos validos exigem fluxo de assinatura apropriado quando emitidos ao paciente.',
      action: 'Feche o provedor e a politica operacional antes de liberar emissao ampla em producao.'
    },
    {
      priority: 'Media',
      title: 'Contratos com operadores e prestadores',
      description: 'Formalize relacoes com medicos, hospedagem, mensageria, pagamentos e quaisquer fornecedores que tratem dados sensiveis.',
      action: 'Mantenha DPA, clausulas de confidencialidade e matriz de compartilhamento.'
    },
    {
      priority: 'Media',
      title: 'Trilha de auditoria, retencao e backup',
      description: 'Defina por quanto tempo manter consentimentos, prontuarios, logs de acesso e como recuperar dados em incidente.',
      action: 'Documente a politica e verifique se a infraestrutura acompanha esse prazo.'
    },
    {
      priority: 'Media',
      title: 'Plano de resposta a incidentes e suporte LGPD',
      description: 'Prepare fluxo para incidente de seguranca, atendimento ao titular e revisao periodica das permissoes internas.',
      action: 'Nomeie responsaveis e crie procedimento pratico para producao.'
    }
  ] as const;
  private selectedDoctorPhoto: File | null = null;
  private errorTimer: number | null = null;
  private messageTimer: number | null = null;

  readonly doctorForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: [''],
    crm: ['', Validators.required],
    specialty: this.fb.nonNullable.control<DoctorSpecialty>('GENERALISTA', Validators.required),
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

  readonly termsForm = this.buildLegalForm();
  readonly privacyForm = this.buildLegalForm();
  readonly cookiesForm = this.buildLegalForm();

  constructor() {
    this.loadData();
  }

  legalVersionLabel(documentType: LegalDocumentType): string {
    const document = this.legalDocuments().find((item) => item.documentType === documentType);
    return document ? `Versao ${document.versionNumber}` : 'Sem versao ativa';
  }

  specialtyLabel(specialty: DoctorSpecialty): string {
    return specialty === 'GERAL' || specialty === 'GENERALISTA' ? 'Generalista' : specialty;
  }

  submitDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.setError('Revise os campos do medico antes de continuar.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.api.registerDoctor(this.doctorForm.getRawValue())
      .pipe(
        switchMap((doctor) => this.selectedDoctorPhoto ? this.api.uploadDoctorPhoto(this.selectedDoctorPhoto) : of(doctor)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.setMessage('Medico cadastrado com sucesso.');
          this.selectedDoctorPhoto = null;
          this.doctorPhotoName.set('');
          this.doctorForm.reset({
            fullName: '',
            email: '',
            password: '',
            phoneNumber: '',
            crm: '',
            specialty: 'GENERALISTA',
            biography: '',
            telemedicineEnabled: true
          });
          this.loadData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.setError(error.error?.message ?? 'Nao foi possivel cadastrar o medico.');
        }
      });
  }

  onDoctorPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedDoctorPhoto = file;
    this.doctorPhotoName.set(file?.name ?? '');
  }

  submitAdmin(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      this.setError('Revise os campos do administrador antes de continuar.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.api.registerAdmin(this.adminForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.setMessage('Administrador cadastrado com sucesso.');
          this.adminForm.reset({
            fullName: '',
            email: '',
            password: '',
            phoneNumber: '',
            documentNumber: '',
            birthDate: '',
            healthInsurance: ''
          });
          this.loadData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.setError(error.error?.message ?? 'Nao foi possivel cadastrar o administrador.');
        }
      });
  }

  submitLegalDocument(documentType: LegalDocumentType, form: FormGroup): void {
    if (form.invalid) {
      form.markAllAsTouched();
      this.setError('Revise os campos do documento legal antes de publicar.');
      return;
    }

    const raw = form.getRawValue() as { title: string; summary: string; content: string };
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.api.updateLegalDocument(documentType, {
      title: raw.title.trim(),
      summary: raw.summary.trim(),
      content: raw.content.trim()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.setMessage('Documento legal publicado com sucesso.');
          this.loadData();
        },
        error: (error: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.setError(error.error?.message ?? 'Nao foi possivel publicar o documento legal.');
        }
      });
  }

  private loadData(): void {
    if (!this.auth.isOwner()) {
      return;
    }

    forkJoin({
      users: this.api.getUsers(),
      doctors: this.api.getDoctors(),
      legalDocuments: this.api.getAdminLegalDocuments()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, doctors, legalDocuments }) => {
          this.error.set('');
          this.users.set(users);
          this.doctors.set(doctors);
          this.legalDocuments.set(legalDocuments);
          this.patchLegalForms(legalDocuments);
        },
        error: () => this.setError('Nao foi possivel carregar os dados internos.')
      });
  }

  private buildLegalForm() {
    return this.fb.nonNullable.group({
      title: ['', Validators.required],
      summary: [''],
      content: ['', [Validators.required, Validators.minLength(40)]]
    });
  }

  private patchLegalForms(documents: LegalDocumentResponse[]): void {
    this.patchLegalForm(this.termsForm, documents.find((document) => document.documentType === 'TERMS_OF_USE'));
    this.patchLegalForm(this.privacyForm, documents.find((document) => document.documentType === 'PRIVACY_POLICY'));
    this.patchLegalForm(this.cookiesForm, documents.find((document) => document.documentType === 'COOKIE_POLICY'));
  }

  private patchLegalForm(form: FormGroup, document?: LegalDocumentResponse): void {
    form.patchValue({
      title: document?.title ?? '',
      summary: document?.summary ?? '',
      content: document?.content ?? ''
    }, { emitEvent: false });
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
