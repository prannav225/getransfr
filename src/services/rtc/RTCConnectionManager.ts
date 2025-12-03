import { Socket } from "socket.io-client";

class RTCConnectionManager {
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    createPeerConnection(peerId: string): RTCPeerConnection {
        if (this.peerConnections.has(peerId)) {
            return this.peerConnections.get(peerId)!;
        }

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:relay1.expressturn.com:3478',
                    username: import.meta.env.VITE_TURN_USERNAME || '',
                    credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
                }
            ],
            iceCandidatePoolSize: 10,
            iceTransportPolicy: 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('rtc-ice-candidate', {
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
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
            peerConnection.close();
            this.peerConnections.delete(peerId);
        }
    }
}

export default RTCConnectionManager;