import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppointmentResponse, AppointmentStatus } from '../../core/models';
import { CallSignalingService } from '../../core/call-signaling.service';
import { TelemedApiService } from '../../core/telemed-api.service';
import { ToastService } from '../../core/toast.service';
import { WebRtcCallService } from '../../core/webrtc-call.service';

@Component({
  selector: 'app-call-room-panel',
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <article class="card" *ngIf="appointment(); else emptyState">
      <div class="call-header">
        <div>
          <h3>Sala {{ appointment()?.meetingRoomCode || 'sem codigo' }}</h3>
          <p class="muted">Consulta #{{ appointment()?.id }} · estado {{ appointment()?.status }}</p>
          <p class="muted">Conectividade: {{ rtc.connectivityLabel() }}</p>
          <p class="presence" [class.online]="rtc.remoteParticipantPresent()">
            {{ rtc.remoteParticipantPresent() ? 'Outro participante na sala' : 'Aguardando outro participante' }}
          </p>
        </div>
        <div class="call-actions">
          <button type="button" (click)="connectRoom()" [disabled]="signaling.status() === 'connected'">
            {{ signaling.status() === 'connected' ? 'Sala conectada' : 'Conectar sala' }}
          </button>
          <button type="button" (click)="prepareDevices()">Preparar dispositivos</button>
          <button type="button" [disabled]="!rtc.remoteParticipantPresent() || signaling.roomLimitReached()" (click)="startCall()">Conectar</button>
          <button type="button" (click)="rtc.toggleMicrophone()">{{ rtc.micEnabled() ? 'Mutar microfone' : 'Ativar microfone' }}</button>
          <button type="button" (click)="rtc.toggleCamera()">{{ rtc.cameraEnabled() ? 'Desligar camera' : 'Ligar camera' }}</button>
          <button type="button" class="secondary" (click)="reconnect()">Reconectar</button>
          <button type="button" class="secondary" [disabled]="appointment()?.status === 'COMPLETED'" (click)="completeAppointment()">Encerrar consulta</button>
          <button type="button" class="danger" (click)="leaveRoom()">Sair da sala</button>
        </div>
      </div>

      <div class="call-status-grid">
        <article>
          <strong>WebSocket</strong>
          <span>{{ signaling.status() }}</span>
        </article>
        <article>
          <strong>WebRTC</strong>
          <span>{{ rtc.state() }}</span>
        </article>
        <article>
          <strong>Participantes</strong>
          <span>{{ signaling.roomState().participantCount }}/2</span>
        </article>
        <article>
          <strong>Microfone</strong>
          <span>{{ rtc.micEnabled() ? 'ativo' : 'mutado' }}</span>
        </article>
        <article>
          <strong>Camera</strong>
          <span>{{ rtc.cameraEnabled() ? 'ativa' : 'desligada' }}</span>
        </article>
      </div>

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

      <details>
        <summary>Sinalizacao manual</summary>
        <form class="signal-form" [formGroup]="signalForm" (ngSubmit)="sendCustomSignal()">
          <input formControlName="type" placeholder="Tipo do sinal" />
          <textarea formControlName="payload" placeholder='JSON ou texto do sinal WebRTC'></textarea>
          <button type="submit">Enviar sinal manual</button>
        </form>
      </details>

      <div class="timeline compact">
        <div *ngFor="let event of signaling.events()" class="timeline-item">
          <strong>{{ event.type }}</strong>
          <span>{{ event.sentAt | date: 'dd/MM HH:mm:ss' }} · {{ event.sender || 'sem remetente' }}</span>
          <code>{{ event.payload }}</code>
        </div>
      </div>
    </article>

    <ng-template #emptyState>
      <article class="card empty">
        <h3>Sala de atendimento</h3>
        <p>Selecione uma consulta liberada no horario para iniciar a chamada.</p>
      </article>
    </ng-template>
  `,
  styles: `
    .card {
      padding: 22px;
      border-radius: 28px;
      background: rgba(255, 253, 249, 0.86);
      border: 1px solid rgba(17, 32, 39, 0.08);
      box-shadow: 0 18px 50px rgba(17, 32, 39, 0.08);
    }
    .empty { display: grid; place-items: center; min-height: 260px; text-align: center; }
    .call-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .muted { color: #667980; }
    .presence {
      margin: 8px 0 0;
      color: #8a5a12;
      font-weight: 700;
    }
    .presence.online { color: #0f684f; }
    .call-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: start;
    }
    .call-status-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .call-status-grid article {
      background: #f6f1e8;
      border-radius: 18px;
      padding: 14px 16px;
      display: grid;
      gap: 6px;
    }
    button, input, textarea { font: inherit; }
    button {
      border: 0;
      border-radius: 14px;
      padding: 12px 14px;
      font-weight: 700;
      cursor: pointer;
      background: linear-gradient(135deg, #0e7b83, #0a5d65);
      color: white;
    }
    button[disabled] { opacity: 0.55; cursor: not-allowed; }
    .secondary { background: #112027; }
    .danger { background: #ffe9e3; color: #a33b19; }
    .videos {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    figure { margin: 0; display: grid; gap: 8px; }
    video {
      width: 100%;
      min-height: 240px;
      background: #112027;
      border-radius: 22px;
      object-fit: cover;
    }
    details { margin-bottom: 16px; }
    summary { cursor: pointer; font-weight: 700; margin-bottom: 12px; }
    .signal-form, .timeline { display: grid; gap: 12px; }
    input, textarea {
      width: 100%;
      border: 1px solid #d8dfdf;
      border-radius: 16px;
      padding: 14px 16px;
      background: white;
    }
    textarea { min-height: 96px; resize: vertical; }
    .timeline-item { padding: 14px 0; border-bottom: 1px solid rgba(17, 32, 39, 0.08); display: grid; gap: 6px; }
    code {
      display: block;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f6f1e8;
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 0.84rem;
    }
    .compact { max-height: 320px; overflow: auto; }
    @media (max-width: 900px) {
      .videos,
      .call-status-grid { grid-template-columns: 1fr; }
    }
  `
})
export class CallRoomPanelComponent {
  readonly appointment = input<AppointmentResponse | null>(null);
  readonly signaling = inject(CallSignalingService);
  readonly rtc = inject(WebRtcCallService);
  private readonly api = inject(TelemedApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localVideo = viewChild<ElementRef<HTMLVideoElement>>('localVideo');
  private readonly remoteVideo = viewChild<ElementRef<HTMLVideoElement>>('remoteVideo');
  private readonly syncedStatus = signal<AppointmentStatus | null>(null);

  readonly signalForm = this.fb.nonNullable.group({
    type: ['offer', Validators.required],
    payload: ['{"sdp":"example"}', Validators.required]
  });

  constructor() {
    effect(() => {
      const appointment = this.appointment();
      if (!appointment) {
        this.signaling.disconnect();
        void this.rtc.disconnect();
        this.syncedStatus.set(null);
      }
    });

    effect(
      () => {
        const local = this.localVideo()?.nativeElement ?? null;
        const remote = this.remoteVideo()?.nativeElement ?? null;
        this.rtc.bindVideos(local, remote);
      },
      { allowSignalWrites: true }
    );

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

  async prepareDevices(): Promise<void> {
    try {
      this.connectRoom();
      await this.rtc.prepareMedia();
      this.toast.success('Dispositivos prontos', 'Camera e microfone preparados para a chamada.', 2500);
    } catch {
      this.toast.error('Falha de dispositivo', 'Nao foi possivel acessar camera e microfone.');
    }
  }

  async startCall(): Promise<void> {
    try {
      this.connectRoom();
      await this.rtc.startCall();
    } catch {
      this.toast.error('Falha na conexao', 'Nao foi possivel iniciar a chamada agora.');
    }
  }

  async reconnect(): Promise<void> {
    try {
      this.connectRoom();
      await this.rtc.reconnect();
    } catch {
      this.toast.error('Reconexao falhou', 'Tente encerrar e entrar novamente na sala.');
    }
  }

  completeAppointment(): void {
    this.syncStatus('COMPLETED', true);
  }

  leaveRoom(): void {
    this.signaling.disconnect();
    void this.rtc.disconnect();
    this.toast.info('Sala encerrada', 'A conexao local foi finalizada.', 2500);
  }

  sendCustomSignal(): void {
    if (this.signalForm.invalid) {
      this.signalForm.markAllAsTouched();
      return;
    }

    const raw = this.signalForm.getRawValue();
    this.connectRoom();
    this.signaling.publish(raw.type, raw.payload);
    this.toast.info('Sinal enviado', `Evento ${raw.type} publicado na sala.`, 2000);
  }

  connectRoom(): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }

    if (this.signaling.currentRoom() === appointment.id && this.signaling.status() === 'connected') {
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
          if (status === 'CONFIRMED') {
            this.toast.info('Consulta confirmada', 'A sala foi aberta e o atendimento esta pronto para iniciar.', 2500);
          }
          if (status === 'IN_PROGRESS') {
            this.toast.success('Atendimento em andamento', 'A consulta entrou em execucao.', 2500);
          }
          if (status === 'COMPLETED') {
            this.toast.success('Consulta encerrada', 'O atendimento foi finalizado.', 2500);
            if (endRoomAfter) {
              this.leaveRoom();
            }
          }
        },
        error: () => {
          this.syncedStatus.set(null);
          this.toast.error('Falha ao atualizar consulta', `Nao foi possivel mover a consulta para ${status}.`);
        }
      });
  }
}

