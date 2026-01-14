import ConnectionManagerClass from "./rtc/RTCConnectionManager";
import DataChannelManagerClass from "./rtc/RTCDataChannelManager";
import RTCFileTransferManager from "./rtc/RTCFileTransferManager";
import {
  FileProgress,
  FileMetadata,
  FileSystemHandle,
} from "../types/transfer";
import { eventBus, EVENTS } from "../utils/events";
import { socket } from "./socket";

class RTCService {
  private connectionManager: InstanceType<typeof ConnectionManagerClass>;
  private dataChannelManager: InstanceType<typeof DataChannelManagerClass>;
  private fileTransferManager = new RTCFileTransferManager();
  private transferRequests = new Map<
    string,
    { files: File[]; callbacks: FileProgress }
  >();

  constructor() {
    this.connectionManager = new ConnectionManagerClass(socket);
    this.dataChannelManager = new DataChannelManagerClass();
    this.setupSignaling();

    // Listen for UI-driven cancel events (especially from the receiver side)
    window.addEventListener(EVENTS.TRANSFER_CANCEL, (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.peerId) {
        this.cancelTransfer(detail.peerId);
      }
    });
  }

  private setupSignaling(): void {
    socket.on("rtc-offer", async ({ from, offer }) => {
      console.log("[RTCService] Received offer from:", from);
      const pc = this.connectionManager.createPeerConnection(from);

      pc.ondatachannel = (event: RTCDataChannelEvent) => {
        this.setupDataChannel(from, event.channel);
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("rtc-answer", { to: from, answer });
      } catch (err) {
        console.error("[RTCService] Error handling offer:", err);
      }
    });

    socket.on("rtc-answer", async ({ from, answer }) => {
      console.log("[RTCService] Received answer from:", from);
      const pc = this.connectionManager.getPeerConnection(from);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("[RTCService] Error handling answer:", err);
        }
      }
    });

    socket.on("rtc-ice-candidate", async ({ from, candidate }) => {
      const pc = this.connectionManager.getPeerConnection(from);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("[RTCService] Error adding ICE candidate:", err);
        }
      }
    });
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onmessage = (event) => this.handleDataChannelMessage(peerId, event);
    channel.onopen = () => {
      console.log("[RTCService] Data channel open with:", peerId);
      const pendingTransfer = this.transferRequests.get(peerId);
      if (pendingTransfer) {
        const metadata = pendingTransfer.files.map((f) => ({
          name:
            (f as File & { webkitRelativePath?: string }).webkitRelativePath ||
            f.name,
          size: f.size,
          type: f.type,
        }));
        channel.send(JSON.stringify({ type: "metadata", files: metadata }));
      }
    };
    channel.onclose = () => {
      console.log("[RTCService] Data channel closed with:", peerId);
      this.cleanupPeer(peerId);
    };
    this.dataChannelManager.addDataChannel(peerId, channel);
  }

  private async handleDataChannelMessage(
    peerId: string,
    event: MessageEvent
  ): Promise<void> {
    if (typeof event.data === "string") {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "metadata":
            this.handleMetadataMessage(peerId, message.files);
            break;
          case "accept":
            this.handleTransferAccepted(peerId);
            break;
          case "decline":
            this.handleTransferDeclined(peerId);
            break;
          case "cancel":
            this.handleTransferCancelled(peerId);
            break;
          case "file-complete":
            this.fileTransferManager.saveFile(peerId, message.name);
            break;
          case "ack":
            this.fileTransferManager.handleAck(peerId, message.byteLength);
            break;
        }
      } catch (err) {
        console.error("[RTCService] JSON parse error:", err);
      }
    } else {
      await this.fileTransferManager.addChunk(peerId, event.data);
      const channel = this.dataChannelManager.getDataChannel(peerId);
      if (channel && channel.readyState === "open") {
        channel.send(
          JSON.stringify({ type: "ack", byteLength: event.data.byteLength })
        );
      }
    }
  }

  private async handleMetadataMessage(
    peerId: string,
    files: FileMetadata[]
  ): Promise<void> {
    const result = await new Promise<{
      accepted: boolean;
      handle?: FileSystemHandle | null;
    }>((resolve) => {
      eventBus.emit(EVENTS.FILE_TRANSFER_REQUEST, {
        peerId,
        files,
        handleAccept: (handle?: FileSystemHandle | null) =>
          resolve({ accepted: true, handle }),
        handleDecline: () => resolve({ accepted: false }),
      });
    });

    const channel = this.dataChannelManager.getDataChannel(peerId);
    if (!channel || channel.readyState !== "open") return;

    if (result.accepted) {
      await this.fileTransferManager.initializeReceiver(
        peerId,
        files,
        result.handle ?? undefined
      );
      channel.send(JSON.stringify({ type: "accept" }));
    } else {
      channel.send(JSON.stringify({ type: "decline" }));
      this.cleanupPeer(peerId);
    }
  }

  private handleTransferAccepted(peerId: string): void {
    const transfer = this.transferRequests.get(peerId);
    if (transfer) {
      this.startFileTransfer(peerId, transfer.files, transfer.callbacks);
    }
  }

  private handleTransferDeclined(peerId: string): void {
    const transfer = this.transferRequests.get(peerId);
    if (transfer) {
      transfer.callbacks.onError(new Error("Transfer declined by recipient"));
      this.transferRequests.delete(peerId);
    }
    this.cleanupPeer(peerId);
  }

  private handleTransferCancelled(peerId: string): void {
    const transfer = this.transferRequests.get(peerId);
    if (transfer) {
      transfer.callbacks.onCancel();
      this.transferRequests.delete(peerId);
    }
    this.cleanupPeer(peerId);
  }

  private async startFileTransfer(
    peerId: string,
    files: File[],
    callbacks: FileProgress
  ): Promise<void> {
    const channel = this.dataChannelManager.getDataChannel(peerId);
    if (!channel || channel.readyState !== "open") return;

    try {
      this.fileTransferManager.initializeSender(peerId, files, callbacks);
      for (let i = 0; i < files.length; i++) {
        // Fixed: Only passing 3 arguments to sendFile as defined in its signature
        await this.fileTransferManager.sendFile(peerId, files[i], channel);
      }
      callbacks.onComplete();
      this.transferRequests.delete(peerId);
    } catch (err) {
      console.error("[RTCService] Transfer error:", err);
      callbacks.onError(err as Error);
      this.cleanupPeer(peerId);
    }
  }

  public async sendFiles(
    peerId: string,
    files: File[],
    callbacks: FileProgress
  ): Promise<() => void> {
    if (!peerId) return () => {};

    this.transferRequests.set(peerId, { files, callbacks });

    const peerConnection = this.connectionManager.createPeerConnection(peerId);
    const dataChannel = peerConnection.createDataChannel("fileTransfer", {
      ordered: true,
    });
    dataChannel.bufferedAmountLowThreshold = 4 * 1024 * 1024;
    this.setupDataChannel(peerId, dataChannel);

    return () => this.cancelTransfer(peerId);
  }

  private cancelTransfer(peerId: string): void {
    const channel = this.dataChannelManager.getDataChannel(peerId);
    if (channel && channel.readyState === "open") {
      channel.send(JSON.stringify({ type: "cancel" }));
    }
    this.handleTransferCancelled(peerId);
  }

  public getConnectionType(peerId: string): "direct" | "relay" | "unknown" {
    return this.connectionManager.getConnectionType(peerId);
  }

  private cleanupPeer(peerId: string): void {
    this.connectionManager.closePeerConnection(peerId);
    this.dataChannelManager.closeDataChannel(peerId);
    this.fileTransferManager.cleanup(peerId);
  }
}

export default new RTCService();
