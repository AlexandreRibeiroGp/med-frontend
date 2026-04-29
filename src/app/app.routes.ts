import { Routes } from '@angular/router';
import { authGuard, guestGuard, ownerGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'calls/:appointmentId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/call-room-page.component').then((m) => m.CallRoomPageComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/home-page.component').then((m) => m.HomePageComponent),
        data: {
          seo: {
            title: 'MedCallOn | Consulta médica online por R$ 49,90',
            description:
              'Consulta médica online com cadastro simples, pagamento por Pix e atendimento pela plataforma MedCallOn.',
            canonicalPath: '/',
            index: true,
            schema: 'home'
          }
        }
      },
      {
        path: 'consulta-online',
        loadComponent: () => import('./pages/home-page.component').then((m) => m.HomePageComponent),
        data: {
          seo: {
            title: 'Consulta médica online | MedCallOn',
            description:
              'Atendimento médico online com fluxo simples: cadastro, pagamento por Pix e sala de consulta pela plataforma.',
            canonicalPath: '/consulta-online',
            index: true,
            schema: 'home'
          }
        }
      },
      {
        path: 'medico-online-pix',
        loadComponent: () => import('./pages/content-page.component').then((m) => m.ContentPageComponent),
        data: {
          seo: {
            title: 'Médico online com pagamento por Pix | MedCallOn',
            description:
              'Veja como funciona a consulta com médico online e pagamento por Pix na MedCallOn, com agendamento simples e acesso pela plataforma.',
            canonicalPath: '/medico-online-pix',
            index: true,
            schema: 'content'
          },
          content: {
            tag: 'Pagamento por Pix',
            heading: 'Médico online com pagamento por Pix',
            intro:
              'Na MedCallOn você faz o cadastro, escolhe o atendimento e conclui o pagamento por Pix para liberar a consulta online pela plataforma.',
            highlights: [
              'Consulta online com acesso pela própria plataforma',
              'Pagamento por Pix para liberar o atendimento',
              'Fluxo simples para agendamento e entrada na sala'
            ],
            sections: [
              {
                title: 'Como funciona',
                body:
                  'O paciente realiza o cadastro, informa os dados básicos, escolhe o melhor horário e conclui o Pix. Após a confirmação, a sala de atendimento fica disponível na plataforma.'
              },
              {
                title: 'Quando pode ser útil',
                body:
                  'A consulta online é útil para dúvidas clínicas gerais, orientação inicial, sintomas leves a moderados e situações em que a pessoa busca rapidez e praticidade sem sair de casa.'
              },
              {
                title: 'O que observar antes do atendimento',
                body:
                  'Tenha um local silencioso, conexão estável e, se possível, câmera e microfone liberados. Se preferir, a plataforma também oferece chat durante a consulta.'
              },
              {
                title: 'Acesso pela plataforma',
                body:
                  'Depois do pagamento confirmado, a pessoa entra no painel e acessa a sala de atendimento no horário disponível para a consulta.'
              }
            ],
            faq: [
              {
                question: 'A consulta é liberada logo após o Pix?',
                answer: 'A sala é liberada após a confirmação do pagamento no sistema.'
              },
              {
                question: 'Posso fazer a consulta pelo celular?',
                answer: 'Sim. A plataforma foi ajustada para uso em celular e computador.'
              }
            ]
          }
        }
      },
      {
        path: 'consulta-online-atestado',
        loadComponent: () => import('./pages/content-page.component').then((m) => m.ContentPageComponent),
        data: {
          seo: {
            title: 'Consulta online e atestado médico | MedCallOn',
            description:
              'Entenda como funciona a consulta online na MedCallOn e em quais situações o médico pode avaliar a necessidade de atestado conforme o caso clínico.',
            canonicalPath: '/consulta-online-atestado',
            index: true,
            schema: 'content'
          },
          content: {
            tag: 'Consulta online',
            heading: 'Consulta online e atestado médico',
            intro:
              'Durante a consulta online, o médico avalia o quadro clínico e orienta a conduta adequada. A emissão de atestado depende da avaliação profissional em cada caso.',
            highlights: [
              'Avaliação individual pelo médico',
              'Atendimento por plataforma própria',
              'Orientação clínica conforme sintomas e histórico'
            ],
            sections: [
              {
                title: 'O que acontece na consulta',
                body:
                  'Na teleconsulta, o médico ouve a queixa, revisa sintomas, contexto e evolução do quadro. A conduta é definida de acordo com a avaliação clínica realizada durante o atendimento.'
              },
              {
                title: 'Quando o atestado pode ser analisado',
                body:
                  'A necessidade de atestado não é automática. O médico decide conforme o caso, os sinais apresentados e a consistência clínica do atendimento.'
              },
              {
                title: 'Importância do relato correto',
                body:
                  'Para receber a melhor orientação, o paciente deve informar sintomas, início do quadro, medicações em uso e antecedentes relevantes de forma clara.'
              },
              {
                title: 'Quando procurar atendimento presencial',
                body:
                  'Sinais de gravidade, falta de ar, dor intensa, alteração do nível de consciência ou piora rápida podem exigir avaliação presencial imediata.'
              }
            ],
            faq: [
              {
                question: 'Todo atendimento online gera atestado?',
                answer: 'Não. A emissão depende exclusivamente da avaliação do médico durante a consulta.'
              },
              {
                question: 'Posso ser orientado a procurar atendimento presencial?',
                answer: 'Sim. Se houver sinais que exijam exame físico ou urgência, o médico pode orientar avaliação presencial.'
              }
            ]
          }
        }
      },
      {
        path: 'clinico-geral-online',
        loadComponent: () => import('./pages/content-page.component').then((m) => m.ContentPageComponent),
        data: {
          seo: {
            title: 'Clínico geral online | MedCallOn',
            description:
              'Saiba como funciona o atendimento com clínico geral online na MedCallOn para orientação inicial, avaliação de sintomas comuns e encaminhamento quando necessário.',
            canonicalPath: '/clinico-geral-online',
            index: true,
            schema: 'content'
          },
          content: {
            tag: 'Clínico geral',
            heading: 'Clínico geral online',
            intro:
              'O clínico geral online pode ajudar na avaliação inicial de sintomas comuns, orientar condutas e indicar os próximos passos conforme a necessidade do paciente.',
            highlights: [
              'Orientação inicial para sintomas frequentes',
              'Atendimento com praticidade pelo computador ou celular',
              'Encaminhamento quando há necessidade de continuidade'
            ],
            sections: [
              {
                title: 'Queixas frequentes',
                body:
                  'Dor de garganta, dor de cabeça, febre, desconfortos digestivos, sintomas gripais e outras queixas comuns podem ser avaliadas inicialmente em consulta online.'
              },
              {
                title: 'Como o clínico geral ajuda',
                body:
                  'O profissional faz uma avaliação ampla do quadro, considera o histórico informado e orienta medidas iniciais, observação, retorno ou encaminhamento conforme o caso.'
              },
              {
                title: 'Vantagens da teleconsulta',
                body:
                  'A consulta online reduz deslocamentos, facilita o primeiro contato médico e ajuda a organizar o cuidado com mais rapidez em situações não emergenciais.'
              },
              {
                title: 'Quando não adiar atendimento presencial',
                body:
                  'Quadros com sinais de urgência, piora importante ou sintomas intensos devem ser direcionados para avaliação presencial e, quando necessário, serviço de urgência.'
              }
            ],
            faq: [
              {
                question: 'Clínico geral online serve para primeira avaliação?',
                answer: 'Sim. Ele pode fazer a avaliação inicial e orientar a melhor conduta para o caso.'
              },
              {
                question: 'A consulta online substitui toda consulta presencial?',
                answer: 'Não em todos os casos. Algumas situações exigem exame físico e avaliação presencial.'
              }
            ]
          }
        }
      },
      {
        path: 'comece',
        loadComponent: () => import('./pages/consultation-start-page.component').then((m) => m.ConsultationStartPageComponent),
        data: {
          seo: {
            title: 'Médicos disponíveis para consulta online | MedCallOn',
            description:
              'Veja médicos disponíveis, crie sua conta ou entre para continuar sua consulta online na MedCallOn.',
            canonicalPath: '/comece',
            index: true,
            schema: 'start'
          }
        }
      },
      {
        path: 'lgpd/solicitacoes',
        loadComponent: () => import('./pages/lgpd-request-page.component').then((m) => m.LgpdRequestPageComponent),
        data: {
          seo: {
            title: 'Solicitação LGPD | MedCallOn',
            description: 'Canal de atendimento para solicitações do titular de dados na plataforma MedCallOn.',
            canonicalPath: '/lgpd/solicitacoes',
            index: true,
            schema: 'legal'
          }
        }
      },
      {
        path: 'legal/:document',
        loadComponent: () => import('./pages/legal-page.component').then((m) => m.LegalPageComponent),
        data: {
          seo: {
            title: 'Documentos legais | MedCallOn',
            description: 'Políticas, termos de uso e documentos legais da plataforma MedCallOn.',
            canonicalPath: 'current',
            index: true,
            schema: 'legal'
          }
        }
      },
      {
        path: 'auth',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/auth-page.component').then((m) => m.AuthPageComponent),
        data: {
          seo: {
            title: 'Entrar ou criar conta | MedCallOn',
            description: 'Entre ou crie sua conta para acessar a plataforma MedCallOn.',
            canonicalPath: '/auth',
            index: false,
            schema: 'none'
          }
        }
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/dashboard-page.component').then((m) => m.DashboardPageComponent),
        data: {
          seo: {
            title: 'Painel | MedCallOn',
            description: 'Painel interno da plataforma MedCallOn.',
            canonicalPath: '/dashboard',
            index: false,
            schema: 'none'
          }
        }
      },
      {
        path: 'admin',
        canActivate: [authGuard, ownerGuard],
        loadComponent: () => import('./pages/admin-page.component').then((m) => m.AdminPageComponent),
        data: {
          seo: {
            title: 'Administração | MedCallOn',
            description: 'Área administrativa da plataforma MedCallOn.',
            canonicalPath: '/admin',
            index: false,
            schema: 'none'
          }
        }
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
