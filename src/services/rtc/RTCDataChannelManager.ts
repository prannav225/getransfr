class RTCDataChannelManager {
    private dataChannels: Map<string, RTCDataChannel> = new Map();

    addDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
        this.dataChannels.set(peerId, dataChannel);
    }

    getDataChannel(peerId: string): RTCDataChannel | undefined {
        return this.dataChannels.get(peerId);
    }

    closeDataChannel(peerId: string): void {
        const dataChannel = this.dataChannels.get(peerId);
        if (dataChannel) {
            if (dataChannel.readyState === 'open') {
                dataChannel.close();
            }
            this.dataChannels.delete(peerId);
        }
    }
}

export default RTCDataChannelManager;