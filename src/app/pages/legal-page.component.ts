import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type LegalDocumentKey = 'privacidade' | 'termos' | 'cookies';

interface LegalSection {
  title: string;
  paragraphs: string[];
}

interface LegalDocument {
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  sections: LegalSection[];
}

const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  privacidade: {
    eyebrow: 'LGPD e dados sensiveis',
    title: 'Politica de Privacidade',
    summary:
      'Este documento explica quais dados pessoais a MedCallOn coleta, para quais finalidades eles sao tratados e quais direitos o titular pode exercer.',
    updatedAt: '03/04/2026',
    sections: [
      {
        title: '1. Dados tratados',
        paragraphs: [
          'A plataforma pode tratar dados cadastrais, dados de contato, dados de autenticacao, dados de agendamento, historico de atendimento, prontuario e outros dados pessoais sensiveis relacionados a saude.',
          'Dados de pagamento sao tratados para viabilizar a cobranca e a conciliacao da consulta, com integracao a prestadores especializados.'
        ]
      },
      {
        title: '2. Finalidades do tratamento',
        paragraphs: [
          'Os dados sao tratados para cadastro de conta, autenticacao, agendamento, atendimento por telemedicina, emissao de prontuario, suporte, seguranca da plataforma, prevencao a fraude e cumprimento de obrigacoes legais e regulatorias.',
          'Quando aplicavel, os dados de saude sao tratados para tutela da saude e execucao de servicos de saude, nos termos da legislacao aplicavel.'
        ]
      },
      {
        title: '3. Compartilhamento',
        paragraphs: [
          'Os dados podem ser compartilhados com profissionais de saude responsaveis pelo atendimento, operadores de infraestrutura, processadores de pagamento, provedores de comunicacao e autoridades competentes quando houver obrigacao legal.',
          'A MedCallOn nao comercializa dados pessoais sensiveis.'
        ]
      },
      {
        title: '4. Seguranca e retencao',
        paragraphs: [
          'A plataforma adota controles tecnicos e administrativos para restringir acessos, registrar operacoes criticas e proteger a confidencialidade, a integridade e a disponibilidade das informacoes.',
          'Os registros e documentos clinicos devem ser mantidos pelos prazos legais e regulatorios aplicaveis ao servico de saude.'
        ]
      },
      {
        title: '5. Direitos do titular',
        paragraphs: [
          'O titular pode solicitar confirmacao de tratamento, acesso, correcao, informacoes sobre compartilhamento e demais direitos previstos na LGPD, observadas as limitacoes legais aplicaveis a registros de saude.',
          'Para exercicio de direitos e contato do encarregado, substitua este trecho pelos dados reais do responsavel juridico e do canal oficial da operacao.'
        ]
      }
    ]
  },
  termos: {
    eyebrow: 'Regras de uso da plataforma',
    title: 'Termos de Uso e Telemedicina',
    summary:
      'Estas condicoes regulam o acesso ao portal, o uso do atendimento remoto e as responsabilidades do paciente, do profissional e do operador da plataforma.',
    updatedAt: '03/04/2026',
    sections: [
      {
        title: '1. Natureza do servico',
        paragraphs: [
          'A MedCallOn oferece infraestrutura digital para cadastro, agendamento, pagamento, atendimento remoto, disponibilizacao de documentos e acompanhamento da jornada clinica.',
          'O atendimento em saude e realizado por profissional habilitado, identificado na plataforma com nome, CRM e demais informacoes profissionais aplicaveis.'
        ]
      },
      {
        title: '2. Consentimento para telemedicina',
        paragraphs: [
          'Ao prosseguir com o atendimento remoto, o paciente declara que concorda com a realizacao da consulta por telemedicina, com o registro do atendimento em prontuario eletronico e com o tratamento dos dados necessarios a execucao do servico.',
          'Casos de urgencia grave ou emergencia devem ser direcionados imediatamente a servicos presenciais ou de emergencia adequados.'
        ]
      },
      {
        title: '3. Receitas, atestados e documentos',
        paragraphs: [
          'Receitas, atestados e demais documentos clinicos somente podem ser emitidos por profissional habilitado e devem observar as exigencias tecnicas e regulatorias aplicaveis, inclusive assinatura digital quando exigida.',
          'A plataforma nao realiza venda direta de medicamentos e nao promete cura, resultado garantido ou substituicao indevida de avaliacao medica.'
        ]
      },
      {
        title: '4. Conta e seguranca',
        paragraphs: [
          'O usuario deve fornecer informacoes verdadeiras, manter suas credenciais protegidas e comunicar imediatamente uso indevido ou suspeita de acesso nao autorizado.',
          'A plataforma pode suspender acessos em caso de fraude, uso abusivo, violacao de regras ou exigencia regulatoria.'
        ]
      },
      {
        title: '5. Informacoes obrigatorias da operacao',
        paragraphs: [
          'Antes de publicar este produto em escala comercial, substitua este trecho pelos dados reais da pessoa juridica responsavel, CNPJ, endereco, canais de contato, responsavel tecnico, politicas internas e fluxos oficiais de suporte.',
          'Tambem e necessario alinhar contratos com medicos, processadores, provedores de infraestrutura e operadores de dados.'
        ]
      }
    ]
  },
  cookies: {
    eyebrow: 'Preferencias e rastreamento',
    title: 'Politica de Cookies',
    summary:
      'Este documento descreve como a MedCallOn utiliza cookies e tecnologias semelhantes para funcionamento, seguranca, analytics e personalizacao.',
    updatedAt: '03/04/2026',
    sections: [
      {
        title: '1. Cookies essenciais',
        paragraphs: [
          'Cookies essenciais podem ser utilizados para autenticacao, manutencao de sessao, seguranca, balanceamento e funcionamento basico da aplicacao.',
          'Sem esses recursos, partes criticas do portal podem nao funcionar corretamente.'
        ]
      },
      {
        title: '2. Cookies de medicao e personalizacao',
        paragraphs: [
          'Cookies de analytics, desempenho e personalizacao devem ser utilizados com base juridica adequada e configurados conforme a experiencia escolhida pelo usuario no banner de preferencias.',
          'Se servicos de terceiros forem adicionados, a politica deve listar os fornecedores, finalidades e mecanismos de opt-out correspondentes.'
        ]
      },
      {
        title: '3. Gestao de preferencias',
        paragraphs: [
          'O banner de cookies permite aceitar, rejeitar ou personalizar preferencias. A opcao selecionada deve ser registrada e respeitada pela aplicacao.',
          'Se houver scripts de marketing, analytics ou remarketing, eles devem ser bloqueados ate a definicao da preferencia do usuario, quando juridicamente exigido.'
        ]
      }
    ]
  }
};

