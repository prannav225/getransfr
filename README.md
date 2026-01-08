# Getransfr

**Instant, Private, Peer-to-Peer File Sharing.**

Getransfr is a high-performance web-based file transfer system designed for speed, security, and seamless integration. Built with **React 19**, **TypeScript**, and **WebRTC**, it enables direct device-to-device transfers without ever touching a server.

## Features

- **Direct P2P Transfers**: Secure browser-to-browser communication using **WebRTC DataChannels**. Your data stays on your local network, ensuring maximum privacy and speed.
- **Native OS Integration**:
  - **Web Share Target**: Receives files directly from the native share sheet on Android, Windows, and macOS.
  - **File Handling API**: Register as a system-level handler for files, enabling "Open With Getransfr" integration in Finder and File Explorer.
- **Direct-to-Disk Streaming**: Leverages the **File System Access API** to stream incoming files directly to your storage, bypassing browser memory limits for massive transfers.
- **Premium UI/UX**:
  - **Glassmorphic Aesthetic**: A modern, sleek interface with vibrant gradients and animated backgrounds.
  - **Framer Motion**: Hardware-accelerated transitions and interactive micro-animations.
  - **Haptic & Audio Feedback**: High-precision tactile and sound cues for a responsive, premium feel.
- **Privacy-First Design**: No sign-ups, no cloud storage, and an ephemeral history that automatically expires to keep your activity private.

## Performance Engine

- **Worker-Offloaded I/O**: File processing is handled by a dedicated **Web Worker**, keeping the UI fluid at 120fps even during high-bandwidth transfers.
- **Intelligent Flow Control**: Advanced backpressure handling ensures network stability and prevents memory overflows.
- **Sequential Write Queue**: A robust task system that ensures file chunks are written to disk in perfect order, eliminating any chance of corruption.
- **Power Persistence**: Utilizes the **Screen Wake Lock API** to ensure transfers complete even if the device screen dims.

## Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Transport**: WebRTC (P2P Data Channels), Socket.io (Signaling)
- **Styling**: Vanilla CSS, Framer Motion
- **Storage**: IndexedDB, LocalStorage

---

Designed for speed. Built with privacy in mind.
