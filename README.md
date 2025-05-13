# DropMate Client

A modern React-based client for local file sharing with a sleek UI and real-time capabilities.

## Features

- 🎨 Modern UI with dark/light mode
- 📱 Responsive design
- ⚡ Real-time device detection
- 📦 Multiple file transfer support
- 💫 Smooth animations and transitions
- 🔒 Peer-to-peer file transfer using WebRTC
- 📁 Drag and drop file upload
- 🚀 Progress tracking for file transfers
- 🌓 System theme detection

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Lucide React Icons
- DiceBear Avatars
- JSZip
- WebRTC
- Vite
- React Hot Toast

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

### Build

```bash
# Create production build
npm run build
```

### Environment Variables

Create a `.env` file in the client directory:

```env
VITE_SERVER_URL=http://localhost:3000
```

## Project Structure

```
src/
├── components/     # React components
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
├── main.tsx       # Application entry point
└── index.css      # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
