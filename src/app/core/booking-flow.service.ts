import { Injectable } from '@angular/core';

export interface BookingIntent {
  doctorId: number;
  doctorName: string;
  slotId: number;
  scheduledAt: string;
}

const BOOKING_INTENT_KEY = 'med_booking_intent';

@Injectable({ providedIn: 'root' })
export class BookingFlowService {
  saveIntent(intent: BookingIntent): void {
    sessionStorage.setItem(BOOKING_INTENT_KEY, JSON.stringify(intent));
  }

  getIntent(): BookingIntent | null {
    const raw = sessionStorage.getItem(BOOKING_INTENT_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as BookingIntent;
    } catch {
      this.clearIntent();
      return null;
    }
  }

  clearIntent(): void {
    sessionStorage.removeItem(BOOKING_INTENT_KEY);
  }
}
