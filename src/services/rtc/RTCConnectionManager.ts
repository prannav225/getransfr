import { Socket } from "socket.io-client";

class RTCConnectionManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  createPeerConnection(peerId: string): RTCPeerConnection {
    // Only close if it's a completely new session request, but for renegotiation we might want to check existence?
    // Actually, createPeerConnection is usually called when we initiate a FRESH session.
    // For re-use, we should use getPeerConnection.
    // But if the caller insists on create, we close old.
    this.closePeerConnection(peerId);

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });

    this.setupPeerConnectionListeners(peerConnection, peerId);
    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  private setupPeerConnectionListeners(pc: RTCPeerConnection, peerId: string) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // console.log('Sending ICE candidate to:', peerId);
        this.socket.emit("rtc-ice-candidate", {
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[RTC] ICE State (${peerId}):`, pc.iceConnectionState);
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        this.detectConnectionType(peerId);
      }
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        console.warn(
          `[RTC] Connection ${pc.iceConnectionState}, triggering Smart Retry...`
        );
        // Debounce restart
        setTimeout(() => {
          if (
            pc.iceConnectionState === "failed" ||
            pc.iceConnectionState === "disconnected"
          ) {
            this.triggerIceRestart(peerId);
          }
        }, 2000);
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log(`[RTC] Negotiation needed for ${peerId}`);
      try {
        // Determine if we need restart based on state?
        // Usually just creating offer is enough, the browser internal state handles the rest.
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.socket.emit("rtc-offer", { to: peerId, offer });
      } catch (err) {
        console.error("[RTC] Negotiation failed:", err);
      }
    };
  }

  private connectionTypes: Map<string, "direct" | "relay"> = new Map();

  private async detectConnectionType(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;

    try {
      const stats = await pc.getStats();
      let selectedPair: RTCStats | null = null;

      stats.forEach((report) => {
        if (report.type === "transport" && report.selectedCandidatePairId) {
          selectedPair = stats.get(report.selectedCandidatePairId) || null;
        }
      });

      if (selectedPair) {
        const localCandidate = stats.get(
          (selectedPair as any).localCandidateId
        );
        const remoteCandidate = stats.get(
          (selectedPair as any).remoteCandidateId
        );

        const isRelay =
          localCandidate?.candidateType === "relay" ||
          remoteCandidate?.candidateType === "relay";
        console.log(
          `[RTC] Connection type for ${peerId}: ${isRelay ? "RELAY" : "DIRECT"}`
        );

        this.connectionTypes.set(peerId, isRelay ? "relay" : "direct");
      }
    } catch (err) {
      console.warn("[RTC] Failed to detect connection type:", err);
    }
  }

  public getConnectionType(peerId: string): "direct" | "relay" | "unknown" {
    return this.connectionTypes.get(peerId) || "unknown";
  }

  public async triggerIceRestart(peerId: string): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;

    console.log(`[RTC] Initiating ICE Restart for ${peerId}`);
    try {
      // Force restart
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      this.socket.emit("rtc-offer", { to: peerId, offer });
    } catch (error) {
      console.error("[RTC] ICE Restart failed:", error);
    }
  }

  getPeerConnection(peerId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(peerId);
  }

  closePeerConnection(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      console.log("Closing peer connection for:", peerId);
      peerConnection.close();
      this.peerConnections.delete(peerId);
      this.connectionTypes.delete(peerId);
    }
  }
}

export default RTCConnectionManager;
