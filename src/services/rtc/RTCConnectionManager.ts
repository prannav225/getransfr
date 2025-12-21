import { Socket } from "socket.io-client";

class RTCConnectionManager {
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    createPeerConnection(peerId: string): RTCPeerConnection {
        // Always ensure a fresh connection for a new signaling attempt
        this.closePeerConnection(peerId);

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
            ],
            iceCandidatePoolSize: 10
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate to:', peerId);
                this.socket.emit('rtc-ice-candidate', {
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE Connection State (${peerId}):`, peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'failed') {
                console.error('ICE connection failed, attempting restart...');
                peerConnection.restartIce();
            }
        };

        this.peerConnections.set(peerId, peerConnection);
        return peerConnection;
    }

    getPeerConnection(peerId: string): RTCPeerConnection | undefined {
        return this.peerConnections.get(peerId);
    }

    closePeerConnection(peerId: string): void {
        const peerConnection = this.peerConnections.get(peerId);
        if (peerConnection) {
            console.log('Closing peer connection for:', peerId);
            peerConnection.close();
            this.peerConnections.delete(peerId);
        }
    }
}

export default RTCConnectionManager;