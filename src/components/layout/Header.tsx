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

  if (!mounted) {
    return <div className="h-[88px]" />; // Placeholder with same height to prevent layout shift
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
          DropMate
        </h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm shadow-inner-light dark:shadow-inner-dark border border-white/10 dark:border-white/5 transition-all duration-300"
        >
          <div className="relative w-4 h-4">
            <Sun className={`w-4 h-4 text-white/70 absolute transition-all duration-300 ${isDarkMode ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`} />
            <Moon className={`w-4 h-4 text-dropmate-primary/70 absolute transition-all duration-300 ${!isDarkMode ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
          </div>
        </button>
      </div>
      {currentDevice && (
        <div className="flex items-center gap-3 bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm px-4 py-2 rounded-full shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5 transition-colors duration-300">
          <img
            src={currentDevice.avatar}
            alt={currentDevice.name}
            className="w-7 h-7 rounded-full ring-2 ring-dropmate-primary/30 dark:ring-dropmate-primary-dark/30 transition-colors duration-300"
          />
          <span className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70 transition-colors duration-300">Connected as</span>
          <span className="text-sm font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark transition-colors duration-300">{currentDevice.name}</span>
        </div>
      )}
    </div>
  );
}