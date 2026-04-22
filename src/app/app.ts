import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsService } from './core/analytics.service';
import { SeoService } from './core/seo.service';
import { SessionTimeoutService } from './core/session-timeout.service';
import { ToastStackComponent } from './shared/toast-stack.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastStackComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    inject(SessionTimeoutService);
    inject(AnalyticsService);
    inject(SeoService).init();
  }
}
