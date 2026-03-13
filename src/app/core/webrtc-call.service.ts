import { computed, effect, Injectable, signal } from '@angular/core';
import { CallEvent, CallSignalingService } from './call-signaling.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class WebRtcCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private remoteStreamValue = new MediaStream();
  private localVideo: HTMLVideoElement | null = null;
  private remoteVideo: HTMLVideoElement | null = null;
  private handledIds = new Set<string>();
  private currentRoomId: number | null = null;
  private remoteParticipantId: string | null = null;
  private reconnectAttempts = 0;

  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);
  readonly micEnabled = signal(true);
  readonly cameraEnabled = signal(true);
  readonly state = signal<'idle' | 'preparing' | 'ready' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('idle');
  readonly remoteParticipantPresent = computed(() =>
    this.signaling.roomState().participants.some((participant) => participant !== this.signaling.clientId)
  );
  readonly connectivityLabel = computed(() => {
    if (this.signaling.status() !== 'connected') {
      return 'Sinalizacao offline';
    }
    if (!this.localStream()) {
      return 'Dispositivos pendentes';
    }
    if (!this.remoteParticipantPresent()) {
      return 'Aguardando outro participante';
    }
    if (this.state() === 'connected') {
      return 'Midia conectada';
    }
    if (this.state() === 'reconnecting') {
      return 'Reconectando midia';
    }
    if (this.state() === 'failed') {
      return 'Falha na midia';
    }
    return 'Negociando conexao';
  });

  constructor(
    private readonly signaling: CallSignalingService,
    private readonly toast: ToastService
  ) {
    effect(() => {
      const roomId = this.signaling.currentRoom();
      const events = this.signaling.events();

      if (!roomId) {
        this.resetRoomState();
        return;
      }

      if (this.currentRoomId !== roomId) {
        this.currentRoomId = roomId;
        this.handledIds.clear();
        this.remoteParticipantId = null;
      }

      for (const event of [...events].reverse()) {
        if (event.appointmentId !== roomId || this.handledIds.has(event.id) || event.sender === this.signaling.clientId) {
          continue;
        }
        this.handledIds.add(event.id);
        void this.handleRemoteEvent(event).catch(() => {
          this.state.set('failed');
          this.toast.error('Falha na sala', 'Nao foi possivel processar um evento da videochamada.');
        });
      }
    });
  }

  async prepareMedia(): Promise<void> {
    if (this.localStream()) {
      this.attachStreams();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.state.set('failed');
      throw new Error('Media devices API unavailable');
    }

    this.state.set('preparing');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    this.localStream.set(stream);
    this.micEnabled.set(true);
    this.cameraEnabled.set(true);
    this.attachStreams();
    this.state.set('ready');
  }

  bindVideos(localVideo: HTMLVideoElement | null, remoteVideo: HTMLVideoElement | null): void {
    this.localVideo = localVideo;
    this.remoteVideo = remoteVideo;
    this.attachStreams();
  }

  async startCall(forceRestart = false): Promise<void> {
    await this.prepareMedia();
    const peer = this.ensurePeerConnection(forceRestart);
    this.state.set(forceRestart ? 'reconnecting' : 'connecting');
    const offer = await peer.createOffer({ iceRestart: forceRestart });
    await peer.setLocalDescription(offer);
    this.signaling.publish('offer', JSON.stringify(offer));
  }

  toggleMicrophone(): void {
    const enabled = !this.micEnabled();
    this.localStream()?.getAudioTracks().forEach((track) => (track.enabled = enabled));
    this.micEnabled.set(enabled);
  }

  toggleCamera(): void {
    const enabled = !this.cameraEnabled();
    this.localStream()?.getVideoTracks().forEach((track) => (track.enabled = enabled));
    this.cameraEnabled.set(enabled);
  }

  async reconnect(): Promise<void> {
    await this.startCall(true);
  }

  async disconnect(): Promise<void> {
    this.peerConnection?.close();
    this.peerConnection = null;
    this.remoteStreamValue = new MediaStream();
    this.remoteStream.set(null);
    this.remoteParticipantId = null;
    this.state.set('idle');
    this.reconnectAttempts = 0;
  }

  stopMedia(): void {
    this.localStream()?.getTracks().forEach((track) => track.stop());
    this.localStream.set(null);
    this.remoteStream.set(null);
    this.localVideo = null;
    this.remoteVideo = null;
  }

  private ensurePeerConnection(forceRestart = false): RTCPeerConnection {
    if (forceRestart && this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      this.remoteStreamValue = new MediaStream();
      this.remoteStream.set(null);
    }

    if (this.peerConnection) {
      return this.peerConnection;
    }

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    const stream = this.localStream();
    stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.publish('candidate', JSON.stringify(event.candidate.toJSON()));
      }
    };

    peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (!this.remoteStreamValue.getTracks().some((existing) => existing.id === track.id)) {
          this.remoteStreamValue.addTrack(track);
        }
      });
      this.remoteStream.set(this.remoteStreamValue);
      this.attachStreams();
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        this.state.set('connected');
        this.reconnectAttempts = 0;
        this.toast.success('Chamada conectada', 'Os dois participantes estao na mesma sala.', 2500);
      } else if (peer.connectionState === 'disconnected') {
        this.state.set('reconnecting');
        this.toast.info('Reconectando chamada', 'A conexao caiu e sera renegociada.');
        void this.tryAutoReconnect();
      } else if (peer.connectionState === 'failed') {
        this.state.set('failed');
        this.toast.error('Falha na chamada', 'Nao foi possivel manter a conexao.');
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'failed') {
        this.state.set('failed');
      }
    };

    this.peerConnection = peer;
    return peer;
  }

  private async handleRemoteEvent(event: CallEvent): Promise<void> {
    if (event.type === 'room-state') {
      return;
    }

    if (event.type === 'room-limit') {
      const payload = this.parsePayload<{ rejectedParticipant?: string }>(event.payload);
      if (payload?.rejectedParticipant === this.signaling.clientId) {
        this.toast.error('Sala lotada', 'Esta consulta ja possui dois participantes ativos.');
        this.signaling.disconnect(false);
        await this.disconnect();
      }
      return;
    }

    if (event.type === 'join') {
      this.remoteParticipantId = this.extractClientId(event.payload) ?? event.sender;
      this.toast.info('Participante na sala', 'O outro lado entrou na consulta.', 2500);
      if (!this.localStream()) {
        this.state.set('ready');
      }
      if (this.localStream() && this.shouldInitiateOffer()) {
        await this.startCall();
      }
      return;
    }

    if (event.type === 'leave') {
      this.remoteParticipantId = null;
      this.toast.info('Participante saiu', 'A outra ponta deixou a sala.', 2500);
      await this.disconnect();
      return;
    }

    await this.prepareMedia();
    const peer = this.ensurePeerConnection();

    if (event.type === 'offer') {
      this.state.set('connecting');
      await peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(event.payload)));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      this.signaling.publish('answer', JSON.stringify(answer));
      return;
    }

    if (event.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(event.payload)));
      return;
    }

    if (event.type === 'candidate') {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(JSON.parse(event.payload)));
      } catch {
        this.toast.info('Sinal ICE ignorado', 'Um candidato chegou fora de ordem e foi descartado.', 2500);
      }
    }
  }

  private shouldInitiateOffer(): boolean {
    if (!this.remoteParticipantId) {
      return false;
    }

    return this.signaling.clientId.localeCompare(this.remoteParticipantId) > 0;
  }

  private extractClientId(payload: string): string | null {
    const parsed = this.parsePayload<{ clientId?: string }>(payload);
    return parsed?.clientId ?? null;
  }

  private parsePayload<T>(payload: string): T | null {
    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  }

  private async tryAutoReconnect(): Promise<void> {
    if (this.reconnectAttempts >= 2 || !this.remoteParticipantPresent()) {
      return;
    }

    this.reconnectAttempts += 1;
    await this.startCall(true);
  }

  private attachStreams(): void {
    if (this.localVideo && this.localStream()) {
      this.localVideo.srcObject = this.localStream();
      this.localVideo.muted = true;
      void this.localVideo.play().catch(() => undefined);
    }

    if (this.remoteVideo) {
      this.remoteVideo.srcObject = this.remoteStream();
      void this.remoteVideo.play().catch(() => undefined);
    }
  }

  private resetRoomState(): void {
    this.handledIds.clear();
    this.currentRoomId = null;
    this.remoteParticipantId = null;
  }
}
