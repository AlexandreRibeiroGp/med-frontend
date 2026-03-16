import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  }
}
