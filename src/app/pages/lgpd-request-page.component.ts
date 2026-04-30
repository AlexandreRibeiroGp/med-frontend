import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TelemedApiService } from '../core/telemed-api.service';

type PrivacyRequestType = 'ACCESS' | 'CORRECTION' | 'DELETION' | 'PORTABILITY' | 'SHARING_INFO' | 'OTHER';

@Component({
  selector: 'app-lgpd-request-page',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="lgpd-page">
      <div class="hero">
        <p class="eyebrow">Direitos do titular</p>
        <h1>Solicitação LGPD</h1>
        <p>
          Use este canal para pedir acesso, correção, exclusão, informação sobre compartilhamento ou outra demanda
          relacionada aos seus dados pessoais na MedCallOn.
        </p>
      </div>

      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          <span>Nome completo</span>
          <input type="text" formControlName="name" />
        </label>

        <label>
          <span>E-mail</span>
          <input type="email" formControlName="email" />
        </label>

        <label>
          <span>Tipo de solicitação</span>
          <select formControlName="requestType">
            <option value="ACCESS">Acesso aos dados</option>
            <option value="CORRECTION">Correção de dados</option>
            <option value="DELETION">Exclusão de dados</option>
            <option value="PORTABILITY">Portabilidade</option>
            <option value="SHARING_INFO">Informação sobre compartilhamento</option>
            <option value="OTHER">Outro assunto</option>
          </select>
        </label>

        <label>
          <span>Descreva o pedido</span>
          <textarea rows="7" formControlName="message"></textarea>
        </label>

        <p class="hint">
          Se a solicitação envolver dados de saúde ou prontuário, informe detalhes suficientes para localizar o cadastro.
        </p>

        <p *ngIf="error()" class="error">{{ error() }}</p>
        <p *ngIf="success()" class="success">{{ success() }}</p>

        <button type="submit" [disabled]="loading()">
          {{ loading() ? 'Enviando...' : 'Enviar solicitação' }}
        </button>
      </form>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .lgpd-page {
      max-width: 920px;
      margin: 0 auto;
      padding: 40px 24px 80px;
      display: grid;
      gap: 24px;
    }

    .hero,
    .card {
      border: 1px solid rgba(17, 32, 39, 0.08);
      border-radius: 28px;
      background: linear-gradient(180deg, #fffdf8, #ffffff);
      box-shadow: 0 24px 56px rgba(17, 32, 39, 0.08);
    }

    .hero {
      padding: 30px 32px;
      display: grid;
      gap: 12px;
    }

    .eyebrow {
      margin: 0;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #0f8b91;
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3.4rem);
      line-height: 0.96;
      color: #112027;
    }

    .hero p:last-child {
      margin: 0;
      color: #516268;
      line-height: 1.6;
      max-width: 720px;
    }

    .card {
      padding: 28px;
      display: grid;
      gap: 18px;
    }

    label {
      display: grid;
      gap: 8px;
    }

    span {
      font-weight: 700;
      color: #112027;
    }

    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid rgba(17, 32, 39, 0.14);
      border-radius: 18px;
      padding: 14px 16px;
      font: inherit;
      background: #fff;
      color: #112027;
    }

    textarea {
      resize: vertical;
      min-height: 160px;
    }

    .hint,
    .error,
    .success {
      margin: 0;
      line-height: 1.5;
    }

    .hint {
      color: #5d6d73;
    }

    .error {
      color: #a33b19;
      font-weight: 600;
    }

    .success {
      color: #0f8b91;
      font-weight: 600;
    }

    button {
      justify-self: start;
      border: 0;
      border-radius: 999px;
      padding: 14px 22px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      color: white;
      background: linear-gradient(135deg, #1dbec4, #0f8b91);
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    @media (max-width: 720px) {
      .lgpd-page {
        padding: 20px 16px 96px;
      }

      .hero,
      .card {
        border-radius: 22px;
      }

      .hero,
      .card {
        padding: 20px;
      }

      button {
        width: 100%;
        justify-self: stretch;
      }
    }
  `
})
export class LgpdRequestPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TelemedApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    requestType: ['ACCESS' as PrivacyRequestType, [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(4000)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revise os campos e descreva a solicitação com mais detalhes.');
      this.success.set('');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const raw = this.form.getRawValue();
    this.api.createPrivacyRequest({
      name: raw.name,
      email: raw.email,
      requestType: raw.requestType as PrivacyRequestType,
      message: raw.message
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.form.reset({
            name: '',
            email: '',
            requestType: 'ACCESS' as PrivacyRequestType,
            message: ''
          });
          this.success.set('Solicitação recebida. A equipe responsável vai analisar e responder pelo canal informado.');
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Não foi possível enviar sua solicitação agora. Tente novamente em instantes.');
        }
      });
  }
}

