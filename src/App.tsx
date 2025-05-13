import { Home } from './pages/Home';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Home />
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;