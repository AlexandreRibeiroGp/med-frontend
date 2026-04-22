import { Routes } from '@angular/router';
import { authGuard, guestGuard, ownerGuard } from './core/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { AuthPageComponent } from './pages/auth-page.component';
import { AdminPageComponent } from './pages/admin-page.component';
import { CallRoomPageComponent } from './pages/call-room-page.component';
import { ConsultationStartPageComponent } from './pages/consultation-start-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { LegalPageComponent } from './pages/legal-page.component';

export const routes: Routes = [
  { path: 'calls/:appointmentId', component: CallRoomPageComponent, canActivate: [authGuard] },
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: HomePageComponent,
        data: {
          seo: {
            title: 'MedCallOn | Consulta medica online por R$ 49,90',
            description:
              'Consulta medica online com cadastro simples, pagamento por Pix e atendimento pela plataforma MedCallOn.',
            canonicalPath: '/',
            index: true,
            schema: 'home'
          }
        }
      },
      {
        path: 'consulta-online',
        component: HomePageComponent,
        data: {
          seo: {
            title: 'Consulta medica online | MedCallOn',
            description:
              'Atendimento medico online com fluxo simples: cadastro, pagamento por Pix e sala de consulta pela plataforma.',
            canonicalPath: '/consulta-online',
            index: true,
            schema: 'home'
          }
        }
      },
      {
        path: 'comece',
        component: ConsultationStartPageComponent,
        data: {
          seo: {
            title: 'Medicos disponiveis para consulta online | MedCallOn',
            description:
              'Veja medicos disponiveis, crie sua conta ou entre para continuar sua consulta online na MedCallOn.',
            canonicalPath: '/comece',
            index: true,
            schema: 'start'
          }
        }
      },
      {
        path: 'legal/:document',
        component: LegalPageComponent,
        data: {
          seo: {
            title: 'Documentos legais | MedCallOn',
            description: 'Politicas, termos de uso e documentos legais da plataforma MedCallOn.',
            canonicalPath: 'current',
            index: true,
            schema: 'legal'
          }
        }
      },
      {
        path: 'auth',
        component: AuthPageComponent,
        canActivate: [guestGuard],
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
        component: DashboardPageComponent,
        canActivate: [authGuard],
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
        component: AdminPageComponent,
        canActivate: [authGuard, ownerGuard],
        data: {
          seo: {
            title: 'Administracao | MedCallOn',
            description: 'Area administrativa da plataforma MedCallOn.',
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
