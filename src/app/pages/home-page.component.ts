import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DoctorResponse } from '../core/models';
import { TelemedApiService } from '../core/telemed-api.service';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing">
      <section class="hero" id="inicio">
        <div class="hero-copy">
          <p class="eyebrow">Consulta online com preco acessivel</p>
          <p class="brand-kicker">MedCallOn</p>
          <a routerLink="/auth" class="price-pill">Consulta R$ 49,90</a>
          <h1>Consulta medica online com atendimento simples e seguro.</h1>
          <p class="lead">
            Atendimento com clinico geral por telemedicina, pagamento por Pix e acesso pela plataforma da MedCallOn.
          </p>
          <p class="hero-note">Receita e atestado podem ser emitidos quando houver indicacao clinica.</p>
          <div class="hero-actions">
            <a routerLink="/auth" class="primary-action">Agendar consulta</a>
            <a href="#como-funciona" class="secondary-action">Como funciona</a>
          </div>
        </div>

        <div class="hero-visual">
          <a routerLink="/auth" class="summary-card">
            <p class="summary-label">Resumo da consulta</p>
            <strong>R$ 49,90</strong>
            <ul>
              <li>Clinico geral online</li>
              <li>Pagamento por Pix</li>
              <li>Atendimento remoto</li>
            </ul>
          </a>
        </div>
      </section>

      <section class="info-band">
        <article class="info-card">
          <h2>Atendimento para sintomas comuns</h2>
          <p>Gripe, febre, dor de garganta, virose, mal-estar e outras queixas clinicas de baixa complexidade.</p>
        </article>
        <article class="info-card">
          <h2>Processo simples</h2>
          <p>Cadastro, pagamento e entrada na consulta em um fluxo curto, pensado para quem precisa resolver rapido.</p>
        </article>
        <article class="info-card">
          <h2>Informacoes claras</h2>
          <p>Valor da consulta, forma de pagamento e funcionamento da jornada explicados logo no inicio.</p>
        </article>
      </section>

      <section class="doctor-section" *ngIf="featuredDoctor() as doctor">
        <div class="section-head">
          <p class="section-tag">Medico em destaque</p>
          <h2>Profissional identificado e com informacoes objetivas.</h2>
        </div>

        <article class="doctor-card">
          <div class="doctor-photo">
            <img *ngIf="doctor.profilePhotoUrl" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
            <span *ngIf="!doctor.profilePhotoUrl">{{ doctor.user.fullName.charAt(0) }}</span>
          </div>
          <div class="doctor-copy">
            <h3>{{ doctor.user.fullName }}</h3>
            <p class="doctor-meta">CRM {{ doctor.crm }} · {{ doctor.specialty === 'GENERALISTA' || doctor.specialty === 'GERAL' ? 'Clinico geral' : doctor.specialty }}</p>
            <p>Atendimento online pela plataforma da MedCallOn.</p>
          </div>
          <a routerLink="/auth" class="doctor-action">Seguir para o cadastro</a>
        </article>
      </section>

      <section class="steps-section" id="como-funciona">
        <div class="section-head">
          <p class="section-tag">Como funciona</p>
          <h2>Da entrada ao atendimento.</h2>
        </div>

        <div class="steps-grid">
          <article class="step-card">
            <span>1</span>
            <h3>Cadastro</h3>
            <p>Preencha seus dados para iniciar a consulta.</p>
          </article>
          <article class="step-card">
            <span>2</span>
            <h3>Pagamento</h3>
            <p>Conclua o Pix para liberar o atendimento.</p>
          </article>
          <article class="step-card">
            <span>3</span>
            <h3>Consulta</h3>
            <p>Entre na sala e fale com o medico pela plataforma.</p>
          </article>
        </div>
      </section>

      <section class="testimonials-section">
        <div class="section-head">
          <p class="section-tag">Experiencia</p>
          <h2>O que a pessoa encontra ao entrar.</h2>
        </div>

        <div class="testimonials-grid">
          <article class="testimonial-card"><p>Valor claro antes do cadastro.</p></article>
          <article class="testimonial-card"><p>Clinico geral identificado na plataforma.</p></article>
          <article class="testimonial-card"><p>Fluxo simples para seguir ate a consulta.</p></article>
        </div>
      </section>

      <section class="faq-section" id="faq">
        <div class="section-head centered">
          <p class="section-tag">Perguntas frequentes</p>
          <h2>Informacoes diretas.</h2>
        </div>

        <div class="faq-list">
          <article>
            <h3>Qual o valor?</h3>
            <p>R$ 49,90 por consulta.</p>
          </article>
          <article>
            <h3>Como pago?</h3>
            <p>O pagamento e feito por Pix para liberar o atendimento.</p>
          </article>
          <article>
            <h3>Receita e atestado sao garantidos?</h3>
            <p>Podem ser emitidos quando houver indicacao clinica.</p>
          </article>
        </div>
      </section>

      <footer class="legal-footer">
        <div class="footer-cta">
          <p class="section-tag">Comece agora</p>
          <a routerLink="/auth" class="primary-action">Agendar consulta</a>
        </div>
        <a routerLink="/legal/privacidade">Politica de Privacidade</a>
        <a routerLink="/legal/termos">Termos de Uso</a>
        <a routerLink="/legal/cookies">Politica de Cookies</a>
      </footer>
    </div>
  `,
  styles: `
    :host {
      display: block;
      color: #17313a;
      font-family: 'Segoe UI', sans-serif;
      background: #ffffff;
    }

    .landing {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px 24px 88px;
      display: grid;
      gap: 32px;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
      gap: 24px;
      align-items: start;
      padding-top: 20px;
    }

    .hero-copy {
      display: grid;
      gap: 14px;
      padding: 8px 0;
    }

    .eyebrow,
    .section-tag {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.74rem;
      font-weight: 700;
      color: #20b8b2;
    }

    .brand-kicker {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #17313a;
    }

    h1, h2, h3, p {
      margin: 0;
    }

    .price-pill {
      justify-self: start;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 18px;
      border-radius: 999px;
      background: #25c1bb;
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
    }

    h1 {
      max-width: 10ch;
      font-size: clamp(2.6rem, 4.4vw, 4.8rem);
      line-height: 1;
      letter-spacing: -0.04em;
      color: #1a333a;
      font-weight: 700;
    }

    .lead,
    .hero-note,
    .info-card p,
    .step-card p,
    .testimonial-card p,
    .doctor-copy p,
    .faq-list p {
      color: #617b82;
      line-height: 1.6;
      font-size: 1rem;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .primary-action,
    .secondary-action,
    .doctor-action {
      text-decoration: none;
      border-radius: 16px;
      padding: 14px 20px;
      font-weight: 600;
    }

    .primary-action,
    .doctor-action {
      background: #25c1bb;
      color: #fff;
    }

    .secondary-action {
      border: 1px solid rgba(23, 49, 58, 0.18);
      color: #17313a;
      background: #ffffff;
    }

    .summary-card {
      text-decoration: none;
      padding: 24px;
      border-radius: 24px;
      background: linear-gradient(180deg, #28c2bc 0%, #18ada8 100%);
      color: #fff;
      display: grid;
      gap: 10px;
      position: sticky;
      top: 104px;
    }

    .summary-label {
      color: rgba(255, 255, 255, 0.88);
    }

    .summary-card strong {
      font-size: 3.4rem;
      line-height: 0.92;
      font-weight: 700;
    }

    .summary-card ul {
      margin: 4px 0 0;
      padding-left: 18px;
      display: grid;
      gap: 10px;
      color: rgba(255, 255, 255, 0.94);
    }

    .info-band,
    .steps-grid,
    .testimonials-grid,
    .faq-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .doctor-section,
    .steps-section,
    .testimonials-section,
    .faq-section,
    .legal-footer {
      display: grid;
      gap: 20px;
    }

    .section-head {
      display: grid;
      gap: 6px;
      max-width: 720px;
    }

    .section-head.centered {
      text-align: center;
      justify-self: center;
    }

    .section-head h2,
    .info-card h2,
    .step-card h3,
    .doctor-copy h3,
    .faq-list h3 {
      font-size: 1.18rem;
      line-height: 1.15;
      font-weight: 600;
      color: #17313a;
    }

    .info-card,
    .step-card,
    .testimonial-card,
    .faq-list article,
    .doctor-card {
      padding: 22px;
      border-radius: 22px;
      background: #f8fbfb;
      border: 1px solid rgba(23, 49, 58, 0.07);
    }

    .doctor-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 18px;
      align-items: center;
    }

    .doctor-photo {
      width: 88px;
      height: 88px;
      border-radius: 20px;
      background: #1f555d;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      overflow: hidden;
    }

    .doctor-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .doctor-copy {
      display: grid;
      gap: 6px;
    }

    .doctor-meta {
      color: #47656d;
    }

    .step-card span {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: #e6f7f7;
      color: #1f666b;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .legal-footer {
      padding-top: 8px;
      border-top: 1px solid rgba(23, 49, 58, 0.08);
    }

    .footer-cta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .legal-footer a {
      color: #20a8a4;
      text-decoration: none;
      font-weight: 600;
    }

    @media (max-width: 1100px) {
      .hero,
      .info-band,
      .steps-grid,
      .testimonials-grid,
      .faq-list,
      .doctor-card {
        grid-template-columns: 1fr;
      }

      .summary-card {
        position: static;
      }
    }

    @media (max-width: 820px) {
      .landing {
        padding: 18px 16px 72px;
        gap: 26px;
      }

      h1 {
        max-width: none;
        font-size: 2.7rem;
      }

      .hero-actions,
      .footer-cta {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class HomePageComponent {
  private readonly api = inject(TelemedApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly featuredDoctor = signal<DoctorResponse | null>(null);

  constructor() {
    this.api
      .getDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => {
          const telemedicineDoctor = doctors.find((doctor) => doctor.telemedicineEnabled) ?? doctors[0] ?? null;
          this.featuredDoctor.set(telemedicineDoctor);
        },
        error: () => this.featuredDoctor.set(null)
      });
  }
}
