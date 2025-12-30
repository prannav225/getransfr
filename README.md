# Getransfr Client

The Getransfr Client is the web-based frontend for the Getransfr file sharing system. It is built using React 19, TypeScript, and Vite, with a focus on delivering a responsive, low-latency interface for peer-to-peer file exchange.

## User Interface and Experience

The application is designed to function as a "one-view" dashboard, particularly on mobile devices, to ensure all critical controls are immediately accessible.

- **Mesh Mesh Mode**: Supports simultaneous broadcasting to multiple recipients, enabling efficient "one-to-many" distribution without main-thread blocking.
- **Network Awareness**: Dynamically detects and badges peers as "Local Wifi" or "Remote" based on IP metadata to provide transparency on the connection path.
- **Design Themes**: The client supports multiple distinct visual themes, including Modern, Glass, Retro, and Cyberpunk, each with tailored aesthetics and atmospheric transitions.
- **Interaction Feedback**: High-precision haptic feedback and custom-generated audio effects provide real-time status updates during file preparation and transfer.
- **Device Identification**: Connected peers are automatically discovered and assigned unique names and avatars generated via Dicebear for easy identification.
- **Animations**: Orchestrated UI transitions and cross-fades are handled via Framer Motion to maintain a high-end, fluid experience.

## Technical Details

- **WebRTC Turbo Stack**: Engineered for maximum throughput using native `bufferedAmountLow` event-driven flow control and high-threshold memory pipelining.
- **Background Worker Processing**: Critical file I/O and mesh broadcasting logic are offloaded to a dedicated Web Worker, ensuring a stutter-free 60fps UI even during 1GB+ transfers.
- **Resume Capability (Checkpointing)**: Implements a byte-exact resume handshake. If a connection drops, the system identifies the last successful chunk and resumes the stream from the interruption point.
- **Folder Preservation**: Utilizes the File System Access API and relative path metadata to maintain folder hierarchies across transfers.
- **PWA and Share Target**: Fully functional Progressive Web App with support for the Web Share Target API, allowing users to share files to Getransfr directly from other applications.
- **Performance Architecture**: Sub 1.2s First Contentful Paint. Use of the Wake Lock API ensures transfers remain active even when the device screen is dimmed.

## Dependencies

- **React 19**: Core application framework.
- **TypeScript**: Type-safe development environment.
- **Framer Motion**: Hardware-accelerated animations.
- **Socket.io Client**: Real-time signaling and discovery.
- **Tailwind CSS**: Utility-first styling and theme management.
- **JSZip**: In-browser zipping and unzipping.
- **Lucide React**: Vector icon system.
- **Vite PWA**: Service worker and manifest management.
