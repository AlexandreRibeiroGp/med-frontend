import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppointmentResponse, AppointmentStatus } from '../../core/models';
import { CallSignalingService } from '../../core/call-signaling.service';
import { TelemedApiService } from '../../core/telemed-api.service';
import { ToastService } from '../../core/toast.service';
import { WebRtcCallService } from '../../core/webrtc-call.service';

@Component({
  selector: 'app-call-room-panel',
  imports: [CommonModule],
  template: `
    <article class="card" *ngIf="appointment(); else emptyState">
      <div class="call-header">
        <div>
          <h2>Consulta agendada</h2>
          <p class="muted">{{ appointmentSummary() }}</p>
          <p class="presence" [class.online]="rtc.remoteParticipantPresent()">{{ rtc.connectivityLabel() }}</p>
        </div>
      </div>

      <div class="entry-card" *ngIf="!rtc.localStream()">
        <h3>Entrar na chamada</h3>
        <p>A sala foi aberta. Ative seus dispositivos quando estiver pronto.</p>
        <button type="button" (click)="enterCall()">Ativar camera e microfone</button>
      </div>

      <ng-container *ngIf="rtc.localStream()">
        <div class="videos">
          <figure>
            <figcaption>Voce</figcaption>
            <video #localVideo playsinline autoplay muted></video>
          </figure>
          <figure>
            <figcaption>Participante remoto</figcaption>
            <video #remoteVideo playsinline autoplay></video>
          </figure>
        </div>

        <div class="status-strip">
          <div class="status-card">
            <strong>WebSocket</strong>
            <span>{{ signalingStatusLabel() }}</span>
          </div>
          <div class="status-card">
            <strong>WebRTC</strong>
            <span>{{ rtcStateLabel() }}</span>
          </div>
          <div class="status-card">
            <strong>Participantes</strong>
            <span>{{ signaling.roomState().participantCount }}/2</span>
          </div>
        </div>

        <div class="control-bar">
          <button type="button" (click)="toggleMicrophone()">{{ rtc.micEnabled() ? 'Mutar microfone' : 'Ativar microfone' }}</button>
          <button type="button" (click)="toggleCamera()">{{ rtc.cameraEnabled() ? 'Desligar camera' : 'Ligar camera' }}</button>
          <button type="button" class="secondary" [disabled]="appointment()?.status === 'COMPLETED'" (click)="completeAppointment()">Encerrar consulta</button>
          <button type="button" class="danger" (click)="leaveRoom()">Sair da sala</button>
        </div>
      </ng-container>
    </article>

    <ng-template #emptyState>
      <article class="card empty">
        <h3>Sala de atendimento</h3>
        <p>Carregando consulta.</p>
      </article>
    </ng-template>
  `,
  styles: `
    .card {
      padding: 24px;
      border-radius: 32px;
      background: rgba(11, 19, 25, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 24px 60px rgba(17, 32, 39, 0.18);
      color: white;
    }
    .empty {
      display: grid;
      place-items: center;
      min-height: 260px;
      text-align: center;
    }
    .call-header {
      display: flex;
      justify-content: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: clamp(1.6rem, 3vw, 2.4rem);
    }
    h3 {
      margin: 0;
      font-size: 1.3rem;
    }
    .muted { color: rgba(255, 255, 255, 0.7); }
    .presence {
      margin: 8px 0 0;
      color: #ffda8a;
      font-weight: 700;
    }
    .presence.online { color: #83f0d4; }
    .entry-card {
      min-height: 320px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: grid;
      place-items: center;
      text-align: center;
      gap: 14px;
      padding: 32px;
      margin-bottom: 18px;
    }
    .entry-card p {
      margin: 0;
      color: rgba(255, 255, 255, 0.74);
    }
    .videos {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 18px;
    }
    figure { margin: 0; display: grid; gap: 8px; }
    figcaption {
      font-weight: 700;
      color: rgba(255, 255, 255, 0.82);
    }
    video {
      width: 100%;
      min-height: 340px;
      background: #050a0d;
      border-radius: 28px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .status-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .status-card {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 14px 16px;
      display: grid;
      gap: 6px;
    }
    button {
      border: 0;
      border-radius: 999px;
      padding: 14px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
      color: white;
    }
    button[disabled] { opacity: 0.55; cursor: not-allowed; }
    .secondary { background: #263640; }
    .danger { background: #ffe9e3; color: #a33b19; }
    .control-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    @media (max-width: 900px) {
      .videos,
      .status-strip { grid-template-columns: 1fr; }
    }
  `
})
export class CallRoomPanelComponent {
  readonly appointment = input<AppointmentResponse | null>(null);
  readonly signaling = inject(CallSignalingService);
  readonly rtc = inject(WebRtcCallService);
  private readonly api = inject(TelemedApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localVideo = viewChild<ElementRef<HTMLVideoElement>>('localVideo');
  private readonly remoteVideo = viewChild<ElementRef<HTMLVideoElement>>('remoteVideo');
  private readonly syncedStatus = signal<AppointmentStatus | null>(null);

  constructor() {
    effect(() => {
      const appointment = this.appointment();
      if (!appointment) {
        this.signaling.disconnect();
        void this.rtc.disconnect();
        this.syncedStatus.set(null);
        return;
      }

      this.connectRoom();
    });

    effect(() => {
      const local = this.localVideo()?.nativeElement ?? null;
      const remote = this.remoteVideo()?.nativeElement ?? null;
      this.rtc.bindVideos(local, remote);
    });

    effect(() => {
      const appointment = this.appointment();
      const socketReady = this.signaling.status() === 'connected';
      if (!appointment || !socketReady || appointment.status !== 'SCHEDULED') {
        return;
      }
      this.syncStatus('CONFIRMED', false);
    });

    effect(() => {
      const appointment = this.appointment();
      if (!appointment || this.rtc.state() !== 'connected') {
        return;
      }
      if (appointment.status === 'IN_PROGRESS' || appointment.status === 'COMPLETED') {
        return;
      }
      this.syncStatus('IN_PROGRESS', false);
    });

    effect(() => {
      if (!this.signaling.roomLimitReached()) {
        return;
      }
      this.toast.error('Sala indisponivel', 'A consulta ja esta com dois participantes conectados.');
    });

    this.destroyRef.onDestroy(() => {
      void this.rtc.disconnect();
      this.rtc.stopMedia();
    });
  }

  readonly signalingStatusLabel = () => {
    switch (this.signaling.status()) {
      case 'connected':
        return 'conectado';
      case 'connecting':
        return 'conectando';
      default:
        return 'desconectado';
    }
  };

  readonly rtcStateLabel = () => {
    switch (this.rtc.state()) {
      case 'idle':
        return 'inativo';
      case 'preparing':
        return 'preparando';
      case 'ready':
        return 'pronto';
      case 'connecting':
        return 'conectando';
      case 'connected':
        return 'conectado';
      case 'reconnecting':
        return 'reconectando';
      case 'failed':
        return 'falhou';
    }
  };

  appointmentSummary(): string {
    const appointment = this.appointment();
    if (!appointment) {
      return '';
    }

    const scheduleLabel = appointment.scheduledAt
      ? new Date(appointment.scheduledAt).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';

    return `${appointment.doctorName} � ${scheduleLabel}`;
  }

  async enterCall(): Promise<void> {
    try {
      this.connectRoom();
      await this.rtc.prepareMedia();
      if (this.rtc.remoteParticipantPresent()) {
        await this.rtc.startCall();
      }
    } catch {
      this.toast.error('Falha de dispositivo', 'Nao foi possivel acessar camera e microfone.');
    }
  }

  toggleMicrophone(): void {
    this.rtc.toggleMicrophone();
  }

  toggleCamera(): void {
    this.rtc.toggleCamera();
  }

  completeAppointment(): void {
    this.syncStatus('COMPLETED', true);
  }

  leaveRoom(): void {
    this.signaling.disconnect();
    void this.rtc.disconnect();
    this.rtc.stopMedia();
    this.toast.info('Sala encerrada', 'A conexao local foi finalizada.', 2500);
  }

  private connectRoom(): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }

    const currentRoom = this.signaling.currentRoom();
    const status = this.signaling.status();
    if (currentRoom === appointment.id && (status === 'connected' || status === 'connecting')) {
      return;
    }

    this.signaling.connect(appointment.id);
  }

  private syncStatus(status: AppointmentStatus, endRoomAfter = false): void {
    const appointment = this.appointment();
    if (!appointment || this.syncedStatus() === status || appointment.status === status) {
      return;
    }

    this.syncedStatus.set(status);
    this.api
      .updateAppointmentStatus(appointment.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (status === 'COMPLETED' && endRoomAfter) {
            this.leaveRoom();
          }
        },
        error: () => {
          this.syncedStatus.set(null);
          this.toast.error('Falha ao atualizar consulta', `Nao foi possivel mover a consulta para ${status}.`);
        }
      });
  }
}
