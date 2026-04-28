import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FloatingCallService {
  readonly appointmentId = signal<number | null>(null);
  readonly minimized = signal(false);
  readonly position = signal({ x: 24, y: 110 });

  readonly isOpen = computed(() => this.appointmentId() !== null);

  open(appointmentId: number): void {
    this.appointmentId.set(appointmentId);
    this.minimized.set(false);
  }

  close(): void {
    this.appointmentId.set(null);
    this.minimized.set(false);
  }

  toggleMinimized(): void {
    this.minimized.update((value) => !value);
  }

  setPosition(x: number, y: number): void {
    this.position.set({
      x: Math.max(8, x),
      y: Math.max(72, y)
    });
  }
}
