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
    eyebrow: 'LGPD e dados sensíveis',
    title: 'Política de Privacidade',
    summary:
      'Este documento explica quais dados pessoais a MedCallOn coleta, como eles são tratados, com quem podem ser compartilhados e quais direitos o titular pode exercer nos termos da LGPD.',
    updatedAt: '28/04/2026',
    sections: [
      {
        title: '1. Identificação do responsável pela plataforma',
        paragraphs: [
          'A plataforma MedCallOn é operada por Aleri Desenvolvimento de Software LTDA, inscrita no CNPJ sob o nº 41.418.939/0001-58, responsável pela infraestrutura tecnológica, autenticação, agenda, sala virtual, prontuário eletrônico, armazenamento de registros e fluxos operacionais da plataforma.',
          'Para os atendimentos disponibilizados por meio da plataforma, a responsável técnica indicada é Carla Paes Manfio, médica regularmente inscrita no CRM, observadas as exigências regulatórias aplicáveis ao serviço de telemedicina.'
        ]
      },
      {
        title: '2. Dados pessoais tratados',
        paragraphs: [
          'A MedCallOn pode tratar dados cadastrais e de identificação, como nome completo, e-mail, telefone, CPF ou documento informado, data de nascimento, profissão, endereço, dados de autenticação e registros de acesso.',
          'Também podem ser tratados dados de agendamento, histórico de consultas, comunicações via chat, conteúdo de prontuário, informações clínicas fornecidas durante o atendimento, arquivos de receitas e outros dados pessoais sensíveis relacionados à saúde do paciente.',
          'Nos casos de pagamento, poderão ser tratados dados necessários à confirmação financeira da consulta, incluindo identificadores de transação, status do pagamento, data, valor e registros de integração com provedores especializados.'
        ]
      },
      {
        title: '3. Finalidades do tratamento',
        paragraphs: [
          'Os dados são tratados para permitir o cadastro do usuário, autenticação na conta, agendamento de consultas, realização de atendimento por telemedicina, emissão de documentos clínicos, registro em prontuário eletrônico, suporte, segurança da plataforma, prevenção a fraude e cumprimento de obrigações legais e regulatórias.',
          'Dados de saúde são tratados na medida necessária à tutela da saúde, à execução do serviço de telemedicina e ao cumprimento das obrigações éticas, legais e regulatórias aplicáveis ao atendimento médico.'
        ]
      },
      {
        title: '4. Compartilhamento de dados',
        paragraphs: [
          'Os dados podem ser compartilhados com médicos e profissionais de saúde responsáveis pelo atendimento, prestadores de infraestrutura em nuvem, provedores de comunicação, sistemas de pagamento, serviços de envio de e-mail, autoridades públicas e órgãos reguladores quando houver obrigação legal, regulatória ou judicial.',
          'A MedCallOn não comercializa dados pessoais sensíveis. O compartilhamento é realizado de forma limitada à necessidade operacional, contratual ou legal do serviço prestado.'
        ]
      },
      {
        title: '5. Base legal, segurança e retenção',
        paragraphs: [
          'O tratamento de dados pessoais e dados pessoais sensíveis ocorre com base nas hipóteses legais previstas na Lei Geral de Proteção de Dados, inclusive execução de contrato, legítimo interesse quando cabível, cumprimento de obrigação legal ou regulatória e tutela da saúde.',
          'A plataforma adota medidas técnicas e administrativas voltadas à proteção da confidencialidade, integridade e disponibilidade das informações. Registros clínicos e documentos médicos poderão ser mantidos pelos prazos exigidos pela legislação e pelas normas aplicáveis ao prontuário e à telemedicina.'
        ]
      },
      {
        title: '6. Direitos do titular e contato',
        paragraphs: [
          'O titular poderá solicitar, nos limites da lei, confirmação da existência de tratamento, acesso aos dados, correção de dados incompletos ou desatualizados, informações sobre compartilhamento e demais direitos previstos na LGPD.',
          'Solicitações relacionadas à privacidade e proteção de dados podem ser encaminhadas pelos canais oficiais da plataforma, inclusive pelo e-mail mmedcallon@gmail.com, sem prejuízo de eventuais exigências adicionais para confirmação da identidade do solicitante.'
        ]
      }
    ]
  },
  termos: {
    eyebrow: 'Regras de uso da plataforma',
    title: 'Termos de Uso e Telemedicina',
    summary:
      'Estas condições regulam o acesso ao portal, o uso do atendimento remoto e as responsabilidades do paciente, do profissional e do operador tecnológico da plataforma.',
    updatedAt: '28/04/2026',
    sections: [
      {
        title: '1. Identificação da plataforma',
        paragraphs: [
          'A MedCallOn é uma plataforma digital operada por Aleri Desenvolvimento de Software LTDA, CNPJ nº 41.418.939/0001-58, destinada ao cadastro de usuários, agendamento, pagamento, atendimento remoto, troca de mensagens, armazenamento de registros e disponibilização de documentos relacionados à consulta.',
          'A responsável técnica informada para a operação é Carla Paes Manfio, observadas as exigências regulatórias aplicáveis à atividade médica e à telemedicina.'
        ]
      },
      {
        title: '2. Natureza do serviço',
        paragraphs: [
          'A plataforma fornece infraestrutura tecnológica para viabilizar a jornada digital do paciente. O atendimento em saúde é realizado por profissional habilitado, identificado na plataforma com nome, CRM e demais informações aplicáveis.',
          'A MedCallOn não substitui serviço hospitalar, pronto-socorro ou atendimento presencial de urgência e emergência.'
        ]
      },
      {
        title: '3. Consentimento para telemedicina',
        paragraphs: [
          'Ao prosseguir com o atendimento remoto, o paciente declara estar ciente de que a consulta ocorrerá por telemedicina, com registro do atendimento em prontuário eletrônico e tratamento dos dados necessários à execução do serviço.',
          'Casos de urgência grave, emergência, sintomas intensos, piora rápida ou situações que exijam exame físico devem ser direcionados imediatamente para atendimento presencial adequado.'
        ]
      },
      {
        title: '4. Receitas, atestados e documentos',
        paragraphs: [
          'Receitas, atestados, relatórios e demais documentos clínicos somente poderão ser emitidos por profissional habilitado, conforme avaliação médica e observadas as exigências técnicas, éticas e regulatórias aplicáveis.',
          'A plataforma não realiza venda direta de medicamentos, não garante emissão automática de documento médico e não promete resultado clínico específico.'
        ]
      },
      {
        title: '5. Conta, conduta e segurança',
        paragraphs: [
          'O usuário deve fornecer informações verdadeiras, manter suas credenciais em sigilo, utilizar a plataforma de forma lícita e comunicar imediatamente qualquer suspeita de uso indevido ou acesso não autorizado.',
          'A MedCallOn poderá suspender acessos em caso de fraude, uso abusivo, violação destes termos, exigência de segurança ou obrigação legal.'
        ]
      },
      {
        title: '6. Pagamento, cancelamento e responsabilidade',
        paragraphs: [
          'A liberação da consulta depende da confirmação do pagamento nos fluxos disponibilizados pela plataforma. Condições de reagendamento, cancelamento e acesso à sala podem variar conforme a operação vigente e o horário da consulta.',
          'A responsabilidade clínica pelo ato médico é do profissional de saúde responsável pelo atendimento, sem prejuízo das obrigações da plataforma quanto à infraestrutura, segurança e suporte operacional.'
        ]
      }
    ]
  },
  cookies: {
    eyebrow: 'Preferências e rastreamento',
    title: 'Política de Cookies',
    summary:
      'Este documento descreve como a MedCallOn utiliza cookies e tecnologias semelhantes para funcionamento, segurança, medição de acesso e aprimoramento da experiência do usuário.',
    updatedAt: '28/04/2026',
    sections: [
      {
        title: '1. O que são cookies',
        paragraphs: [
          'Cookies são pequenos arquivos armazenados no navegador do usuário para permitir reconhecimento de sessão, segurança, preferências e análise de uso da plataforma.',
          'A MedCallOn utiliza cookies próprios e, quando aplicável, tecnologias de terceiros integradas à operação do site.'
        ]
      },
      {
        title: '2. Cookies essenciais',
        paragraphs: [
          'Cookies essenciais podem ser utilizados para autenticação, manutenção de sessão, segurança da navegação, estabilidade da aplicação e funcionamento básico de áreas restritas da plataforma.',
          'Sem esses recursos, partes relevantes do portal, como login, navegação protegida, atendimento e preferências mínimas de uso, podem não funcionar corretamente.'
        ]
      },
      {
        title: '3. Cookies de medição e desempenho',
        paragraphs: [
          'A plataforma pode utilizar cookies e tecnologias equivalentes para medir acesso, analisar desempenho, compreender comportamento de navegação e aprimorar a experiência do usuário.',
          'Esses recursos podem incluir integrações com ferramentas de analytics e medição, observadas as preferências manifestadas pelo usuário e a base legal aplicável.'
        ]
      },
      {
        title: '4. Gestão de preferências',
        paragraphs: [
          'O banner de cookies da MedCallOn permite aceitar, rejeitar ou personalizar preferências, conforme a implementação disponível no site. A escolha realizada pelo usuário deve ser registrada e respeitada pela plataforma.',
          'O usuário também poderá, a qualquer tempo, excluir cookies diretamente nas configurações do navegador, ciente de que essa ação pode afetar parte da experiência ou o funcionamento de recursos da plataforma.'
        ]
      },
      {
        title: '5. Informações de contato',
        paragraphs: [
          'A plataforma é operada por Aleri Desenvolvimento de Software LTDA, CNPJ nº 41.418.939/0001-58. Dúvidas sobre esta Política de Cookies podem ser encaminhadas pelos canais oficiais da MedCallOn, inclusive pelo e-mail mmedcallon@gmail.com.',
          'Quando houver atualização relevante desta política, a nova versão passará a valer a partir da data de publicação nesta página.'
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
