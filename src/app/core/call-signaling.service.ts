import { Injectable, computed, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';

export interface CallEvent {
  id: string;
  appointmentId: number;
  type: string;
  payload: string;
  sender: string | null;
  sentAt: string | null;
}

export interface RoomState {
  participantCount: number;
  participants: string[];
}

function generateClientId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

@Injectable({ providedIn: 'root' })
export class CallSignalingService {
  private client: Client | null = null;
  private readonly selfId = `client-${generateClientId()}`;
  private activeAppointmentId = signal<number | null>(null);
  private connectionState = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  private eventsState = signal<CallEvent[]>([]);
  private roomStateValue = signal<RoomState>({ participantCount: 0, participants: [] });
  private roomLimitReachedValue = signal(false);

  readonly clientId = this.selfId;
  readonly status = this.connectionState.asReadonly();
  readonly events = this.eventsState.asReadonly();
  readonly currentRoom = this.activeAppointmentId.asReadonly();
  readonly roomState = this.roomStateValue.asReadonly();
  readonly roomLimitReached = this.roomLimitReachedValue.asReadonly();
  readonly hasConnection = computed(() => this.connectionState() === 'connected');

  connect(appointmentId: number): void {
    if (this.activeAppointmentId() === appointmentId && this.client?.connected) {
      return;
    }

    this.disconnect(false);
    this.activeAppointmentId.set(appointmentId);
    this.connectionState.set('connecting');
    this.eventsState.set([]);
    this.roomStateValue.set({ participantCount: 0, participants: [] });
    this.roomLimitReachedValue.set(false);

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.port === '4200'
      ? `${window.location.hostname}:8080`
      : window.location.host;
    const wsUrl = `${wsProtocol}://${wsHost}/ws`;
    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      debug: () => undefined,
      onConnect: () => {
        this.connectionState.set('connected');
        client.subscribe(`/topic/calls/${appointmentId}`, (message) => this.handleMessage(message));
        this.publish('join', JSON.stringify({ message: 'participante entrou', clientId: this.selfId }));
      },
      onStompError: () => {
        this.connectionState.set('disconnected');
      },
      onWebSocketClose: () => {
        this.connectionState.set('disconnected');
      },
      onWebSocketError: () => {
        this.connectionState.set('disconnected');
      }
    });

    client.activate();
    this.client = client;
  }

  publish(type: string, payload: string): void {
    const appointmentId = this.activeAppointmentId();
    if (!this.client?.connected || !appointmentId) {
      return;
    }

    this.client.publish({
      destination: `/app/calls/${appointmentId}/signal`,
      body: JSON.stringify({
        appointmentId,
        type,
        payload,
        sender: this.selfId,
        sentAt: new Date().toISOString()
      })
    });
  }

  disconnect(sendLeave = true): void {
    if (sendLeave && this.client?.connected) {
      this.publish('leave', JSON.stringify({ message: 'participante saiu', clientId: this.selfId }));
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connectionState.set('disconnected');
    this.activeAppointmentId.set(null);
    this.roomStateValue.set({ participantCount: 0, participants: [] });
    this.roomLimitReachedValue.set(false);
  }

  private handleMessage(message: IMessage): void {
    const body = JSON.parse(message.body) as Omit<CallEvent, 'id'>;
    const id = `${body.sentAt ?? 'no-date'}|${body.sender ?? 'no-sender'}|${body.type}|${body.payload}`;

    if (body.type === 'room-state') {
      this.roomStateValue.set(this.parseRoomState(body.payload));
    }

    if (body.type === 'room-limit') {
      const payload = this.parseRoomLimit(body.payload);
      this.roomLimitReachedValue.set(payload.rejectedParticipant === this.selfId);
    }

    this.eventsState.update((events) => [{ ...body, id }, ...events].slice(0, 50));
  }

  private parseRoomState(payload: string): RoomState {
    try {
      const parsed = JSON.parse(payload) as RoomState;
      return {
        participantCount: parsed.participantCount ?? 0,
        participants: Array.isArray(parsed.participants) ? parsed.participants : []
      };
    } catch {
      return { participantCount: 0, participants: [] };
    }
  }

  private parseRoomLimit(payload: string): { rejectedParticipant?: string } {
    try {
      return JSON.parse(payload) as { rejectedParticipant?: string };
    } catch {
      return {};
    }
  }
}
