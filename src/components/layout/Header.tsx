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

  if (!mounted) {
    return <div className="h-[88px]" />; // Placeholder with same height to prevent layout shift
  }


  return (
    <div className="sticky top-4 z-40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 p-4 rounded-2xl backdrop-blur-xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 shadow-lg transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-dropmate-primary to-dropmate-accent-pink shadow-lg shadow-dropmate-primary/20">
          <h1 className="text-xl font-bold text-white tracking-tight font-oswald">
            Getransfr
          </h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-300 group"
          aria-label="Toggle theme"
        >
          <div className="relative w-5 h-5">
            <Sun className={`w-5 h-5 text-amber-400 absolute transition-all duration-500 ${isDarkMode ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`} />
            <Moon className={`w-5 h-5 text-dropmate-primary absolute transition-all duration-500 ${!isDarkMode ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
          </div>
        </button>
      </div>
      {currentDevice && currentDevice.name && (
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
          <div className="relative">
            <img
              src={currentDevice.avatar}
              alt={currentDevice.name}
              className="w-8 h-8 rounded-full ring-2 ring-white/20"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-dropmate-text-muted dark:text-dropmate-text-muted-dark opacity-70">Connected as</span>
            <span className="text-sm font-semibold text-dropmate-text-primary dark:text-dropmate-text-primary-dark leading-none">
              {currentDevice.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}