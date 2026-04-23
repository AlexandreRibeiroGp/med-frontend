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
  private remoteAudio: HTMLAudioElement | null = null;
  private handledIds = new Set<string>();
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private currentRoomId: number | null = null;
  private remoteParticipantId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly iceServers = resolveIceServers();
  private makingOffer = false;
  private ignoreOffer = false;
  private isSettingRemoteAnswerPending = false;
  private mediaReadyAnnounced = false;

  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);
  readonly micEnabled = signal(true);
  readonly cameraEnabled = signal(true);
  readonly state = signal<'idle' | 'preparing' | 'ready' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('idle');
  readonly remoteParticipantPresent = computed(() => this.signaling.roomState().participantCount > 1);
  readonly connectivityLabel = computed(() => {
    if (this.signaling.status() !== 'connected') {
      return 'Sinalização offline';
    }
    if (!this.localStream()) {
      return 'Dispositivos pendentes';
    }
    if (this.remoteStream()?.getTracks().length) {
      return 'Mídia conectada';
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
        this.mediaReadyAnnounced = false;
      }

      for (const event of [...events].reverse()) {
        if (event.appointmentId !== roomId || this.handledIds.has(event.id) || this.isOwnEvent(event)) {
          continue;
        }
        this.handledIds.add(event.id);
        void this.handleRemoteEvent(event).catch(() => {
          this.state.set('failed');
          this.toast.error('Falha na sala', 'Não foi possível processar um evento da videochamada.');
        });
      }
    });

    effect(() => {
      this.signaling.status();
      this.localStream();
      this.signaling.currentRoom();
      this.announceMediaReady(true);
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
    const stream = await this.requestMediaWithFallback();
    this.localStream.set(stream);
    this.micEnabled.set(stream.getAudioTracks().some((track) => track.enabled));
    this.cameraEnabled.set(stream.getVideoTracks().some((track) => track.enabled));
    this.warnAboutMissingDevices(stream);
    this.attachStreams();
    this.state.set('ready');
    this.announceMediaReady();
  }

  bindMediaElements(
    localVideo: HTMLVideoElement | null,
    remoteVideo: HTMLVideoElement | null,
    remoteAudio: HTMLAudioElement | null
  ): void {
    this.localVideo = localVideo;
    this.remoteVideo = remoteVideo;
    this.remoteAudio = remoteAudio;
    this.attachStreams();
  }

  async startCall(forceRestart = false): Promise<void> {
    await this.prepareMedia();
    const peer = this.ensurePeerConnection(forceRestart);
    this.state.set(forceRestart ? 'reconnecting' : 'connecting');
    try {
      this.makingOffer = true;
      const offer = await peer.createOffer({
        iceRestart: forceRestart,
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      if (peer.signalingState !== 'stable') {
        return;
      }
      await peer.setLocalDescription(offer);
      this.signaling.publish('offer', this.wrapRtcPayload(offer));
    } finally {
      this.makingOffer = false;
    }
  }

  toggleMicrophone(): void {
    if (!this.localStream()?.getAudioTracks().length && !this.micEnabled()) {
      void this.restoreMissingTrack('audio');
      return;
    }
    const enabled = !this.micEnabled();
    this.localStream()?.getAudioTracks().forEach((track) => (track.enabled = enabled));
    this.micEnabled.set(enabled);
  }

  toggleCamera(): void {
    if (!this.localStream()?.getVideoTracks().length && !this.cameraEnabled()) {
      void this.restoreMissingTrack('video');
      return;
    }
    const enabled = !this.cameraEnabled();
    this.localStream()?.getVideoTracks().forEach((track) => (track.enabled = enabled));
    this.cameraEnabled.set(enabled);
  }

  async reconnect(): Promise<void> {
    await this.startCall(true);
  }

  async maybeStartCall(): Promise<void> {
    if (!this.localStream() || !this.remoteParticipantPresent() || !this.shouldInitiateOffer() || this.makingOffer) {
      return;
    }

    await this.startCall();
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
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.isSettingRemoteAnswerPending = false;
    this.mediaReadyAnnounced = false;
    this.state.set('idle');
    this.reconnectAttempts = 0;
  }

  stopMedia(): void {
    this.localStream()?.getTracks().forEach((track) => track.stop());
    this.localStream.set(null);
    this.remoteStream.set(null);
    this.localVideo = null;
    this.remoteVideo = null;
    this.remoteAudio = null;
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
      iceServers: this.iceServers,
      bundlePolicy: 'max-bundle',
      iceCandidatePoolSize: 2
    });

    const stream = this.localStream();
    stream?.getTracks().forEach((track) => peer.addTrack(track, stream));
    if (!stream?.getAudioTracks().length) {
      peer.addTransceiver('audio', { direction: 'recvonly' });
    }
    if (!stream?.getVideoTracks().length) {
      peer.addTransceiver('video', { direction: 'recvonly' });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.publish('candidate', this.wrapRtcPayload(event.candidate.toJSON()));
      }
    };

    peer.ontrack = (event) => {
      const incomingTracks =
        event.streams.length > 0
          ? event.streams.flatMap((streamEntry) => streamEntry.getTracks())
          : [event.track];

      incomingTracks.forEach((track) => {
        if (!this.remoteStreamValue.getTracks().some((existing) => existing.id === track.id)) {
          this.remoteStreamValue.addTrack(track);
        }
        track.onunmute = () => {
          this.remoteStream.set(this.remoteStreamValue);
          this.attachStreams();
        };
      });
      this.remoteStream.set(this.remoteStreamValue);
      this.state.set('connected');
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
      this.remoteParticipantId = this.getEventClientId(event);
      this.toast.info('Participante na sala', 'O outro lado entrou na consulta.', 2500);
      if (!this.localStream()) {
        this.state.set('ready');
      }
      this.announceMediaReady();
      if (this.localStream() && this.shouldInitiateOffer() && !this.makingOffer) {
        await this.startCall();
      }
      return;
    }

    if (event.type === 'media-ready') {
      this.remoteParticipantId = this.getEventClientId(event);
      if (this.localStream() && this.shouldInitiateOffer() && !this.makingOffer) {
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
      this.remoteParticipantId = this.getEventClientId(event);
      const description = new RTCSessionDescription(this.unwrapRtcPayload<RTCSessionDescriptionInit>(event.payload));
      const readyForOffer =
        !this.makingOffer && (peer.signalingState === 'stable' || this.isSettingRemoteAnswerPending);
      const offerCollision = description.type === 'offer' && !readyForOffer;
      this.ignoreOffer = !this.isPolitePeer() && offerCollision;
      if (this.ignoreOffer) {
        return;
      }

      this.state.set('connecting');
      await peer.setRemoteDescription(description);
      await this.flushPendingIceCandidates(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      this.signaling.publish('answer', this.wrapRtcPayload(answer));
      return;
    }

    if (event.type === 'answer') {
      this.isSettingRemoteAnswerPending = true;
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(this.unwrapRtcPayload<RTCSessionDescriptionInit>(event.payload)));
      } finally {
        this.isSettingRemoteAnswerPending = false;
      }
      this.remoteParticipantId = this.getEventClientId(event);
      await this.flushPendingIceCandidates(peer);
      return;
    }

    if (event.type === 'candidate') {
      const candidate = this.unwrapRtcPayload<RTCIceCandidateInit>(event.payload);
      this.remoteParticipantId = this.getEventClientId(event);
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

  private isPolitePeer(): boolean {
    if (!this.remoteParticipantId) {
      return false;
    }

    return this.signaling.clientId.localeCompare(this.remoteParticipantId) < 0;
  }

  private extractClientId(payload: string): string | null {
    const parsed = this.parsePayload<{ clientId?: string }>(payload);
    return parsed?.clientId ?? null;
  }

  private announceMediaReady(force = false): void {
    if (!this.localStream() || this.signaling.status() !== 'connected' || (!force && this.mediaReadyAnnounced)) {
      return;
    }

    this.mediaReadyAnnounced = true;
    this.signaling.publish('media-ready', JSON.stringify({ clientId: this.signaling.clientId }));
  }

  private isOwnEvent(event: CallEvent): boolean {
    const eventClientId = this.getEventClientId(event);
    return eventClientId === this.signaling.clientId;
  }

  private getEventClientId(event: CallEvent): string | null {
    return this.extractClientId(event.payload) ?? event.sender;
  }

  private wrapRtcPayload<T>(data: T): string {
    return JSON.stringify({
      clientId: this.signaling.clientId,
      data
    });
  }

  private unwrapRtcPayload<T>(payload: string): T {
    const wrapped = this.parsePayload<{ clientId?: string; data?: T }>(payload);
    if (wrapped && wrapped.data !== undefined) {
      return wrapped.data;
    }
    return JSON.parse(payload) as T;
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
      this.localVideo.autoplay = true;
      this.localVideo.playsInline = true;
      this.localVideo.setAttribute('autoplay', 'true');
      this.localVideo.setAttribute('playsinline', 'true');
      this.localVideo.setAttribute('webkit-playsinline', 'true');
      this.localVideo.srcObject = this.localStream();
      this.localVideo.muted = true;
      void this.localVideo.play().catch(() => undefined);
    }

    if (this.remoteVideo) {
      this.remoteVideo.autoplay = true;
      this.remoteVideo.playsInline = true;
      this.remoteVideo.setAttribute('autoplay', 'true');
      this.remoteVideo.setAttribute('playsinline', 'true');
      this.remoteVideo.setAttribute('webkit-playsinline', 'true');
      this.remoteVideo.muted = false;
      this.remoteVideo.srcObject = this.remoteStream();
      void this.remoteVideo.play().catch(() => undefined);
    }

    if (this.remoteAudio) {
      this.remoteAudio.autoplay = true;
      this.remoteAudio.muted = false;
      this.remoteAudio.srcObject = this.remoteStream();
      void this.remoteAudio.play().catch(() => undefined);
    }
  }

  private async requestMediaWithFallback(): Promise<MediaStream> {
    const constraints = this.mediaConstraints();
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (combinedError) {
      const audioResult = await this.tryGetUserMedia({ audio: true, video: false });
      const videoResult = await this.tryGetUserMedia({ audio: false, video: constraints.video });
      const fallbackStream = new MediaStream();

      audioResult.stream?.getAudioTracks().forEach((track) => fallbackStream.addTrack(track));
      videoResult.stream?.getVideoTracks().forEach((track) => fallbackStream.addTrack(track));

      if (fallbackStream.getTracks().length) {
        const missingDevices: string[] = [];
        if (!fallbackStream.getAudioTracks().length) {
          missingDevices.push('microfone');
        }
        if (!fallbackStream.getVideoTracks().length) {
          missingDevices.push('camera');
        }
        if (missingDevices.length) {
          this.toast.info(
            'Dispositivo parcial',
            `A chamada foi iniciada sem ${missingDevices.join(' e ')}.`
          );
        }
        return fallbackStream;
      }

      throw this.buildMediaAccessError(combinedError, audioResult.error, videoResult.error);
    }
  }

  private warnAboutMissingDevices(stream: MediaStream): void {
    const missingDevices: string[] = [];
    if (!stream.getAudioTracks().length) {
      missingDevices.push('microfone');
    }
    if (!stream.getVideoTracks().length) {
      missingDevices.push('camera');
    }
    if (!missingDevices.length) {
      return;
    }

    this.toast.info(
      'Permissao parcial',
      `A chamada foi iniciada sem ${missingDevices.join(' e ')}. Use os botoes para tentar ativar novamente.`
    );
  }

  private async restoreMissingTrack(kind: 'audio' | 'video'): Promise<void> {
    const currentStream = this.localStream();
    if (!currentStream) {
      await this.prepareMedia();
      return;
    }

    const constraints: MediaStreamConstraints =
      kind === 'audio'
        ? { audio: true, video: false }
        : { audio: false, video: this.mediaConstraints().video };

    const result = await this.tryGetUserMedia(constraints);
    const newTrack =
      kind === 'audio'
        ? result.stream?.getAudioTracks()[0] ?? null
        : result.stream?.getVideoTracks()[0] ?? null;

    if (!newTrack) {
      this.toast.error(
        'Dispositivo indisponivel',
        kind === 'audio'
          ? 'Nao foi possivel ativar o microfone neste dispositivo.'
          : 'Nao foi possivel ativar a camera neste dispositivo.'
      );
      return;
    }

    const updatedStream = new MediaStream([...currentStream.getTracks(), newTrack]);
    this.localStream.set(updatedStream);
    if (kind === 'audio') {
      this.micEnabled.set(true);
    } else {
      this.cameraEnabled.set(true);
    }

    if (this.peerConnection) {
      this.peerConnection.addTrack(newTrack, updatedStream);
      await this.startCall(true);
    }

    this.attachStreams();
  }

  private mediaConstraints(): MediaStreamConstraints {
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        facingMode: 'user',
        width: { ideal: 640, max: 960 },
        height: { ideal: 360, max: 540 },
        frameRate: { ideal: 15, max: 24 }
      }
    };
  }

  private async tryGetUserMedia(constraints: MediaStreamConstraints): Promise<{ stream: MediaStream | null; error: unknown }> {
    try {
      return {
        stream: await navigator.mediaDevices.getUserMedia(constraints),
        error: null
      };
    } catch (error) {
      return { stream: null, error };
    }
  }

  private buildMediaAccessError(...errors: unknown[]): Error {
    for (const error of errors) {
      if (!(error instanceof DOMException)) {
        continue;
      }
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          return new Error('O navegador bloqueou o acesso. Libere camera e microfone no cadeado ao lado da URL.');
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          return new Error('Nenhuma camera ou microfone compativel foi encontrado neste dispositivo.');
        case 'NotReadableError':
        case 'TrackStartError':
          return new Error('A camera ou o microfone ja esta sendo usado por outro aplicativo.');
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
          return new Error('Nao foi possivel iniciar a camera ou o microfone com as configuracoes atuais.');
        case 'SecurityError':
          return new Error('O navegador bloqueou o acesso por seguranca.');
      }
    }

    return new Error('Nao foi possivel acessar camera e microfone.');
  }

  private resetRoomState(): void {
    this.handledIds.clear();
    this.pendingIceCandidates = [];
    this.currentRoomId = null;
    this.remoteParticipantId = null;
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.isSettingRemoteAnswerPending = false;
    this.mediaReadyAnnounced = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
}
