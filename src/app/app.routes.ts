import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { AuthPageComponent } from './pages/auth-page.component';
import { AdminPageComponent } from './pages/admin-page.component';
import { CallRoomPageComponent } from './pages/call-room-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { HomePageComponent } from './pages/home-page.component';

export const routes: Routes = [
  { path: 'calls/:appointmentId', component: CallRoomPageComponent, canActivate: [authGuard] },
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'auth', component: AuthPageComponent, canActivate: [guestGuard] },
      { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
      { path: 'admin', component: AdminPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ADMIN'] } }
    ]
  },
  { path: '**', redirectTo: '' }
];
