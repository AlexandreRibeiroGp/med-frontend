import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <div class="landing">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Teleconsulta 24h com pagamento por Pix</p>
          <h1>Pronto atendimento online com valor claro e acesso rapido.</h1>
          <p class="lead">
            Fale com medico por video, receba orientacao com agilidade e acompanhe seu atendimento em
            uma experiencia simples, direta e segura.
          </p>

          <div class="hero-actions">
            <a routerLink="/auth" class="primary-action">Agendar agora</a>
            <a href="#como-funciona" class="secondary-action">Como funciona</a>
          </div>

          <ul class="hero-points">
            <li>Atendimento online 24 horas por dia.</li>
            <li>Pagamento por Pix para liberar a consulta.</li>
            <li>Portal do paciente com agenda, documentos e historico.</li>
          </ul>
        </div>

        <div class="hero-visual">
          <div class="visual-panel">
            <p class="visual-tag">Plantao digital</p>
            <h2>Consulta online a partir de</h2>
            <strong>R$ 49,90</strong>
            <p class="visual-copy">Valor unico para iniciar seu atendimento e seguir para a sala com o medico.</p>
            <div class="visual-stats">
              <article>
                <span>24h</span>
                <small>disponivel</small>
              </article>
              <article>
                <span>Pix</span>
                <small>confirmacao rapida</small>
              </article>
              <article>
                <span>Online</span>
                <small>sem deslocamento</small>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section class="trust-strip">
        <span>Consulta com valor transparente.</span>
        <span>Fluxo de pagamento simples.</span>
        <span>Atendimento quando voce precisar.</span>
      </section>

      <section class="benefits" id="vantagens">
        <div class="section-copy">
          <p class="section-tag">Vantagens</p>
          <h2>Uma pagina feita para o paciente entender rapido o que vai acontecer.</h2>
        </div>

        <div class="benefit-grid">
          <article>
            <span>01</span>
            <h3>Preco destacado</h3>
            <p>O usuario ve o valor da consulta antes de entrar, sem surpresa no checkout.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Entrada direta no portal</h3>
            <p>CTA claro para criar conta, entrar e seguir para o atendimento em poucos passos.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Linguagem comercial</h3>
            <p>Texto mais proximo de landing page de saude, com foco em urgencia, seguranca e conversao.</p>
          </article>
        </div>
      </section>

      <section class="journey" id="como-funciona">
        <div class="journey-card">
          <p class="section-tag">Como funciona</p>
          <h2>Do clique ao atendimento em tres movimentos.</h2>
          <div class="journey-steps">
            <article>
              <strong>1</strong>
              <h3>Entre ou crie sua conta</h3>
              <p>Acesse o portal com seus dados para visualizar medicos, horarios e documentos.</p>
            </article>
            <article>
              <strong>2</strong>
              <h3>Escolha o atendimento</h3>
              <p>Veja a consulta por R$ 49,90, selecione o horario e confirme por Pix.</p>
            </article>
            <article>
              <strong>3</strong>
              <h3>Fale com o medico online</h3>
              <p>Depois da confirmacao, o paciente segue para a jornada clinica e sala de atendimento.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="cta-band" id="contato">
        <div>
          <p class="section-tag">Pronto para converter melhor</p>
          <h2>Leve o usuario para a conta certa com valor e proposta de atendimento logo de entrada.</h2>
        </div>
        <a routerLink="/auth" class="band-action">Entrar ou cadastrar</a>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      color: #112027;
      font-family: 'Segoe UI', sans-serif;
    }

    .landing {
      max-width: 1220px;
      margin: 0 auto;
      padding: 28px 24px 120px;
      display: grid;
      gap: 34px;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
      gap: 28px;
      align-items: stretch;
    }

    .hero-copy,
    .visual-panel,
    .journey-card,
    .cta-band,
    .benefit-grid article {
      border-radius: 34px;
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 22px 60px rgba(17, 32, 39, 0.08);
    }

    .hero-copy {
      padding: 42px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 244, 236, 0.92));
    }

    .eyebrow,
    .section-tag,
    .visual-tag {
      margin: 0 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.74rem;
      font-weight: 800;
      color: #0f8b91;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      max-width: 11ch;
      font-size: clamp(3rem, 5.7vw, 5.4rem);
      line-height: 0.94;
      letter-spacing: -0.05em;
    }

    .lead {
      margin-top: 18px;
      max-width: 56ch;
      color: #50636b;
      font-size: 1.08rem;
      line-height: 1.7;
    }

    .hero-actions {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 28px;
    }

    .hero-actions a,
    .band-action {
      text-decoration: none;
      border-radius: 999px;
      padding: 15px 22px;
      font-weight: 800;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .primary-action,
    .band-action {
      background: linear-gradient(135deg, #1dbec4, #0f8b91);
      color: #fff;
    }

    .secondary-action {
      background: rgba(17, 32, 39, 0.06);
      color: #112027;
      border: 1px solid rgba(17, 32, 39, 0.08);
    }

    .hero-actions a:hover,
    .band-action:hover {
      transform: translateY(-2px);
    }

    .hero-points {
      list-style: none;
      padding: 0;
      margin: 28px 0 0;
      display: grid;
      gap: 12px;
    }

    .hero-points li {
      position: relative;
      padding-left: 18px;
      color: #42555d;
      line-height: 1.5;
    }

    .hero-points li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff8e54;
    }

    .hero-visual {
      min-height: 100%;
      border-radius: 38px;
      padding: 16px;
      background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.22), transparent 32%),
        linear-gradient(135deg, #1cbcc4 0%, #118fa1 42%, #12597a 100%);
    }

    .visual-panel {
      min-height: 100%;
      padding: 34px;
      display: grid;
      align-content: space-between;
      gap: 18px;
      color: white;
      background: linear-gradient(180deg, rgba(11, 57, 75, 0.3), rgba(9, 31, 43, 0.3));
      backdrop-filter: blur(6px);
    }

    .visual-panel h2 {
      font-size: clamp(2rem, 3.4vw, 3.2rem);
      line-height: 1.04;
      max-width: 8ch;
    }

    .visual-panel strong {
      font-size: clamp(3rem, 6vw, 4.6rem);
      line-height: 0.92;
      letter-spacing: -0.05em;
    }

    .visual-copy {
      max-width: 30ch;
      color: rgba(255, 255, 255, 0.86);
      line-height: 1.6;
    }

    .visual-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .visual-stats article {
      padding: 18px 16px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.14);
      display: grid;
      gap: 6px;
    }

    .visual-stats span {
      font-size: 1.1rem;
      font-weight: 800;
    }

    .visual-stats small {
      color: rgba(255, 255, 255, 0.78);
      line-height: 1.35;
    }

    .trust-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }

    .trust-strip span {
      padding: 12px 18px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.68);
      border: 1px solid rgba(17, 32, 39, 0.06);
      color: #42555d;
      font-weight: 700;
    }

    .benefits,
    .journey {
      display: grid;
      gap: 20px;
    }

    .section-copy {
      display: grid;
      gap: 8px;
      max-width: 760px;
    }

    .section-copy h2,
    .journey-card h2,
    .cta-band h2 {
      font-size: clamp(1.9rem, 3vw, 3rem);
      line-height: 1.05;
      letter-spacing: -0.04em;
    }

    .benefit-grid,
    .journey-steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .benefit-grid article {
      padding: 24px;
      background: rgba(255, 255, 255, 0.78);
    }

    .benefit-grid span {
      display: inline-flex;
      width: 36px;
      height: 36px;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-bottom: 16px;
      background: #fff0e8;
      color: #d94f04;
      font-weight: 800;
    }

    .benefit-grid h3,
    .journey-steps h3 {
      font-size: 1.2rem;
      line-height: 1.15;
      margin-bottom: 10px;
    }

    .benefit-grid p,
    .journey-steps p,
    .section-copy p,
    .cta-band p {
      color: #5d6d73;
      line-height: 1.6;
    }

    .journey-card {
      padding: 34px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(243, 238, 228, 0.92));
    }

    .journey-steps {
      margin-top: 24px;
    }

    .journey-steps article {
      padding: 24px;
      border-radius: 26px;
      background: rgba(17, 32, 39, 0.04);
      border: 1px solid rgba(17, 32, 39, 0.06);
    }

    .journey-steps strong {
      display: inline-flex;
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-bottom: 16px;
      background: #112027;
      color: white;
      font-size: 1rem;
    }

    .cta-band {
      padding: 30px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      background: linear-gradient(135deg, #112027, #173745);
      color: white;
    }

    .cta-band .section-tag,
    .cta-band p {
      color: rgba(255, 255, 255, 0.78);
    }

    @media (max-width: 980px) {
      .hero,
      .benefit-grid,
      .journey-steps {
        grid-template-columns: 1fr;
      }

      .cta-band {
        display: grid;
      }

      .visual-stats {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .landing {
        padding: 18px 16px 110px;
      }

      .hero-copy,
      .visual-panel,
      .journey-card,
      .cta-band,
      .benefit-grid article {
        border-radius: 26px;
      }

      .hero-copy,
      .visual-panel,
      .journey-card,
      .cta-band {
        padding: 22px;
      }

      h1 {
        max-width: none;
      }
    }
  `
})
export class HomePageComponent {}
