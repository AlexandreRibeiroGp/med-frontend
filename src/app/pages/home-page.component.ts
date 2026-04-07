import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing">
      <section class="hero" id="inicio">
        <div class="hero-copy">
          <p class="eyebrow">Consulta online com preco acessivel</p>
          <p class="brand-kicker">MedCallOn</p>
          <div class="price-pill">Consulta R$ 49,90</div>
          <h1>Consulta medica online com atendimento rapido, valor claro e mais seguranca para decidir.</h1>
          <p class="lead">
            Fale com um medico sem sair de casa, com pagamento por Pix, acesso simples pela plataforma
            e orientacao em uma jornada objetiva do inicio ao fim.
          </p>
          <p class="hero-highlight">
            Quando houver indicacao clinica, os medicos podem emitir receita e atestado durante o atendimento.
          </p>

          <div class="hero-proof">
            <article>
              <strong>Valor transparente</strong>
              <p>Consulta por R$ 49,90, sem surpresa no fluxo.</p>
            </article>
            <article>
              <strong>Atendimento com CRM</strong>
              <p>Plataforma pensada para telemedicina com organizacao e clareza.</p>
            </article>
          </div>

          <div class="hero-actions">
            <a routerLink="/auth" class="primary-action">Quero me consultar</a>
            <a href="#como-funciona" class="secondary-action">Como funciona?</a>
          </div>

          <div class="hero-notes">
            <span>Pagamento por Pix</span>
            <span>Profissionais com CRM</span>
            <span>Documentacao digital</span>
            <span>Atendimento sem sair de casa</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-card visual-main">
            <p>Consulta online com MedCallOn</p>
            <strong>R$ 49,90</strong>
            <small>Uma jornada pensada para transmitir confianca, clareza e facilidade desde o primeiro acesso.</small>
            <ul>
              <li>Pagamento por Pix</li>
              <li>Atendimento remoto</li>
              <li>Receita e atestado quando necessario</li>
            </ul>
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

      <section class="trust-section" aria-label="Motivos para confiar na MedCallOn">
        <div class="section-head">
          <p class="section-tag">Confianca desde o primeiro acesso</p>
          <h2>O que a pessoa precisa entender rapido antes de pagar</h2>
          <p>
            A MedCallOn foi organizada para deixar claro o valor, o passo a passo e o que pode ser emitido
            no atendimento quando houver indicacao clinica.
          </p>
        </div>

        <div class="trust-grid">
          <article class="trust-card">
            <strong>Medicos com CRM</strong>
            <p>Atendimento clinico remoto em um fluxo pensado para telemedicina.</p>
          </article>
          <article class="trust-card">
            <strong>Pagamento claro e simples</strong>
            <p>Consulta por R$ 49,90, com pagamento por Pix antes do atendimento.</p>
          </article>
          <article class="trust-card">
            <strong>Documentacao digital</strong>
            <p>Receita e atestado podem ser emitidos quando forem clinicamente indicados.</p>
          </article>
          <article class="trust-card">
            <strong>Jornada objetiva</strong>
            <p>Cadastro, pagamento e atendimento em uma mesma plataforma, sem excesso de etapas.</p>
          </article>
        </div>
      </section>

      <section class="step-section" id="como-funciona">
        <div class="section-head centered">
          <p class="section-tag">Passo a passo</p>
          <h2>Como funciona a consulta</h2>
          <p>Veja como e simples sair da duvida inicial ate o atendimento com medico.</p>
        </div>

        <div class="steps-grid">
          <article class="step-card">
            <div class="step-top">
              <div class="icon-box">01</div>
              <strong>01</strong>
            </div>
            <h3>Crie sua conta e pague com Pix</h3>
            <p>Informe seus dados, revise o valor e conclua o pagamento para liberar o atendimento.</p>
          </article>

          <article class="step-card">
            <div class="step-top">
              <div class="icon-box">02</div>
              <strong>02</strong>
            </div>
            <h3>Entre na sala e fale com o medico</h3>
            <p>Depois da confirmacao, voce segue para a jornada clinica e conversa em um ambiente remoto simples.</p>
          </article>

          <article class="step-card">
            <div class="step-top">
              <div class="icon-box">03</div>
              <strong>03</strong>
            </div>
            <h3>Receba orientacao e documentos quando aplicavel</h3>
            <p>Ao final, seus registros ficam organizados e a documentacao clinica pode ser disponibilizada quando indicada.</p>
          </article>
        </div>

        <div class="section-action">
          <a routerLink="/auth" class="dark-action">Quero me consultar</a>
        </div>
      </section>

      <section class="assurance-section">
        <div class="section-head">
          <p class="section-tag">Transparencia</p>
          <h2>Uma pagina mais clara reduz a hesitacao antes do cadastro</h2>
        </div>

        <div class="assurance-grid">
          <article class="assurance-card">
            <h3>O que esta claro antes do cadastro</h3>
            <ul>
              <li>Valor da consulta</li>
              <li>Forma de pagamento</li>
              <li>Como funciona o atendimento</li>
              <li>Quando pode haver receita ou atestado</li>
            </ul>
          </article>
          <article class="assurance-card">
            <h3>Para quem esta decidindo agora</h3>
            <p>
              A pagina foi desenhada para responder rapido se a consulta e remota, como o pagamento funciona
              e quais documentos podem ser emitidos quando houver indicacao clinica.
            </p>
            <a routerLink="/auth" class="inline-action">Iniciar cadastro</a>
          </article>
        </div>
      </section>

      <!-- Secao de medicos temporariamente oculta enquanto ha apenas um profissional ativo na home. -->

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
            <h3>A consulta e com medico de verdade?</h3>
            <p>Sim. A proposta da MedCallOn e organizar o atendimento remoto com profissionais com CRM em uma jornada digital clara.</p>
          </article>
          <article>
            <h3>Preciso criar conta antes?</h3>
            <p>Sim. O cadastro protege seus dados e ajuda a manter sua jornada, documentos e historico organizados.</p>
          </article>
          <article>
            <h3>Receita e atestado sao garantidos?</h3>
            <p>Nao. Eles podem ser emitidos quando houver indicacao clinica durante a consulta, de acordo com a avaliacao do medico.</p>
          </article>
          <article>
            <h3>Preciso instalar algum aplicativo?</h3>
            <p>Nao. A ideia e entrar na plataforma, concluir o fluxo e seguir para o atendimento online de forma simples.</p>
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
          <h2>Seu atendimento pode comecar hoje, com valor claro, fluxo simples e uma decisao mais segura antes do pagamento.</h2>
        </div>
        <a routerLink="/auth" class="band-action">Quero me consultar</a>
      </section>

      <footer class="legal-footer">
        <span class="footer-brand">MedCallOn | medcallon.com.br</span>
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
      min-height: 72vh;
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

    .brand-kicker {
      margin: -8px 0 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: #17313a;
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
      max-width: 12.5ch;
      font-size: clamp(3rem, 5.2vw, 5.4rem);
      line-height: 0.98;
      letter-spacing: -0.06em;
      color: #1a333a;
    }

    .lead {
      max-width: 56ch;
      color: #57727a;
      font-size: 1.12rem;
      line-height: 1.75;
    }

    .hero-highlight {
      max-width: 52ch;
      padding: 14px 18px;
      border-radius: 18px;
      background: #f3fbfb;
      border: 1px solid rgba(32, 184, 178, 0.16);
      color: #1f555d;
      font-weight: 700;
      line-height: 1.6;
    }

    .hero-proof {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .hero-proof article {
      padding: 16px 18px;
      border-radius: 22px;
      background: #fbfdfd;
      border: 1px solid rgba(23, 49, 58, 0.08);
      box-shadow: 0 14px 30px rgba(23, 49, 58, 0.05);
    }

    .hero-proof strong {
      display: block;
      margin-bottom: 6px;
      color: #17313a;
      font-size: 1rem;
    }

    .hero-proof p {
      color: #5b757d;
      line-height: 1.55;
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
      align-self: start;
      margin-top: 132px;
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
    }.visual-main p,
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

    .visual-main ul {
      position: relative;
      z-index: 1;
      margin: 2px 0 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
      color: rgba(255, 255, 255, 0.96);
      font-weight: 700;
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
    .trust-section,
    .assurance-section,
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

    .trust-grid,
    .assurance-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .trust-card,
    .assurance-card {
      padding: 24px 26px;
      border-radius: 28px;
      background: #f8fcfc;
      border: 1px solid rgba(23, 49, 58, 0.07);
      box-shadow: 0 18px 38px rgba(23, 49, 58, 0.05);
    }

    .trust-card strong {
      display: block;
      margin-bottom: 8px;
      font-size: 1.1rem;
      color: #20353b;
    }

    .trust-card p,
    .assurance-card p {
      color: #67838a;
      line-height: 1.65;
    }

    .assurance-card h3 {
      margin-bottom: 10px;
      font-size: 1.25rem;
      color: #20353b;
    }

    .assurance-card ul {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 10px;
      color: #4f6c74;
      font-weight: 700;
    }

    .inline-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 16px;
      padding: 14px 20px;
      border-radius: 16px;
      background: #20353b;
      color: #fff;
      text-decoration: none;
      font-weight: 800;
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

    .footer-brand {
      width: 100%;
      text-align: center;
      color: #17313a;
      font-weight: 800;
    }

    .legal-footer a {
      color: #20a8a4;
      text-decoration: none;
      font-weight: 700;
    }

    @media (max-width: 1100px) {
      .hero,
      .steps-grid,
      .trust-grid,
      .assurance-grid,
      .cta-band {
        grid-template-columns: 1fr 1fr;
      }

      .hero {
        grid-template-columns: 1fr;
      }

      .cta-band {
        grid-template-columns: 1fr;
      }

      .hero-visual {
        margin-top: 0;
      }
    }

    @media (max-width: 820px) {
      .landing {
        padding: 18px 16px 120px;
        gap: 40px;
      }

      .hero-proof,
      .steps-grid,
      .trust-grid,
      .assurance-grid,
      .faq-list {
        grid-template-columns: 1fr;
      }

      .hero {
        min-height: auto;
      }

      h1 {
        max-width: none;
        font-size: 3rem;
        line-height: 1.02;
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
  // A vitrine de medicos permanece comentada por enquanto para manter a home mais enxuta.
}

