import { Home } from './pages/Home';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="getransfr-theme">
      <Home />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;