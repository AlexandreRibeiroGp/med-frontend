import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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
          <div class="price-pill">Consulta R$ 49,90</div>
          <h1>Atendimento medico online com praticidade, acolhimento e valor claro.</h1>
          <p class="lead">
            Entre no portal, escolha seu atendimento e fale com um medico de forma organizada, com
            pagamento por Pix e documentacao digital ao final da jornada.
          </p>

          <div class="hero-actions">
            <a routerLink="/auth" class="primary-action">Quero me consultar</a>
            <a href="#como-funciona" class="secondary-action">Como funciona?</a>
          </div>

          <div class="hero-notes">
            <span>Pagamento por Pix</span>
            <span>Profissionais com CRM</span>
            <span>Documentacao digital</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-card visual-main" [class.visual-main--photo]="hasFeaturedPhoto()">
            <ng-container *ngIf="featuredDoctor() as heroDoctor">
              <img
                *ngIf="heroDoctor.profilePhotoUrl"
                class="featured-doctor-photo"
                [src]="heroDoctor.profilePhotoUrl"
                [alt]="heroDoctor.user.fullName || 'Medico em destaque'"
              />
            </ng-container>
            <p>Atendimento online</p>
            <strong>R$ 49,90</strong>
            <small>Uma jornada pensada para transmitir confianca, clareza e facilidade desde o primeiro acesso.</small>
          </div>

          <div class="visual-card visual-secondary">
            <span>01</span>
            <div>
              <strong>Cadastro e pagamento</strong>
              <p>Preencha seus dados, confirme o pagamento e avance para o atendimento.</p>
            </div>
          </div>

          <div class="visual-card visual-secondary">
            <span>02</span>
            <div>
              <strong>Atendimento remoto</strong>
              <p>Converse com o medico e acompanhe tudo em um ambiente simples e organizado.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="step-section" id="como-funciona">
        <div class="section-head centered">
          <p class="section-tag">Passo a passo</p>
          <h2>Como funciona</h2>
          <p>Veja como e facil iniciar seu atendimento pela plataforma.</p>
        </div>

        <div class="steps-grid">
          <article class="step-card">
            <div class="step-top">
              <div class="icon-box">01</div>
              <strong>01</strong>
            </div>
            <h3>Cadastro e pagamento</h3>
            <p>Crie sua conta, confirme seus dados e realize o pagamento da consulta com seguranca.</p>
          </article>

          <article class="step-card">
            <div class="step-top">
              <div class="icon-box">02</div>
              <strong>02</strong>
            </div>
            <h3>Atendimento</h3>
            <p>Depois da confirmacao, voce segue para a jornada clinica e para a sala de atendimento.</p>
          </article>

          <article class="step-card">
            <div class="step-top">
              <div class="icon-box">03</div>
              <strong>03</strong>
            </div>
            <h3>Documentacao</h3>
            <p>Ao final da consulta, seus registros e documentos ficam organizados dentro do portal.</p>
          </article>
        </div>

        <div class="section-action">
          <a routerLink="/auth" class="dark-action">Quero me consultar</a>
        </div>
      </section>

      <section class="doctor-section" id="medicos">
        <div class="section-head centered narrow">
          <h2>Profissionais preparados para atender com seriedade e cuidado</h2>
          <p>
            Apresente seus profissionais com CRM ativo, especialidade e uma comunicacao mais confiavel,
            sem exageros comerciais nem promessas indevidas.
          </p>
        </div>

        <div class="doctor-grid">
          <article class="doctor-card" *ngFor="let doctor of featuredDoctors(); let index = index">
            <div
              class="doctor-photo"
              [class.doctor-a]="index % 4 === 0"
              [class.doctor-b]="index % 4 === 1"
              [class.doctor-c]="index % 4 === 2"
              [class.doctor-d]="index % 4 === 3"
            >
              <img *ngIf="doctor.profilePhotoUrl; else doctorFallback" [src]="doctor.profilePhotoUrl" [alt]="doctor.user.fullName" />
              <ng-template #doctorFallback>
                <span>{{ doctor.user.fullName.charAt(0) }}</span>
              </ng-template>
            </div>
            <h3>{{ doctor.user.fullName }}</h3>
            <p>{{ doctor.specialty === 'GERAL' ? 'Clinica geral' : doctor.specialty }}</p>
            <small>CRM {{ doctor.crm }}</small>
          </article>
        </div>
      </section>

      <section class="faq-section" id="faq">
        <div class="section-head">
          <p class="section-tag">FAQ</p>
          <h2>Perguntas frequentes</h2>
        </div>

        <div class="faq-list">
          <article>
            <h3>Qual o valor da consulta?</h3>
            <p>A consulta custa R$ 49,90, com pagamento por Pix para liberar seu atendimento.</p>
          </article>
          <article>
            <h3>Preciso criar conta antes?</h3>
            <p>Sim. O cadastro protege seus dados e ajuda a manter sua jornada, documentos e historico organizados.</p>
          </article>
          <article>
            <h3>Recebo documentos ao final?</h3>
            <p>Quando clinicamente aplicavel, os documentos emitidos pelo profissional ficam disponiveis na plataforma.</p>
          </article>
        </div>
      </section>

      <section class="cta-band" id="contato">
        <div>
          <p class="section-tag">Comece agora</p>
          <h2>Seu atendimento pode comecar hoje, com um fluxo simples, valor claro e experiencia acolhedora.</h2>
        </div>
        <a routerLink="/auth" class="band-action">Quero me consultar</a>
      </section>

      <footer class="legal-footer">
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
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 24px 120px;
      display: grid;
      gap: 56px;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 28px;
      align-items: center;
      min-height: 78vh;
    }

    .hero-copy {
      display: grid;
      gap: 18px;
      align-content: center;
      padding: 16px 8px;
    }

    .eyebrow,
    .section-tag {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.74rem;
      font-weight: 800;
      color: #20b8b2;
    }

    .price-pill {
      justify-self: start;
      padding: 12px 22px;
      border-radius: 999px;
      background: #25c1bb;
      color: #fff;
      font-weight: 800;
      font-size: 1.05rem;
      box-shadow: 0 18px 42px rgba(37, 193, 187, 0.22);
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      max-width: 10.5ch;
      font-size: clamp(3.2rem, 6vw, 6rem);
      line-height: 0.94;
      letter-spacing: -0.06em;
      color: #1a333a;
    }

    .lead {
      max-width: 56ch;
      color: #57727a;
      font-size: 1.12rem;
      line-height: 1.75;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 8px;
    }

    .hero-actions a,
    .dark-action,
    .band-action {
      text-decoration: none;
      border-radius: 18px;
      padding: 18px 30px;
      font-weight: 800;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .primary-action {
      background: #25c1bb;
      color: #fff;
      box-shadow: 0 18px 42px rgba(37, 193, 187, 0.22);
    }

    .secondary-action {
      border: 1px solid rgba(23, 49, 58, 0.18);
      color: #17313a;
      background: #ffffff;
    }

    .hero-actions a:hover,
    .dark-action:hover,
    .band-action:hover {
      transform: translateY(-2px);
    }

    .hero-notes {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 4px;
    }

    .hero-notes span {
      padding: 10px 14px;
      border-radius: 999px;
      background: #f3fbfb;
      color: #4e6c73;
      font-weight: 700;
      border: 1px solid rgba(32, 184, 178, 0.12);
    }

    .hero-visual {
      display: grid;
      gap: 16px;
      padding: 18px;
      border-radius: 36px;
      background: linear-gradient(180deg, #f4fcfc 0%, #ebf8f8 100%);
      border: 1px solid rgba(23, 49, 58, 0.06);
      box-shadow: 0 28px 70px rgba(23, 49, 58, 0.08);
    }

    .visual-card {
      border-radius: 28px;
      background: #ffffff;
      border: 1px solid rgba(23, 49, 58, 0.07);
      box-shadow: 0 16px 38px rgba(23, 49, 58, 0.08);
    }

    .visual-main {
      position: relative;
      overflow: hidden;
      padding: 28px;
      display: grid;
      gap: 10px;
      min-height: 260px;
      align-content: end;
      background: linear-gradient(180deg, #28c2bc 0%, #18ada8 100%);
      color: #fff;
    }

    .visual-main--photo {
      align-content: end;
    }

    .featured-doctor-photo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.28;
    }

    .visual-main p,
    .visual-main small {
      position: relative;
      z-index: 1;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.55;
    }

    .visual-main strong {
      position: relative;
      z-index: 1;
      font-size: clamp(3rem, 5vw, 4.5rem);
      line-height: 0.92;
      letter-spacing: -0.06em;
    }

    .visual-secondary {
      padding: 18px 20px;
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 16px;
      align-items: center;
    }

    .visual-secondary span {
      display: inline-flex;
      width: 64px;
      height: 64px;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      background: #20353b;
      color: #fff;
      font-weight: 800;
      font-size: 1.25rem;
    }

    .visual-secondary strong {
      display: block;
      margin-bottom: 6px;
      font-size: 1.1rem;
    }

    .visual-secondary p {
      color: #5d7a82;
      line-height: 1.55;
    }

    .step-section,
    .doctor-section,
    .faq-section,
    .cta-band {
      display: grid;
      gap: 26px;
    }

    .section-head {
      display: grid;
      gap: 8px;
      max-width: 760px;
    }

    .section-head.centered {
      justify-self: center;
      text-align: center;
    }

    .section-head.narrow {
      max-width: 860px;
    }

    .section-head h2,
    .cta-band h2 {
      font-size: clamp(2.2rem, 4.2vw, 4rem);
      line-height: 0.98;
      letter-spacing: -0.05em;
      color: #20353b;
    }

    .section-head p {
      color: #67838a;
      line-height: 1.7;
      font-size: 1.06rem;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 22px;
    }

    .step-card {
      border-radius: 28px;
      padding: 28px;
      background: #2cbfb8;
      color: #fff;
      box-shadow: 0 24px 56px rgba(44, 191, 184, 0.18);
      display: grid;
      gap: 16px;
      min-height: 320px;
    }

    .step-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
    }

    .icon-box {
      width: 72px;
      height: 72px;
      border-radius: 22px;
      background: #233b42;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
    }

    .step-top strong {
      font-size: 4.2rem;
      line-height: 0.9;
      color: rgba(23, 49, 58, 0.92);
    }

    .step-card h3 {
      font-size: 1.55rem;
      line-height: 1.1;
    }

    .step-card p {
      font-size: 1.02rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.96);
    }

    .section-action {
      display: flex;
      justify-content: center;
    }

    .dark-action {
      background: #263c3f;
      color: #fff;
    }

    .doctor-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 18px;
    }

    .doctor-card {
      overflow: hidden;
      border-radius: 24px;
      border: 1px solid rgba(23, 49, 58, 0.08);
      background: #ffffff;
      box-shadow: 0 18px 42px rgba(23, 49, 58, 0.08);
      display: grid;
      gap: 10px;
      padding-bottom: 22px;
    }

    .doctor-photo {
      aspect-ratio: 0.9;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      overflow: hidden;
      display: grid;
      place-items: center;
    }

    .doctor-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .doctor-photo span {
      font-size: 4rem;
      font-weight: 800;
      color: #1b6665;
    }

    .doctor-a {
      background-image: linear-gradient(135deg, rgba(37,193,187,0.32), rgba(19,72,88,0.18)), radial-gradient(circle at 30% 30%, #fff 0%, #d9f3f2 38%, #b7e7e3 100%);
    }

    .doctor-b {
      background-image: linear-gradient(135deg, rgba(255,181,131,0.26), rgba(37,193,187,0.18)), radial-gradient(circle at 40% 20%, #fff 0%, #f6e7dc 38%, #ebd1be 100%);
    }

    .doctor-c {
      background-image: linear-gradient(135deg, rgba(37,193,187,0.22), rgba(23,49,58,0.12)), radial-gradient(circle at 50% 20%, #fff 0%, #e4edf0 40%, #d1dfe4 100%);
    }

    .doctor-d {
      background-image: linear-gradient(135deg, rgba(255,192,160,0.22), rgba(37,193,187,0.18)), radial-gradient(circle at 30% 20%, #fff 0%, #efe5ea 42%, #e5d3de 100%);
    }

    .doctor-card h3,
    .doctor-card p,
    .doctor-card small {
      padding: 0 18px;
    }

    .doctor-card h3 {
      font-size: 1.3rem;
      line-height: 1.15;
      color: #20353b;
    }

    .doctor-card p,
    .doctor-card small {
      color: #68838a;
    }

    .faq-list {
      display: grid;
      gap: 14px;
    }

    .faq-list article {
      padding: 24px 26px;
      border-radius: 24px;
      background: #f8fcfc;
      border: 1px solid rgba(23, 49, 58, 0.07);
    }

    .faq-list h3 {
      margin-bottom: 8px;
      font-size: 1.18rem;
      color: #20353b;
    }

    .faq-list p {
      color: #67838a;
      line-height: 1.65;
    }

    .cta-band {
      padding: 34px;
      border-radius: 34px;
      background: linear-gradient(180deg, #f3fbfb 0%, #ebf8f8 100%);
      border: 1px solid rgba(23, 49, 58, 0.06);
      align-items: center;
      grid-template-columns: minmax(0, 1fr) auto;
      box-shadow: 0 22px 56px rgba(23, 49, 58, 0.06);
    }

    .band-action {
      background: #25c1bb;
      color: #fff;
      box-shadow: 0 18px 42px rgba(37, 193, 187, 0.2);
    }

    .legal-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 14px;
      padding-top: 8px;
    }

    .legal-footer a {
      color: #20a8a4;
      text-decoration: none;
      font-weight: 700;
    }

    @media (max-width: 1100px) {
      .hero,
      .steps-grid,
      .doctor-grid,
      .cta-band {
        grid-template-columns: 1fr 1fr;
      }

      .hero {
        grid-template-columns: 1fr;
      }

      .cta-band {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 820px) {
      .landing {
        padding: 18px 16px 120px;
        gap: 40px;
      }

      .steps-grid,
      .doctor-grid {
        grid-template-columns: 1fr;
      }

      .hero {
        min-height: auto;
      }

      h1 {
        max-width: none;
        font-size: 3rem;
      }

      .hero-actions {
        display: grid;
      }

      .hero-actions a,
      .dark-action,
      .band-action {
        text-align: center;
      }
    }
  `
})
export class HomePageComponent {
  private readonly api = inject(TelemedApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly doctors = signal<DoctorResponse[]>([]);
  readonly featuredDoctors = computed(() => this.doctors().slice(0, 4));
  readonly featuredDoctor = computed(() => this.featuredDoctors()[0] ?? null);
  readonly hasFeaturedPhoto = computed(() => !!this.featuredDoctor()?.profilePhotoUrl);

  constructor() {
    this.api.getDoctors().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (doctors) => this.doctors.set(doctors),
      error: () => this.doctors.set([])
    });
  }
}

