import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Device } from '@/types/device';

interface HeaderProps {
  currentDevice: Device | null;
}

export function Header({ currentDevice }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Remove no-transitions class after initial render
    document.documentElement.classList.remove('no-transitions');
  }, []);

  useEffect(() => {
    setMounted(true);
    const theme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const isDark = theme === 'dark' || (!theme && systemPrefersDark);
    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  useEffect(() => {
    if (currentDevice) {
      console.log('Current device in Header:', currentDevice);
    }
  }, [currentDevice]);

  useEffect(() => {
    // Update meta theme-color for PWA/Mobile browser status bar
    // Dark: slate-950 (#020817), Light: white (#ffffff) to ensure status bar icons turn black
    const themeColor = isDarkMode ? '#020817' : '#ffffff';
    
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    
    // If we found a meta tag that has a media attribute, it's one of the static ones. 
    // We want a single authoritative tag without media queries for dynamic control.
    if (!meta || meta.hasAttribute('media')) {
        // Remove all existing theme-color tags (including static media ones) to start fresh
        document.querySelectorAll('meta[name="theme-color"]').forEach(t => t.remove());
        
        // Create a new fresh tag
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', themeColor);
    
  }, [isDarkMode]);

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
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm transition-all duration-300 group"
            aria-label="Toggle theme"
          >
            <div className="relative w-4 h-4 lg:w-5 lg:h-5">
              <Sun className={`w-full h-full text-amber-500 absolute transition-all duration-500 ${isDarkMode ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`} />
              <Moon className={`w-full h-full text-primary absolute transition-all duration-500 ${!isDarkMode ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
            </div>
          </button>
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