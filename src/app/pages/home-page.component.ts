import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AnalyticsService } from '../core/analytics.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing">
      <section class="hero" id="inicio">
        <div class="hero-copy">
          <p class="eyebrow">Consulta online com preço acessível</p>
          <p class="brand-kicker">MedCallOn</p>
          <h1>Consulta médica online com atendimento simples e seguro.</h1>
            <p class="hero-note">Consulta médica online de forma simples e segura.</p>
          <div class="hero-actions">
            <a href="#como-funciona" class="secondary-action">Como funciona</a>
          </div>
        </div>

        <div class="hero-visual">
          <a
            routerLink="/comece"
            class="summary-card"
            (click)="trackCta('summary_card_click')"
          >
            <p class="summary-label">Atendimento online</p>
            <strong>R$ 49,90</strong>
            <ul>
              <li>Profissional habilitado</li>
              <li>Pagamento por Pix</li>
              <li>Acesso pela plataforma</li>
            </ul>
          </a>
        </div>
      </section>

      <section class="info-band">
        <article class="info-card">
          <h2>Cuidado Médico com agilidade, segurança e excelência, de onde você estiver</h2>
          <p>Atendimento online com médicos generalistas preparados para avaliar queixas comuns, como dor de garganta, dor de cabeça, dor lombar, febre, diarreia e vômitos.</p>
        </article>
        <article class="info-card">
          <h2>Cuidar da sua saúde nunca foi tão fácil</h2>
          <p>Cadastre-se em poucos minutos, escolha o melhor dia e horário, realize o pagamento com segurança e acesse sua consulta online na nossa plataforma. Atendimento com hora marcada, sem filas e com total comodidade.</p>
        </article>
        <article class="info-card">
          <h2>Excelência médica ao seu alcance</h2>
          <p>Conte com profissionais qualificados e habilitados, prontos para oferecer uma avaliação completa, orientação precisa e conduta adequada para o seu caso, com a confiança e o cuidado que você merece.</p>
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
            <p>Entre na sala e fale com o médico pela plataforma.</p>
          </article>
        </div>
      </section>

      <section class="reviews-section">
        <div class="section-head">
          <p class="section-tag">Avaliações</p>
          <h2>Quem já passou pela consulta.</h2>
        </div>

        <div class="reviews-grid">
          <article class="review-card review-card--highlight review-card--quote">
            <div class="review-head">
              <div class="review-avatar">H</div>
              <div>
                <h3>Henrique Teixeira</h3>
                <p class="review-meta">⭐⭐⭐⭐⭐ · 1 avaliação</p>
              </div>
            </div>
            <p>
              O atendimento com a Dra. Carla foi excelente! Muito atenciosa e profissional.
              A plataforma é fácil de usar e o atendimento foi rápido. Recomendo muito!
            </p>
          </article>
          <article class="review-card review-card--quote">
            <div class="review-head">
              <div class="review-avatar">A</div>
              <div>
                <h3>Antonio Rodrigues</h3>
                <p class="review-meta">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p>
              O atendimento foi excelente, rápido e muito profissional. A plataforma é simples de usar e facilitou
              muito todo o processo da consulta. Consegui resolver meu problema sem sair de casa. Recomendo muito!
            </p>
          </article>
          <article class="review-card review-card--quote">
            <div class="review-head">
              <div class="review-avatar">F</div>
              <div>
                <h3>Fernanda Silva</h3>
                <p class="review-meta">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p>
              Fiquei muito satisfeita com o atendimento! Foi rápido, prático e super profissional. A plataforma é bem
              fácil de usar e todo o processo foi muito tranquilo. Com certeza utilizarei novamente e recomendo!
            </p>
          </article>
        </div>
      </section>

      <section class="faq-section" id="faq">
        <div class="section-head centered">
          <p class="section-tag">Perguntas frequentes</p>
          <h2>Informações diretas.</h2>
        </div>

        <div class="faq-list">
          <article>
            <h3>Qual o valor?</h3>
            <p>R$ 49,90 por consulta.</p>
          </article>
          <article>
            <h3>Como pago?</h3>
            <p>O pagamento é feito por Pix para liberar o atendimento.</p>
          </article>
            <article>
              <h3>Como funciona o atendimento?</h3>
              <p>Você realiza o cadastro, confirma o pagamento e segue para a consulta pela plataforma.</p>
            </article>
          </div>
        </section>

      <section class="topics-section">
        <div class="section-head centered">
          <p class="section-tag">Conteúdos</p>
          <h2>Temas que as pessoas mais procuram.</h2>
        </div>

        <div class="topics-grid">
          <a routerLink="/medico-online-pix" class="topic-card">Médico online com pagamento por Pix</a>
          <a routerLink="/consulta-online-atestado" class="topic-card">Consulta online e atestado médico</a>
          <a routerLink="/clinico-geral-online" class="topic-card">Clínico geral online</a>
        </div>
      </section>

      <footer class="legal-footer">
        <div class="footer-cta">
          <p class="section-tag">Comece agora</p>
          <a
            routerLink="/comece"
            class="primary-action"
            (click)="trackCta('footer_schedule_click')"
          >
            Quero me consultar
          </a>
        </div>
        <a href="mailto:mmedcallon@gmail.com">mmedcallon@gmail.com</a>
        <a routerLink="/legal/privacidade">Política de Privacidade</a>
        <a routerLink="/legal/termos">Termos de Uso</a>
        <a routerLink="/legal/cookies">Política de Cookies</a>
        <a routerLink="/lgpd/solicitacoes">Solicitação LGPD</a>
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
      max-width: 13ch;
      font-size: clamp(2.6rem, 4vw, 4.6rem);
      line-height: 0.98;
      letter-spacing: -0.04em;
      color: #1a333a;
      font-weight: 700;
    }

    .lead,
    .hero-note,
    .info-card p,
    .step-card p,
    .review-card p,
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

    .doctor-name-link {
      color: #17313a;
      font-size: 1.9rem;
      font-weight: 700;
      line-height: 1.1;
      text-decoration: none;
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
    .reviews-grid,
    .faq-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .reviews-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .review-card {
      display: grid;
      gap: 10px;
      align-content: start;
      min-height: 100%;
    }

    .review-card--highlight {
      background: #eef8f8;
      border-color: rgba(32, 184, 178, 0.18);
    }

    .review-card--quote {
      gap: 14px;
    }

    .review-head {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .review-avatar {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: #1f666b;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .review-meta {
      color: #7a9196;
      font-size: 0.92rem;
    }
    .doctor-section,
    .steps-section,
    .reviews-section,
    .faq-section,
    .topics-section,
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
    .review-card h3,
    .doctor-copy h3,
    .faq-list h3 {
      font-size: 1.18rem;
      line-height: 1.15;
      font-weight: 600;
      color: #17313a;
    }

    .info-card,
    .step-card,
    .review-card,
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

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .doctor-card--compact {
      grid-template-columns: auto 1fr;
      align-items: start;
    }

    .doctor-card--compact .doctor-photo {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      font-size: 1.6rem;
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

    .topics-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .topic-card {
      display: flex;
      align-items: center;
      min-height: 110px;
      padding: 22px;
      border-radius: 24px;
      background: rgba(255, 253, 249, 0.92);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
      color: #17313a;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.35;
      text-decoration: none;
    }

    @media (max-width: 1100px) {
      .hero,
      .info-band,
      .doctors-grid,
      .steps-grid,
      .reviews-grid,
      .topics-grid,
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
        padding: 12px 16px 72px;
        gap: 18px;
      }

      .hero {
        gap: 10px;
      }

      .hero-visual {
        order: -1;
      }

      .hero-copy {
        gap: 10px;
        padding: 0;
      }

      .eyebrow {
        font-size: 0.68rem;
      }

      .brand-kicker {
        font-size: 0.88rem;
      }

      h1 {
        max-width: 14ch;
        font-size: 1.9rem;
        line-height: 1.04;
      }

      .lead,
      .hero-note {
        font-size: 0.9rem;
        line-height: 1.42;
      }

      .hero-note {
        display: none;
      }

      .summary-card {
        padding: 14px 16px;
        gap: 6px;
        border-radius: 18px;
      }

      .summary-card strong {
        font-size: 2.2rem;
      }

      .price-pill {
        padding: 8px 14px;
        font-size: 0.9rem;
      }

      .info-band {
        display: none;
      }

      .doctor-card {
        grid-template-columns: 1fr;
        justify-items: start;
      }

      .doctor-action {
        width: 100%;
        text-align: center;
      }

      .hero-actions,
      .footer-cta {
        display: grid;
        grid-template-columns: 1fr;
      }

      .hero-actions {
        gap: 10px;
      }

      .hero-actions .secondary-action {
        display: none;
      }

      .primary-action,
      .doctor-action {
        padding: 13px 18px;
        text-align: center;
      }

      .steps-section,
      .reviews-section,
      .topics-section,
      .faq-section,
      .legal-footer {
        gap: 16px;
      }
    }
  `
})
export class HomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);
  private scrollMilestones = new Set<number>();

  constructor() {
    this.analytics.trackOnce('home_view', 'landing_view', { landing: this.currentLanding() });
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.scrollMilestones.clear();
      });
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        return;
      }
      const percent = Math.round((window.scrollY / maxScroll) * 100);
      [25, 50, 75].forEach((milestone) => {
        if (percent >= milestone && !this.scrollMilestones.has(milestone)) {
          this.scrollMilestones.add(milestone);
          this.analytics.track(`scroll_${milestone}`, { percent_scrolled: milestone, landing: this.currentLanding() });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', handleScroll));

  }

  trackCta(eventName: string): void {
    this.analytics.track(eventName, { landing: this.currentLanding() });
  }

  private currentLanding(): string {
    return this.router.url.startsWith('/consulta-online') ? 'consulta-online' : 'home';
  }
}


