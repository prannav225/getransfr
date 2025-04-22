/* eslint-disable @typescript-eslint/no-explicit-any */
import '../lib/polyfill';
import SimplePeer from 'simple-peer';
import { socket } from './socket';

export interface FileProgress {
  onProgress: (progress: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

class P2PService {
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private receivedChunks: Map<string, Uint8Array[]> = new Map();
  private receivedMetadata: Map<string, any> = new Map();

  constructor() {
    socket.on('signal', ({ from, signal }) => {
      console.log('Received signal from:', from);
      let peer = this.peers.get(from);
      
      if (!peer) {
        peer = this.createPeer(from, false);
        this.peers.set(from, peer);
      }
      
      try {
        peer.signal(signal);
      } catch (error) {
        console.error('Error processing signal:', error);
      }
    });
  }

  private createPeer(targetId: string, initiator: boolean): SimplePeer.Instance {
    console.log('Creating peer connection with:', targetId);
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('error', err => {
      console.error('Peer error:', err);
    });

    peer.on('signal', data => {
      console.log('Sending signal to:', targetId);
      socket.emit('signal', { to: targetId, signal: data });
    });

    peer.on('connect', () => {
      console.log('Peer connected to:', targetId);
    });

    peer.on('data', data => {
      this.handleIncomingData(targetId, data);
    });

    return peer;
  }

  private handleIncomingData(peerId: string, data: any) {
    try {
      if (data instanceof Uint8Array) {
        // Handle file chunk
        if (!this.receivedChunks.has(peerId)) {
          this.receivedChunks.set(peerId, []);
        }
        this.receivedChunks.get(peerId)?.push(data);
      } else {
        // Handle metadata or completion message
        const message = JSON.parse(data.toString());
        if (message.type === 'metadata') {
          this.receivedMetadata.set(peerId, message.files);
        } else if (message.type === 'file-complete') {
          this.saveReceivedFile(peerId, message.name);
        }
      }
    } catch (error) {
      console.error('Error handling incoming data:', error);
    }
  }

  private saveReceivedFile(peerId: string, fileName: string) {
    const chunks = this.receivedChunks.get(peerId);
    if (!chunks) return;

    const blob = new Blob(chunks, { 
      type: this.receivedMetadata.get(peerId)?.[0]?.type || 'application/octet-stream' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Clear received data
    this.receivedChunks.delete(peerId);
    this.receivedMetadata.delete(peerId);
  }

  async sendFiles(targetId: string, files: File[], callbacks: FileProgress): Promise<() => void> {
    console.log('Starting file transfer to:', targetId);
    const peer = this.createPeer(targetId, true);
    let cancelled = false;

    const cancel = () => {
      cancelled = true;
      peer.destroy();
      this.peers.delete(targetId);
      callbacks.onCancel();
    };

    return new Promise((resolve) => {
      peer.on('connect', async () => {
        try {
          const totalSize = files.reduce((acc, file) => acc + file.size, 0);
          let sentSize = 0;

          peer.send(JSON.stringify({
            type: 'metadata',
            files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
          }));

          for (const file of files) {
            if (cancelled) return;

            const buffer = await file.arrayBuffer();
            const chunkSize = 16384;
            const chunks = Math.ceil(buffer.byteLength / chunkSize);

            for (let i = 0; i < chunks; i++) {
              if (cancelled) return;

              const chunk = buffer.slice(i * chunkSize, (i + 1) * chunkSize);
              peer.send(new Uint8Array(chunk));
              
              sentSize += chunk.byteLength;
              const progress = Math.round((sentSize / totalSize) * 100);
              callbacks.onProgress(progress);

              await new Promise(resolve => setTimeout(resolve, 50));
            }

            peer.send(JSON.stringify({ type: 'file-complete', name: file.name }));
          }

          callbacks.onComplete();
        } catch (error) {
          console.error('Transfer error:', error);
          callbacks.onError(error as Error);
        }
      });

      resolve(cancel);
    });
  }

  destroy() {
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();
    this.receivedChunks.clear();
    this.receivedMetadata.clear();
  }
}

export const p2pService = new P2PService();