import { socket } from './socket';

class ClipboardService {
  shareText(to: string, text: string) {
    socket.emit('clipboard-share', { to, text });
  }

  onReceive(callback: (data: { from: string; text: string }) => void) {
    socket.on('clipboard-receive', callback);
    return () => {
      socket.off('clipboard-receive', callback);
    };
  }
}

export default new ClipboardService();
