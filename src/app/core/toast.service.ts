import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  tone: 'info' | 'success' | 'error';
  title: string;
  message: string;
}

function generateToastId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messagesState = signal<ToastMessage[]>([]);

  readonly messages = this.messagesState.asReadonly();

  show(toast: Omit<ToastMessage, 'id'>, durationMs = 4000): void {
    const id = generateToastId();
    this.messagesState.update((messages) => [...messages, { ...toast, id }]);
    window.setTimeout(() => this.dismiss(id), durationMs);
  }

  info(title: string, message: string, durationMs?: number): void {
    this.show({ tone: 'info', title, message }, durationMs);
  }

  success(title: string, message: string, durationMs?: number): void {
    this.show({ tone: 'success', title, message }, durationMs);
  }

  error(title: string, message: string, durationMs?: number): void {
    this.show({ tone: 'error', title, message }, durationMs);
  }

  dismiss(id: string): void {
    this.messagesState.update((messages) => messages.filter((toast) => toast.id !== id));
  }
}
