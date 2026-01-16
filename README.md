# Getransfr

**Instant, Private, Peer-to-Peer File Sharing.**

Getransfr is a high-performance web-based file transfer system designed for speed, security, and seamless integration. Built with **React 19**, **TypeScript**, and **WebRTC**, it enables direct device-to-device transfers without ever touching a server.

## Features

- **Direct P2P Transfers**: Secure browser-to-browser communication using **WebRTC DataChannels**. Includes **STUN/TURN relay support** to ensure connectivity even across restrictive firewalls and enterprise networks.
- **Smart Clipboard Sync**: Instantly share text, links, and snippets between devices. A unified experience for both file and text-based data movement.
- **Native OS Integration**:
  - **Web Share Target**: Receives files directly from the native share sheet on Android, Windows, and macOS.
  - **File Handling API**: Register as a system-level handler for files, enabling "Open With Getransfr" integration in Finder and File Explorer.
- **Direct-to-Disk Streaming**: Leverages the **File System Access API** to stream incoming files directly to your storage, bypassing browser memory limits for massive transfers.
- **Premium UI/UX**:
  - **Fluid Gestures**: Intuitive swipe-to-switch navigation between Send and Receive modes on mobile devices.
  - **Glassmorphic Aesthetic**: A modern, sleek interface with vibrant gradients and animated backgrounds.
  - **Framer Motion**: Hardware-accelerated transitions and interactive micro-animations.
  - **Haptic Feedback**: High-precision tactile cues for a responsive, premium feel.
- **Privacy-First Design**: No sign-ups, no cloud storage, and no tracking. Automatic local device discovery via an ephemeral signaling server.

## Performance Engine

- **Worker-Offloaded I/O**: File processing and chunking are handled by a dedicated **Web Worker**, keeping the UI fluid at 120fps even during high-bandwidth transfers.
- **Smart Retry & Auto-Reconnect**: Intelligent connection monitoring that automatically restores interrupted transfers and handles network switching seamlessly.
- **Intelligent Flow Control**: Advanced backpressure handling ensures network stability and prevents memory overflows during large batch sends.
- **Sequential Write Queue**: A robust task system that ensures file chunks are written to disk in perfect order, eliminating any chance of corruption.
- **Power Persistence**: Utilizes the **Screen Wake Lock API** to ensure transfers complete even if the device screen dims or the phone goes to sleep.

## Tech Stack

- **Core**: React 19, TypeScript, Vite, Wouter
- **Transport**: WebRTC (P2P), Socket.io (Signaling), STUN/TURN (Relay)
- **UI/UX**: Framer Motion, DiceBear (Avatars), Lucide Icons
- **PWA**: Workbox (Offline support), Web Manifest, Service Workers
- **Storage**: IndexedDB, LocalStorage

---

Designed for speed. Built with privacy in mind.
