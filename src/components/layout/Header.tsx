import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Monitor,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Device } from "@/types/device";
import { useTheme } from "@/components/ThemeProvider";
import { useSound } from "@/hooks/useSound";

interface HeaderProps {
  currentDevice: Device | null;
}

export function Header({ currentDevice }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { isMuted, setIsMuted, playSound } = useSound();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Remove no-transitions class after initial render
    document.documentElement.classList.remove("no-transitions");
  }, []);

  useEffect(() => {
    // Add transition class to html element for smooth theme changes
    document.documentElement.classList.add("transition-colors");
    document.documentElement.classList.add("duration-300");
    return () => {
      document.documentElement.classList.remove("transition-colors");
      document.documentElement.classList.remove("duration-300");
    };
  }, []);

  useEffect(() => {
    // Add transition class to html element for smooth theme changes
    document.documentElement.classList.add("transition-colors");
    document.documentElement.classList.add("duration-300");
    return () => {
      document.documentElement.classList.remove("transition-colors");
      document.documentElement.classList.remove("duration-300");
    };
  }, []);

  if (!mounted) {
    return <div className="h-[88px]" />; 
  }

  const themes = [
    { name: "light", icon: Sun, color: "bg-white text-orange-500 shadow-sm border border-border" },
    { name: "dark", icon: Moon, color: "bg-[#020817] text-blue-400" },
    { name: "glass", icon: Sparkles, color: "bg-blue-500/20 text-blue-400" },
    { name: "cyberpunk", icon: Zap, color: "bg-cyan-500/20 text-cyan-400" },
    { name: "retro", icon: Monitor, color: "bg-amber-500/20 text-amber-500" },
  ];

  const Brand = (
    <div className="flex items-center gap-2.5 lg:gap-4 shrink-0">
      <img
        src="/G.png"
        alt="Getransfr"
        className="w-8 h-8 lg:w-11 lg:h-11 drop-shadow-sm transition-all hover:scale-110"
      />
      <h1 className="text-lg lg:text-2xl text-brand bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        Getransfr
      </h1>
    </div>
  );

  const ThemeToggles = (isMobile: boolean) => (
    <div className={`flex items-center ${isMobile ? 'gap-0.5' : 'gap-1'} bg-black/5 dark:bg-white/5 p-1 rounded-full border border-border/50 shrink-0`}>
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => {
            setTheme(t.name as any);
            playSound("tap");
          }}
          className={`p-1.5 lg:p-2 rounded-full transition-all active:scale-90 ${
            theme === t.name
              ? `${t.color} shadow-xs ring-1 ring-primary/20`
              : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          title={`${t.name.charAt(0).toUpperCase() + t.name.slice(1)} Mode`}
        >
          <t.icon className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5 lg:w-4.5 lg:h-4.5'}`} />
        </button>
      ))}
    </div>
  );

  const CurrentDeviceStatus = (isMobile: boolean) => currentDevice && currentDevice.name && (
    <div className={`${isMobile ? 'glass-pill px-2' : 'glass-pill px-3 py-2'} group/pill hover:bg-black/10 dark:hover:bg-white/5 min-w-0`}>
      <div className="relative shrink-0">
        <img
          src={currentDevice?.avatar}
          alt={currentDevice?.name}
          className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5 lg:w-6 lg:h-6'} rounded-full ring-1 ring-primary/40 group-hover/pill:ring-primary/60 transition-all`}
        />
        <div className={`absolute -bottom-0.5 -right-0.5 ${isMobile ? 'w-2 h-2' : 'w-2 h-2'} bg-green-500 rounded-full border border-background shadow-xs group-hover/pill:scale-110 transition-transform`} />
      </div>
      <div className="flex flex-col min-w-0">
        {!isMobile && (
          <span className="text-status hidden lg:block">
            You
          </span>
        )}
        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-device-name text-foreground truncate font-medium`}>
          {currentDevice?.name}
        </span>
      </div>
    </div>
  );

  const SoundToggle = (
    <button
      onClick={() => {
        setIsMuted(!isMuted);
        playSound("tap", true);
      }}
      className="p-1.5 lg:p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-muted-foreground hover:text-primary shrink-0 active:scale-90"
      title={isMuted ? "Unmute" : "Mute"}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 lg:w-5 lg:h-5" />
      ) : (
        <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />
      )}
    </button>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-2 lg:px-4 transition-all duration-300">
      {/* Mobile Layout: 2 Rows */}
      <div className="flex sm:hidden flex-col gap-2 p-3 bg-glass-card border border-white/10 rounded-[var(--radius-xl)] backdrop-blur-2xl">
        {/* Row 1: Logo & Theme */}
        <div className="flex items-center justify-between px-1">
          {Brand}
          {ThemeToggles(true)}
        </div>
        {/* Row 2: Device & Sound */}
        <div className="flex items-center justify-between px-1">
          {CurrentDeviceStatus(true)}
          {SoundToggle}
        </div>
      </div>

      {/* Desktop Layout: 1 Row */}
      <div className="hidden sm:flex items-center justify-between gap-3 lg:gap-4 p-1.5 lg:p-2 bg-glass-card border border-white/10 rounded-full backdrop-blur-2xl">
        <div className="flex items-center gap-2 lg:gap-4 pl-2 lg:pl-3 min-w-0">
          {Brand}
          {currentDevice && (
            <>
              <div className="hidden sm:block w-px h-5 lg:h-6 bg-border/20 mx-1 lg:mx-2" />
              {CurrentDeviceStatus(false)}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:gap-2 pr-2 lg:pr-3 shrink-0">
          {SoundToggle}
          {ThemeToggles(false)}
        </div>
      </div>
    </div>
  );
}
