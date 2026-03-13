import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-stack',
  imports: [CommonModule],
  template: `
    <section class="toast-stack" *ngIf="toast.messages().length">
      <article class="toast" *ngFor="let message of toast.messages()" [class.success]="message.tone === 'success'" [class.error]="message.tone === 'error'">
        <div>
          <strong>{{ message.title }}</strong>
          <p>{{ message.message }}</p>
        </div>
        <button type="button" (click)="toast.dismiss(message.id)">Fechar</button>
      </article>
    </section>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: grid;
      gap: 12px;
      width: min(360px, calc(100vw - 32px));
    }

    .toast {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 20px;
      background: rgba(17, 32, 39, 0.94);
      color: white;
      box-shadow: 0 18px 40px rgba(17, 32, 39, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .toast.success {
      background: rgba(12, 104, 79, 0.96);
    }

    .toast.error {
      background: rgba(163, 59, 25, 0.96);
    }

    strong,
    p {
      margin: 0;
    }

    p {
      margin-top: 4px;
      color: rgba(255, 255, 255, 0.8);
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 10px 12px;
      font: inherit;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.12);
      color: inherit;
      height: fit-content;
    }
  `
})
export class ToastStackComponent {
  readonly toast = inject(ToastService);
}
