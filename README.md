# Getransfr Client

The Getransfr Client is the web-based frontend for the Getransfr file sharing system. It is built using React 18, TypeScript, and Vite, with a focus on delivering a responsive, low-latency interface for peer-to-peer file exchange.

## user interface and experience

The application is designed to function as a "one-view" dashboard, particularly on mobile devices, to ensure all critical controls are immediately accessible.

- Design Themes: The client supports four distinct visual themes:
    - Modern: A clean, minimalist approach.
    - Glass: Utilizes backdrop blurs and transparency for a layered effect.
    - Retro: Inspired by classic desktop operating systems with high-offset shadows.
    - Cyberpunk: A high-contrast tech aesthetic.
- Interaction Feedback: Real-time status updates provide information during file preparation (such as zipping large folders) and transfer progress.
- Device Identification: Connected peers are automatically discovered and assigned unique names and avatars for easy identification.
- Animations: Smooth transitions between "Send" and "Receive" views are handled via Framer Motion to maintain a high-end feel.

## development setup

### configuration

The client interacts with the signaling server via environment variables. Create a `.env` file in the root of the client directory:

```env
VITE_SERVER_URL=http://localhost:3001
```

### commands

- npm install: Installs all necessary dependencies.
- npm run dev: Starts the Vite development server with hot module replacement.
- npm run build: Generates a production-ready optimized bundle.

## technical details

- WebRTC Integration: Direct peer-to-peer connections are established for file transfers, using the server only for the initial signaling handshake.
- State Management: Uses custom React hooks to manage complex states for socket connections and file transfer lifecycles.
- Layout Control: Implements advanced CSS techniques like scrollbar-gutter and sticky headers to ensure layout stability during dynamic content updates.
- PWA Support: Designed to be installable on mobile and desktop platforms as a Progressive Web App.

## dependencies

- React & TypeScript: Core application framework.
- Framer Motion: Used for orchestrated UI transitions.
- Socket.io Client: Manages persistent connections for device discovery.
- Tailwind CSS: Utility-first framework for responsive design and theme management.
- JSZip: Handles folder compression directly in the browser.
- Lucide React: Provides a consistent icon system.
