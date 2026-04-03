import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="hero">
        <nav class="topbar">
          <div class="brand">
            <img src="/medcallon.png" alt="MedCallOn" class="brand-logo" />
          </div>
          <div class="actions">
            <a routerLink="/auth" class="ghost">Entrar</a>
            <a routerLink="/auth" class="solid">Começar</a>
          </div>
        </nav>

        <section class="hero-copy">
          <p class="eyebrow">Angular + Spring Boot</p>
          <h1>Painel clínico para pacientes e médicos no mesmo fluxo.</h1>
          <p class="lead">
            Cadastro, autenticação JWT, agenda, consultas, prontuário e preparação para videochamada
            conectados ao backend disponível em {{ apiBaseLabel }}.
          </p>
          <div class="price-highlight">
            <span class="price-kicker">Consulta online</span>
            <strong>R$ 49,90</strong>
            <p>Pagamento por Pix com confirmação rápida para liberar o atendimento.</p>
          </div>
          <div class="hero-actions">
            <a routerLink="/auth" class="solid">Acessar portal</a>
            <a routerLink="/dashboard" class="ghost">Ver painel</a>
          </div>
        </section>
      </header>

      <section class="grid">
        <article>
          <span>01</span>
          <h2>Portal do paciente</h2>
          <p>Busca por especialidade, visualização de horários, agendamento e histórico clínico.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Portal do médico</h2>
          <p>Cadastro de disponibilidade, consultas recebidas e emissão de prontuário.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Base para chamadas</h2>
          <p>Rota preparada para STOMP/WebSocket e exibição de sala no contexto da consulta.</p>
        </article>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(255, 142, 84, 0.22), transparent 28%),
        radial-gradient(circle at top right, rgba(14, 123, 131, 0.2), transparent 26%),
        linear-gradient(180deg, #fbf7f1 0%, #f2eee5 100%);
      color: #112027;
      font-family: "Segoe UI", sans-serif;
    }

    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }

    .topbar,
    .hero-actions,
    .actions {
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .brand {
      display: flex;
      align-items: center;
    }

    .brand-logo {
      height: 78px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .hero {
      display: grid;
      gap: 48px;
      padding: 24px 0 48px;
    }

    .hero-copy {
      max-width: 760px;
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.24em;
      font-size: 0.78rem;
      color: #0e7b83;
      font-weight: 700;
    }

    h1 {
      font-size: clamp(2.6rem, 7vw, 5.4rem);
      line-height: 0.96;
      margin: 12px 0 18px;
      max-width: 11ch;
    }

    .lead {
      max-width: 60ch;
      font-size: 1.08rem;
      color: #42555d;
    }

    .price-highlight {
      margin: 24px 0 0;
      display: inline-grid;
      gap: 6px;
      padding: 18px 22px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(255, 142, 84, 0.14), rgba(14, 123, 131, 0.16));
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 42px rgba(17, 32, 39, 0.08);
    }

    .price-kicker {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.74rem;
      color: #0e7b83;
      font-weight: 800;
    }

    .price-highlight strong {
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1;
      color: #112027;
    }

    .price-highlight p {
      margin: 0;
      color: #42555d;
      max-width: 34ch;
    }

    a {
      text-decoration: none;
    }

    .solid,
    .ghost {
      padding: 14px 20px;
      border-radius: 999px;
      font-weight: 700;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .solid {
      background: #112027;
      color: #fff;
    }

    .ghost {
      border: 1px solid rgba(17, 32, 39, 0.15);
      color: #112027;
      background: rgba(255, 255, 255, 0.52);
    }

    .solid:hover,
    .ghost:hover {
      transform: translateY(-2px);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    article {
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(17, 32, 39, 0.08);
      border-radius: 28px;
      padding: 24px;
      box-shadow: 0 18px 48px rgba(17, 32, 39, 0.08);
    }

    article span {
      display: inline-flex;
      width: 36px;
      height: 36px;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #fff0e8;
      color: #d94f04;
      font-weight: 800;
    }

    @media (max-width: 880px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .brand-logo {
        height: 60px;
      }
    }
  `
})
export class HomePageComponent {
  readonly apiBaseLabel = window.location.origin;
}

