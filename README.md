# Getransfr Client

The Getransfr Client is the web-based frontend for the Getransfr file sharing system. It is built using React 19, TypeScript, and Vite, with a focus on delivering a responsive, low-latency interface for peer-to-peer file exchange.

## User Interface and Experience

The application is designed to function as a "one-view" dashboard, particularly on mobile devices, to ensure all critical controls are immediately accessible.

- **Design Themes**: The client supports multiple distinct visual themes, including Modern, Glass, Retro, and Cyberpunk, each with tailored aesthetics and atmospheric transitions.
- **Interaction Feedback**: High-precision haptic feedback and custom-generated audio effects provide real-time status updates during file preparation and transfer.
- **Device Identification**: Connected peers are automatically discovered and assigned unique names and avatars generated via Dicebear for easy identification.
- **Animations**: Orchestrated UI transitions and cross-fades are handled via Framer Motion to maintain a high-end, fluid experience.

## Technical Details

- **WebRTC Integration**: Direct peer-to-peer connections are established for file transfers, keeping data entirely local and secure.
- **PWA and Share Target**: Fully functional Progressive Web App with support for the Web Share Target API, allowing users to share files to Getransfr directly from other applications.
- **State Management**: Optimized React hooks manage complex lifecycles for socket connections, RTC handshaking, and file streaming.
- **File Processing**: Client-side compression using JSZip allows for efficient transmission of entire folder structures and multi-file batches.
- **Performance Optimization**: Engineered for sub 1.2s load times and high Lighthouse performance scores. Use of the Wake Lock API ensures transfers remain active even when the device screen is dimmed.

## Dependencies

- **React 19**: Core application framework.
- **TypeScript**: Type-safe development environment.
- **Framer Motion**: Hardware-accelerated animations.
- **Socket.io Client**: Real-time signaling and discovery.
- **Tailwind CSS**: Utility-first styling and theme management.
- **JSZip**: In-browser zipping and unzipping.
- **Lucide React**: Vector icon system.
- **Vite PWA**: Service worker and manifest management.
