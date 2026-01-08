# Getransfr Client

The Getransfr Client is a high-performance, web-based frontend for the Getransfr peer-to-peer file sharing system. Built with React 19, TypeScript, and Vite, it is engineered for rock-solid reliability and maximum throughput on local networks.

## Features

- **Direct P2P Transfers**: Secure browser-to-browser communication using **WebRTC**, keeping your data off intermediate servers.
- **Reliable 1-to-1 Engine**: Dedicated transmission pipe engineered for maximum bandwidth utilization and rock-solid stability.
- **Direct-to-Disk Streaming**: Integrates the **File System Access API** to stream files directly to disk, eliminating memory bottlenecks for massive transfers.
- **Advanced Text Sharing**: Instantly share snippets and URLs. Features **Smart Link Detection** to open URLs directly, **Auto-Focus** input for speed, and `Ctrl+Enter` shortcuts.
- **Privacy-First History**: Keeps the last 4 received snippets in local storage for quick access. Authenticated zero-knowledge design ensures history **auto-expires after 1 hour** for complete privacy.
- **Smart Connection Recovery**: Automated **ICE Restarts** to automatically recover from network drops or IP switches during transfers.
- **PWA & Share Target**: Fully installable as a Progressive Web App. Support for the **Web Share Target API** allows you to "Share to Getransfr" from other apps.
- **Dynamic Audio & Haptics**: Integrated sound effects and high-precision haptic feedback for a premium interactive experience.

## Technical Architecture

- **Worker-Offloaded I/O**: File reading and slicing are handled by a dedicated **Web Worker**, ensuring a fluid 60fps UI even during multi-gigabit transfers.
- **Advanced Backpressure Handling**: Integrated `bufferedAmountLow` event-driven flow control to prevent memory overflows and network congestion.
- **Sequential Write Queue**: Ensures file chunks are written to disk or memory in perfect order, eliminating corruption.
- **Power Persistence**: Utilizes the **Screen Wake Lock API** to ensure transfers complete even if the device screen dims.
- **Modern UI Stack**: Built with **Framer Motion** for premium animations and **Tailwind CSS** for a responsive, glassmorphic aesthetic.

## Tech Stack

- **React 19**: Modern component-based architecture.
- **TypeScript**: Strict type safety for the entire transfer engine.
- **WebRTC**: Direct data channel transport.
- **Socket.io**: Real-time signaling and presence management.
- **Framer Motion**: Premium, hardware-accelerated animations.
- **Lucide React**: Sleek, consistent iconography.
