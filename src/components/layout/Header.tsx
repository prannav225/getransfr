import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Device } from '@/types/device';
import { useTheme } from '@/components/ThemeProvider';
import { useSound } from '@/hooks/useSound';

interface HeaderProps {
  currentDevice: Device | null;
}

export function Header({ currentDevice }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { isMuted, setIsMuted } = useSound();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Remove no-transitions class after initial render
    document.documentElement.classList.remove('no-transitions');
  }, []);

  useEffect(() => {
    // Add transition class to html element for smooth theme changes
    document.documentElement.classList.add('transition-colors');
    document.documentElement.classList.add('duration-300');
    return () => {
      document.documentElement.classList.remove('transition-colors');
      document.documentElement.classList.remove('duration-300');
    };
  }, []);

  useEffect(() => {
    // Update meta theme-color for PWA/Mobile browser status bar
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const themeColor = isDark ? '#020817' : '#ffffff';
    
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    
    if (!meta || meta.hasAttribute('media')) {
        document.querySelectorAll('meta[name="theme-color"]').forEach(t => t.remove());
        
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', themeColor);
    
  }, [theme]);

  if (!mounted) {
    return <div className="h-[88px]" />; // Placeholder with same height to prevent layout shift
  }


  return (
    <div className="sticky top-2 lg:top-6 z-40 max-w-6xl mx-auto px-4 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-lg dark:shadow-soft-dark">
        <div className="flex items-center justify-between w-full sm:w-auto px-2 gap-4 lg:gap-8">
          <div className="flex items-center gap-3">
            <img src="/G.png" alt="Getransfr" className="w-8 h-8 lg:w-9 lg:h-9 drop-shadow-sm" />
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tighter font-outfit bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Getransfr
            </h1>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 lg:p-2.5 rounded-full hover:bg-white/10 dark:hover:bg-white/5 transition-all active:scale-95 text-muted-foreground hover:text-primary"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 lg:w-5 h-5" /> : <Volume2 className="w-4 h-4 lg:w-5 h-5" />}
            </button>
            
            <button
              onClick={toggleTheme}
              className="p-2 lg:p-2.5 rounded-full hover:bg-white/10 dark:hover:bg-white/5 transition-all active:scale-95 text-muted-foreground hover:text-primary"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 lg:w-5 h-5" /> : <Moon className="w-4 h-4 lg:w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {currentDevice && currentDevice.name && (
          <div className="flex items-center gap-3 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5 dark:border-white/5 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
            <div className="relative">
              <img
                src={currentDevice?.avatar}
                alt={currentDevice?.name}
                className="w-6 h-6 lg:w-7 lg:h-7 rounded-full ring-2 ring-white dark:ring-white/10 shadow-sm"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-black/50" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground opacity-80 hidden lg:block">Connected as</span>
              <span className="text-xs lg:text-sm font-semibold text-foreground leading-none mt-0 lg:mt-0.5">
                {currentDevice?.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}