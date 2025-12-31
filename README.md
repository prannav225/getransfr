# Getransfr Client

The Getransfr Client is a high-performance, web-based frontend for the Getransfr peer-to-peer file sharing system. Built with React 19, TypeScript, and Vite, it is engineered for rock-solid reliability and maximum throughput on local networks.

## User Interface and Experience

The application features a "one-view" dashboard designed for speed and simplicity, ensuring that sending and receiving files is seamless on both desktop and mobile devices.

- **Reliable 1-to-1 Transfer**: Focused on dedicated sessions between two devices to ensure maximum bandwidth utilization and zero interference.
- **Flat-List Distribution**: Simplified file handling that treats all uploads as a flat list, ensuring broad compatibility and avoiding file system permission complexities.
- **Modern Design Themes**: Supports multiple visual modes (Modern, Glass, Retro, Cyberpunk) with high-end glassmorphism, vibrant gradients, and smooth Framer Motion transitions.
- **Real-Time Visual Feedback**: Dynamic progress bars with live speed (MB/s) and ETA calculation for both sender and receiver.
- **Smart Device Discovery**: Automatic peer detection with unique, user-friendly names and avatars generated via Dicebear.
- **Acoustic & Haptic Feedback**: Integrated sound effects and haptics provide intuitive confirmation for transfer starts, completions, and requests.

## Technical Architecture

- **WebRTC Turbo Stack**: Native WebRTC implementation utilizing `bufferedAmountLow` event-driven flow control and hybrid polling to prevent main-thread hangs and optimize throughput.
- **Background Worker Chunker**: File reading and slicing are offloaded to a dedicated Web Worker, preventing UI stuttering and ensuring a fluid 60fps experience even during multi-gigabyte transfers.
- **Sequential Write Queue**: Implements an asynchronous task queue on the receiver side to ensure file chunks are written to disk or memory in perfect order, eliminating file corruption.
- **Native File System API**: Supports direct-to-disk streaming via the File System Access API where available (Chrome/Edge), falling back to high-speed memory buffering for other browsers.
- **Power Management**: Utilizes the Screen Wake Lock API to prevent devices from sleeping during active transfers, ensuring long sessions complete successfully.
- **PWA & Share Target**: Fully installable Progressive Web App with Share Target integration, allowing you to share files from other apps directly into Getransfr.

## Performance Benchmarks

- **Sub 1.2s FCP**: Highly optimized asset delivery and code splitting for near-instant load times.
- **Memory Optimized**: Chunks are processed in small, manageable pieces (128KB) to maintain a low memory footprint even when handling 4K videos or massive datasets.
- **Throttled React Reconciliation**: UI updates are gated to 100-150ms intervals to ensure the React render cycle doesn't bottleneck the data stream.

## Tech Stack

- **React 19**: Modern component-based architecture.
- **TypeScript**: Strict type safety for the entire transfer engine.
- **Framer Motion**: Premium, hardware-accelerated animations.
- **Socket.io**: Real-time signaling and presence management.
- **Tailwind CSS**: Utility-first styling for responsive design.
- **Lucide React**: Sleek, consistent iconography.