@Component({
  selector: 'app-legal-page',
  imports: [CommonModule, RouterLink],
  template: `
    <article class="legal-page">
      <a routerLink="/" class="back-link">Voltar para a home</a>

      <header class="hero">
        <p class="eyebrow">{{ document().eyebrow }}</p>
        <h1>{{ document().title }}</h1>
        <p class="summary">{{ document().summary }}</p>
        <p class="updated-at">Ultima atualizacao: {{ document().updatedAt }}</p>
      </header>

      <section class="content-card" *ngFor="let section of document().sections">
        <h2>{{ section.title }}</h2>
        <p *ngFor="let paragraph of section.paragraphs">{{ paragraph }}</p>
      </section>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .legal-page {
      max-width: 980px;
      margin: 0 auto;
      padding: 28px 24px 120px;
      display: grid;
      gap: 20px;
    }

    .back-link {
      justify-self: start;
      text-decoration: none;
      color: #0f8b91;
      font-weight: 700;
    }

    .hero,
    .content-card {
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 20px 56px rgba(17, 32, 39, 0.08);
    }

    .hero {
      padding: 34px;
      display: grid;
      gap: 10px;
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.74rem;
      font-weight: 800;
      color: #0f8b91;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: clamp(2.3rem, 4vw, 3.8rem);
      line-height: 0.98;
      letter-spacing: -0.04em;
    }

    .summary,
    .updated-at,
    .content-card p {
      color: #51636b;
      line-height: 1.7;
    }

    .content-card {
      padding: 26px 28px;
      display: grid;
      gap: 12px;
    }

    .content-card h2 {
      font-size: 1.32rem;
      line-height: 1.1;
      color: #112027;
    }

    @media (max-width: 720px) {
      .legal-page {
        padding: 18px 16px 110px;
      }

      .hero,
      .content-card {
        padding: 22px;
        border-radius: 24px;
      }
    }
  `
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly document = computed(() => {
    const key = (this.route.snapshot.paramMap.get('document') ?? 'privacidade') as LegalDocumentKey;
    return LEGAL_DOCUMENTS[key] ?? LEGAL_DOCUMENTS.privacidade;
  });
}
