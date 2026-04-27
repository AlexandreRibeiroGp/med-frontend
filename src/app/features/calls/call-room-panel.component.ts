import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concatMap, from, last } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AppointmentResponse, AppointmentStatus, MedicalRecordResponse } from '../../core/models';
import { CallEvent, CallSignalingService } from '../../core/call-signaling.service';
import { TelemedApiService } from '../../core/telemed-api.service';
import { ToastService } from '../../core/toast.service';
import { WebRtcCallService } from '../../core/webrtc-call.service';

interface ChatMessage {
  id: string;
  text: string;
  sender: string | null;
  sentAt: string | null;
  mine: boolean;
}

@Component({
  selector: 'app-call-room-panel',
  imports: [CommonModule, FormsModule],
  template: `
    <article class="card" *ngIf="appointment(); else emptyState">
      <div class="call-header">
        <div>
          <h2>Consulta agendada</h2>
          <p class="muted">{{ appointmentSummary() }}</p>
          <p class="presence" [class.online]="rtc.remoteParticipantPresent()">{{ rtc.connectivityLabel() }}</p>
        </div>
      </div>

      <div class="room-layout" [class.doctor-layout]="isDoctor()" [class.compact-mode]="compactMode()">
        <section class="media-column">
          <div class="entry-card" *ngIf="!rtc.localStream()">
            <h3>Entrar na chamada</h3>
            <p>A sala foi aberta. Se preferir, voce pode falar com o medico ou paciente apenas pelo chat.</p>
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
              <audio #remoteAudio autoplay></audio>
            </div>

            <div class="control-bar">
              <button type="button" (click)="toggleMicrophone()">{{ rtc.micEnabled() ? 'Mutar microfone' : 'Ativar microfone' }}</button>
              <button type="button" (click)="toggleCamera()">{{ rtc.cameraEnabled() ? 'Desligar câmera' : 'Ligar câmera' }}</button>
              <button type="button" class="secondary" [disabled]="appointment()?.status === 'COMPLETED'" (click)="completeAppointment()">Encerrar consulta</button>
              <button type="button" class="danger" (click)="leaveRoom()">Sair da sala</button>
            </div>

            <section *ngIf="isDoctor()" class="notes-panel">
              <div class="notes-header">
                <div>
                  <h3>Prontuário clínico</h3>
                  <p>Digite durante a consulta e salve junto com a conversa do chat.</p>
                </div>
                <button type="button" class="secondary" (click)="saveMedicalRecordDraft()">
                  Salvar prontuário
                </button>
              </div>
              <textarea
                [(ngModel)]="medicalNotesDraft"
                name="medicalNotesDraft"
                rows="8"
                maxlength="4000"
                placeholder="Anotações clínicas da consulta"
              ></textarea>
            </section>
          </ng-container>

          <div class="control-bar" *ngIf="!rtc.localStream()">
            <button type="button" class="secondary" [disabled]="appointment()?.status === 'COMPLETED'" (click)="completeAppointment()">Encerrar consulta</button>
            <button type="button" class="danger" (click)="leaveRoom()">Sair da sala</button>
          </div>
        </section>

        <aside class="chat-panel">
          <div class="chat-header">
            <div>
              <h3>Chat da consulta</h3>
              <p>Use o texto se nao quiser abrir camera ou microfone.</p>
            </div>
          </div>

          <div class="chat-messages" #chatMessages>
            <div *ngIf="!chatMessagesList().length" class="chat-empty">
              Nenhuma mensagem ainda. Escreva para iniciar a conversa.
            </div>

            <article *ngFor="let message of chatMessagesList()" class="chat-message" [class.mine]="message.mine">
              <span class="chat-author">{{ message.mine ? 'Voce' : 'Participante' }}</span>
              <p>{{ message.text }}</p>
              <time *ngIf="message.sentAt">{{ message.sentAt | date: 'HH:mm' }}</time>
            </article>
          </div>

          <form class="chat-form" (ngSubmit)="sendChatMessage()">
            <textarea
              name="chatMessage"
              [(ngModel)]="chatDraft"
              rows="3"
              maxlength="1000"
              placeholder="Digite sua mensagem..."
            ></textarea>
            <button type="submit" [disabled]="!canSendChat()">Enviar mensagem</button>
          </form>
        </aside>
      </div>
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
      min-height: 220px;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: grid;
      place-items: center;
      text-align: center;
      gap: 14px;
      padding: 32px;
    }
    .entry-card p {
      margin: 0;
      color: rgba(255, 255, 255, 0.74);
    }
    .room-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 18px;
      align-items: start;
    }
    .room-layout.compact-mode {
      grid-template-columns: minmax(0, 1fr) 300px;
      gap: 12px;
    }
    .media-column {
      display: grid;
      gap: 18px;
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
    .compact-mode video {
      min-height: 220px;
      max-height: 280px;
      border-radius: 22px;
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
    .compact-mode .control-bar {
      gap: 10px;
    }
    .compact-mode button {
      padding: 12px 14px;
      font-size: 0.92rem;
    }
    .notes-panel {
      display: grid;
      gap: 12px;
      padding: 18px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .compact-mode .notes-panel {
      padding: 14px;
      border-radius: 20px;
    }
    .notes-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .notes-header p {
      margin: 6px 0 0;
      color: rgba(255, 255, 255, 0.68);
    }
    .notes-panel textarea {
      width: 100%;
      min-height: 220px;
      resize: vertical;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 14px 16px;
      font: inherit;
      color: white;
      background: rgba(7, 12, 15, 0.6);
      box-sizing: border-box;
    }
    .compact-mode .notes-panel textarea {
      min-height: 160px;
    }
    .chat-panel {
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: grid;
      grid-template-rows: auto minmax(260px, 1fr) auto;
      min-height: 100%;
      overflow: hidden;
    }
    .compact-mode .chat-panel {
      border-radius: 22px;
      grid-template-rows: auto minmax(220px, 1fr) auto;
    }
    .chat-header {
      padding: 20px 20px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .chat-header h3 {
      font-size: 1.15rem;
      margin: 0 0 6px;
    }
    .chat-header p {
      margin: 0;
      color: rgba(255, 255, 255, 0.68);
    }
    .chat-messages {
      display: grid;
      align-content: start;
      gap: 12px;
      padding: 18px;
      max-height: 520px;
      overflow: auto;
    }
    .compact-mode .chat-messages {
      max-height: 380px;
      padding: 14px;
    }
    .chat-empty {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;
    }
    .chat-message {
      display: grid;
      gap: 6px;
      justify-items: start;
      padding: 12px 14px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.08);
    }
    .chat-message.mine {
      justify-items: end;
      margin-left: 18px;
      background: rgba(14, 123, 131, 0.22);
    }
    .chat-author,
    .chat-message time {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.65);
    }
    .chat-message p {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .chat-form {
      display: grid;
      gap: 12px;
      padding: 16px 18px 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .chat-form textarea {
      width: 100%;
      min-height: 92px;
      resize: vertical;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 14px 16px;
      font: inherit;
      color: white;
      background: rgba(7, 12, 15, 0.6);
      box-sizing: border-box;
    }
    @media (max-width: 900px) {
      .room-layout {
        grid-template-columns: 1fr;
      }
      .videos { grid-template-columns: 1fr; }
    }
    .doctor-layout .videos {
      gap: 12px;
    }
    .doctor-layout video {
      min-height: 220px;
      max-height: 280px;
    }
  `
})
export class CallRoomPanelComponent {
  readonly appointment = input<AppointmentResponse | null>(null);
  readonly compactMode = input(false);
  readonly signaling = inject(CallSignalingService);
  readonly rtc = inject(WebRtcCallService);
  readonly auth = inject(AuthService);
  private readonly api = inject(TelemedApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localVideo = viewChild<ElementRef<HTMLVideoElement>>('localVideo');
  private readonly remoteVideo = viewChild<ElementRef<HTMLVideoElement>>('remoteVideo');
  private readonly remoteAudio = viewChild<ElementRef<HTMLAudioElement>>('remoteAudio');
  private readonly chatMessagesContainer = viewChild<ElementRef<HTMLDivElement>>('chatMessages');
  private readonly syncedStatus = signal<AppointmentStatus | null>(null);
  private readonly currentMedicalRecord = signal<MedicalRecordResponse | null>(null);
  chatDraft = '';
  medicalNotesDraft = '';
  readonly isDoctor = computed(() => this.auth.role() === 'DOCTOR');
  readonly chatMessagesList = computed<ChatMessage[]>(() =>
    this.signaling
      .events()
      .filter((event) => event.appointmentId === this.appointment()?.id && event.type === 'chat')
      .map((event) => this.toChatMessage(event))
      .filter((message) => message.text.length > 0)
      .reverse()
  );

  constructor() {
    effect(() => {
      const appointment = this.appointment();
      if (!appointment) {
        this.signaling.disconnect();
        void this.rtc.disconnect();
        this.syncedStatus.set(null);
        this.currentMedicalRecord.set(null);
        this.medicalNotesDraft = '';
        return;
      }

      this.connectRoom();
      if (this.isDoctor()) {
        this.loadMedicalRecordDraft(appointment.id);
      }
    });

    effect(() => {
      const local = this.localVideo()?.nativeElement ?? null;
      const remote = this.remoteVideo()?.nativeElement ?? null;
      const remoteAudio = this.remoteAudio()?.nativeElement ?? null;
      this.rtc.bindMediaElements(local, remote, remoteAudio);
    });

    effect(() => {
      this.chatMessagesList();
      queueMicrotask(() => {
        const container = this.chatMessagesContainer()?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
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

    window.addEventListener('pagehide', this.closeRoomSilently);
    window.addEventListener('beforeunload', this.closeRoomSilently);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('pagehide', this.closeRoomSilently);
      window.removeEventListener('beforeunload', this.closeRoomSilently);
      this.closeRoomSilently();
    });
  }

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

    return `${appointment.doctorName} - ${scheduleLabel}`;
  }

  async enterCall(): Promise<void> {
    try {
      this.connectRoom();
      await this.rtc.prepareMedia();
      await this.rtc.maybeStartCall();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel acessar camera e microfone.';
      this.toast.error('Falha de dispositivo', message);
    }
  }

  toggleMicrophone(): void {
    this.rtc.toggleMicrophone();
  }

  toggleCamera(): void {
    this.rtc.toggleCamera();
  }

  completeAppointment(): void {
    this.finishAppointment();
  }

  leaveRoom(): void {
    this.closeRoomSilently();
    this.toast.info('Sala encerrada', 'A conexao local foi finalizada.', 2500);
  }

  canSendChat(): boolean {
    return this.signaling.status() === 'connected' && this.chatDraft.trim().length > 0;
  }

  sendChatMessage(): void {
    const text = this.chatDraft.trim();
    if (!text || this.signaling.status() !== 'connected') {
      return;
    }

    this.signaling.publish('chat', JSON.stringify({ text }));
    this.chatDraft = '';
  }

  saveMedicalRecordDraft(): void {
    const appointment = this.appointment();
    if (!appointment || !this.isDoctor()) {
      return;
    }

    const currentRecord = this.currentMedicalRecord();
    this.api
      .saveDraftMedicalRecord({
        appointmentId: appointment.id,
        diagnosis: currentRecord?.diagnosis ?? null,
        prescription: currentRecord?.prescription ?? null,
        requiresDigitalSignature: currentRecord?.requiresDigitalSignature ?? false,
        preferredCertificateType: (currentRecord?.preferredCertificateType as 'A1' | 'A3' | undefined) ?? 'A3',
        clinicalNotes: this.composeClinicalNotes()
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => {
          this.currentMedicalRecord.set(record);
          this.medicalNotesDraft = this.extractDoctorNotes(record.clinicalNotes);
          this.toast.success('Prontuário salvo', 'As anotações e o chat da consulta foram registrados.', 2500);
        },
        error: (error: { error?: { message?: string } }) => {
          this.toast.error('Falha ao salvar prontuário', error.error?.message ?? 'Não foi possível salvar o prontuário.');
        }
      });
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

  private readonly closeRoomSilently = (): void => {
    this.signaling.disconnect();
    void this.rtc.disconnect();
    this.rtc.stopMedia();
  };

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

  private finishAppointment(): void {
    const appointment = this.appointment();
    if (!appointment || appointment.status === 'COMPLETED') {
      if (appointment?.status === 'COMPLETED') {
        this.leaveRoom();
      }
      return;
    }

    const transitionPlan = this.buildCompletionPlan(appointment.status);
    if (!transitionPlan.length) {
      this.leaveRoom();
      return;
    }

    this.syncedStatus.set('COMPLETED');
    from(transitionPlan)
      .pipe(
        concatMap((status) => this.api.updateAppointmentStatus(appointment.id, status)),
        last(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.leaveRoom(),
        error: () => {
          this.syncedStatus.set(null);
          this.toast.error('Falha ao atualizar consulta', 'Nao foi possivel encerrar a consulta.');
        }
      });
  }

  private buildCompletionPlan(currentStatus: AppointmentStatus): AppointmentStatus[] {
    switch (currentStatus) {
      case 'SCHEDULED':
        return ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
      case 'CONFIRMED':
        return ['IN_PROGRESS', 'COMPLETED'];
      case 'IN_PROGRESS':
        return ['COMPLETED'];
      case 'PENDING_PAYMENT':
      case 'CANCELLED':
      case 'COMPLETED':
        return [];
    }
  }

  private toChatMessage(event: CallEvent): ChatMessage {
    const parsed = this.parseChatPayload(event.payload);
    return {
      id: event.id,
      text: parsed?.text?.trim() || '',
      sender: event.sender,
      sentAt: event.sentAt,
      mine: event.sender === this.signaling.clientId
    };
  }

  private parseChatPayload(payload: string): { text?: string } | null {
    try {
      return JSON.parse(payload) as { text?: string };
    } catch {
      return null;
    }
  }

  private loadMedicalRecordDraft(appointmentId: number): void {
    this.api
      .getMedicalRecords()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => {
          const record = records.find((item) => item.appointmentId === appointmentId) ?? null;
          this.currentMedicalRecord.set(record);
          this.medicalNotesDraft = this.extractDoctorNotes(record?.clinicalNotes ?? null);
        },
        error: () => undefined
      });
  }

  private composeClinicalNotes(): string {
    const notes = this.medicalNotesDraft.trim();
    const chatTranscript = this.buildChatTranscript();
    if (notes && chatTranscript) {
      return `Prontuário clínico:\n${notes}\n\nChat da consulta:\n${chatTranscript}`;
    }
    if (notes) {
      return notes;
    }
    return chatTranscript;
  }

  private buildChatTranscript(): string {
    return [...this.chatMessagesList()]
      .reverse()
      .map((message) => {
        const author = message.mine ? 'Médico' : 'Paciente';
        const timeLabel = message.sentAt ? new Date(message.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        return `[${timeLabel}] ${author}: ${message.text}`;
      })
      .join('\n');
  }

  private extractDoctorNotes(clinicalNotes: string | null): string {
    if (!clinicalNotes) {
      return '';
    }

    const divider = '\n\nChat da consulta:\n';
    if (clinicalNotes.startsWith('Prontuário clínico:\n')) {
      return clinicalNotes.replace('Prontuário clínico:\n', '').split(divider)[0].trim();
    }

    return clinicalNotes.split(divider)[0].trim();
  }
}
