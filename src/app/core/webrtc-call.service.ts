import { computed, effect, Injectable, signal } from '@angular/core';
import { CallEvent, CallSignalingService } from './call-signaling.service';
import { resolveIceServers } from './runtime-config';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class WebRtcCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private remoteStreamValue = new MediaStream();
  private localVideo: HTMLVideoElement | null = null;
  private remoteVideo: HTMLVideoElement | null = null;
  private handledIds = new Set<string>();
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private currentRoomId: number | null = null;
  private remoteParticipantId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly iceServers = resolveIceServers();

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
      return 'Sinalização offline';
    }
    if (!this.localStream()) {
      return 'Dispositivos pendentes';
    }
    if (!this.remoteParticipantPresent()) {
      return 'Aguardando outro participante';
    }
    if (this.state() === 'connected') {
      return 'Mídia conectada';
    }
    if (this.state() === 'reconnecting') {
      return 'Reconectando mídia';
    }
    if (this.state() === 'failed') {
      return 'Falha na mídia';
    }
    return 'Negociando conexão';
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
          this.toast.error('Falha na sala', 'Não foi possível processar um evento da videochamada.');
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
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.peerConnection?.close();
    this.peerConnection = null;
    this.remoteStreamValue = new MediaStream();
    this.remoteStream.set(null);
    this.remoteParticipantId = null;
    this.pendingIceCandidates = [];
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
      this.pendingIceCandidates = [];
    }

    if (this.peerConnection) {
      return this.peerConnection;
    }

    const peer = new RTCPeerConnection({
      iceServers: this.iceServers
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
        if (this.reconnectTimeoutId) {
          clearTimeout(this.reconnectTimeoutId);
          this.reconnectTimeoutId = null;
        }
        this.toast.success('Chamada conectada', 'Os dois participantes estão na mesma sala.', 2500);
      } else if (peer.connectionState === 'disconnected') {
        this.scheduleReconnect();
      } else if (peer.connectionState === 'failed') {
        this.scheduleReconnect();
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'failed') {
        this.scheduleReconnect();
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
        this.toast.error('Sala lotada', 'Esta consulta já possui dois participantes ativos.');
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
      await this.flushPendingIceCandidates(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      this.signaling.publish('answer', JSON.stringify(answer));
      return;
    }

    if (event.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(event.payload)));
      await this.flushPendingIceCandidates(peer);
      return;
    }

    if (event.type === 'candidate') {
      const candidate = JSON.parse(event.payload) as RTCIceCandidateInit;
      if (!peer.remoteDescription) {
        this.pendingIceCandidates.push(candidate);
        return;
      }

      await this.addIceCandidateSafely(peer, candidate);
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
    if (this.reconnectAttempts >= 1 || !this.remoteParticipantPresent() || this.signaling.status() !== 'connected') {
      return;
    }

    this.reconnectAttempts += 1;
    await this.startCall(true);
  }

  private scheduleReconnect(): void {
    if (!this.remoteParticipantPresent() || this.signaling.status() !== 'connected') {
      this.state.set('failed');
      return;
    }

    if (this.reconnectAttempts >= 1) {
      this.state.set('failed');
      this.toast.error('Falha na chamada', 'A mídia não conectou. Em redes móveis ou NAT mais restritos, configure um servidor TURN.');
      return;
    }

    if (this.reconnectTimeoutId) {
      return;
    }

    this.state.set('reconnecting');
    this.toast.info('Reconectando chamada', 'A conexão caiu e será renegociada.', 2500);
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      void this.tryAutoReconnect().catch(() => {
        this.state.set('failed');
      });
    }, 1500);
  }

  private async flushPendingIceCandidates(peer: RTCPeerConnection): Promise<void> {
    if (!peer.remoteDescription || !this.pendingIceCandidates.length) {
      return;
    }

    const queuedCandidates = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];

    for (const candidate of queuedCandidates) {
      await this.addIceCandidateSafely(peer, candidate);
    }
  }

  private async addIceCandidateSafely(peer: RTCPeerConnection, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      this.pendingIceCandidates.push(candidate);
    }
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
    this.pendingIceCandidates = [];
    this.currentRoomId = null;
    this.remoteParticipantId = null;
    this.reconnectAttempts = 0;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
}
