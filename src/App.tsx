import { Home } from './pages/Home';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SoundProvider } from '@/context/SoundContext';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="getransfr-theme">
      <SoundProvider storageKey="getransfr-muted">
        <Home />
        <Toaster position="top-right" />
      </SoundProvider>
    </ThemeProvider>
  );
}

export default App;