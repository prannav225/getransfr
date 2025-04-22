import { Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { Device } from '@/types/device';

interface HeaderProps {
  currentDevice: Device | null;
}

export function Header({ currentDevice }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
          DropMate
        </h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm shadow-inner-light dark:shadow-inner-dark border border-white/10 dark:border-white/5"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-white/70" />
          ) : (
            <Moon className="w-4 h-4 text-dropmate-primary/70" />
          )}
        </button>
      </div>
      {currentDevice && (
        <div className="flex items-center gap-3 bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm px-4 py-2 rounded-full shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5">
          <img
            src={currentDevice.avatar}
            alt={currentDevice.name}
            className="w-7 h-7 rounded-full ring-2 ring-dropmate-primary/30 dark:ring-dropmate-primary-dark/30"
          />
          <span className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70">Connected as</span>
          <span className="text-sm font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark">{currentDevice.name}</span>
        </div>
      )}
    </div>
  );
}