import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type ContentSection = {
  title: string;
  body: string;
};

type ContentFaq = {
  question: string;
  answer: string;
};

@Component({
  selector: 'app-content-page',
  imports: [CommonModule, RouterLink],
  template: `
    <article class="content-page">
      <header class="hero">
        <p class="eyebrow">{{ data.tag || 'Consulta online' }}</p>
        <h1>{{ data.heading }}</h1>
        <p class="intro">{{ data.intro }}</p>
        <div class="actions">
          <a routerLink="/comece" class="primary">Agendar consulta</a>
          <a routerLink="/consulta-online" class="secondary">Voltar para a página principal</a>
        </div>
      </header>

      <section class="card" *ngIf="data.highlights?.length">
        <h2>O que você encontra</h2>
        <ul class="highlights">
          <li *ngFor="let item of data.highlights">{{ item }}</li>
        </ul>
      </section>

      <section class="grid">
        <article class="card" *ngFor="let section of data.sections">
          <h2>{{ section.title }}</h2>
          <p>{{ section.body }}</p>
        </article>
      </section>

      <section class="card faq" *ngIf="data.faq?.length">
        <h2>Perguntas frequentes</h2>
        <article *ngFor="let item of data.faq">
          <h3>{{ item.question }}</h3>
          <p>{{ item.answer }}</p>
        </article>
      </section>
    </article>
  `,
  styles: `
    :host {
      display: block;
      color: #17313a;
      font-family: 'Segoe UI', sans-serif;
    }
    .content-page {
      max-width: 980px;
      margin: 0 auto;
      padding: 24px 24px 72px;
      display: grid;
      gap: 20px;
    }
    .hero,
    .card {
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.92);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }
    .hero {
      padding: 28px;
      display: grid;
      gap: 14px;
    }
    .card {
      padding: 22px;
      display: grid;
      gap: 14px;
    }
    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.74rem;
      font-weight: 700;
      color: #20b8b2;
    }
    h1, h2, h3, p {
      margin: 0;
    }
    h1 {
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 0.98;
      letter-spacing: -0.04em;
      color: #1a333a;
    }
    h2 {
      font-size: 1.35rem;
      color: #17313a;
    }
    h3 {
      font-size: 1.05rem;
      color: #17313a;
    }
    .intro,
    .card p,
    .highlights li {
      color: #617b82;
      line-height: 1.7;
      font-size: 1rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .actions a {
      text-decoration: none;
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 700;
    }
    .primary {
      background: linear-gradient(135deg, #1dbec4, #0f8b91);
      color: white;
    }
    .secondary {
      background: rgba(17, 32, 39, 0.08);
      color: #17313a;
    }
    .highlights {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    .faq article {
      display: grid;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(17, 32, 39, 0.08);
    }
    .faq article:first-of-type {
      border-top: 0;
      padding-top: 0;
    }
    @media (max-width: 720px) {
      .content-page {
        padding: 16px 16px 96px;
      }
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class ContentPageComponent {
  private readonly route = inject(ActivatedRoute);

  get data(): {
    tag?: string;
    heading: string;
    intro: string;
    highlights?: string[];
    sections: ContentSection[];
    faq?: ContentFaq[];
  } {
    return this.route.snapshot.data['content'];
  }
}

