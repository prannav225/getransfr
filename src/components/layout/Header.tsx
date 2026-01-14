import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Device } from "@/types/device";
import { useTheme, Theme } from "@/components/ThemeProvider";
import { useHaptics } from "@/hooks/useHaptics";
import { motion } from "framer-motion";

interface HeaderProps {
  currentDevice: Device | null;
}

export function Header({ currentDevice }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { triggerHaptic } = useHaptics();
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

  if (!mounted) {
    return <div className="h-[88px]" />;
  }

  const themes = [
    {
      name: "light",
      icon: Sun,
      color: "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
    },
    {
      name: "dark",
      icon: Moon,
      color: "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
    },
    {
      name: "system",
      icon: Monitor,
      color: "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
    },
  ];

  const Brand = (
    <div className="flex items-center gap-2.5 lg:gap-4 shrink-0">
      <Link
        href="/"
        className="flex items-center gap-2.5 lg:gap-4 hover:opacity-80 transition-opacity"
      >
        <img
          src="/G.png"
          alt="Getransfr"
          className="w-8 h-8 lg:w-11 lg:h-11 drop-shadow-sm transition-all hover:scale-110"
        />
        <h1 className="text-lg lg:text-2xl text-brand bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Getransfr
        </h1>
      </Link>
    </div>
  );

  const ThemeToggles = (isMobile: boolean) => (
    <div
      className={`flex items-center ${
        isMobile ? "gap-1" : "gap-1.5"
      } bg-black/10 dark:bg-white/5 p-1 rounded-full border border-border/10 shrink-0 relative`}
    >
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => {
            setTheme(t.name as Theme);
            triggerHaptic("light");
          }}
          className={`relative p-1.5 lg:p-2 rounded-full transition-colors z-10 ${
            theme === t.name
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={`${t.name.charAt(0).toUpperCase() + t.name.slice(1)} Mode`}
        >
          {theme === t.name && (
            <motion.div
              layoutId={isMobile ? "activeThemeMobile" : "activeThemeDesktop"}
              className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/20"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <t.icon
            className={`relative z-20 ${
              isMobile ? "w-3.5 h-3.5" : "w-4 h-4 lg:w-5 lg:h-5"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const CurrentDeviceStatus = (isMobile: boolean) =>
    currentDevice &&
    currentDevice.name && (
      <div
        className={`${
          isMobile ? "px-2.5 py-1.5" : "px-3 py-1.5"
        } group/pill flex items-center gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-all duration-300 min-w-0 border-none`}
      >
        <div className="relative shrink-0 flex items-center">
          <div className="absolute inset-0 bg-green-500/20 blur-sm rounded-full animate-pulse" />
          <img
            src={currentDevice?.avatar}
            alt={currentDevice?.name}
            className={`${
              isMobile ? "w-6 h-6" : "w-7 h-7 lg:w-8 lg:h-8"
            } rounded-full ring-2 ring-primary/20 group-hover/pill:ring-primary/40 transition-all z-10 object-cover`}
          />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-background"></span>
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`${
                isMobile ? "text-xs" : "text-sm"
              } text-device-name text-foreground truncate font-bold tracking-tight`}
            >
              {currentDevice?.name}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 leading-none">
            Active Now
          </span>
        </div>
      </div>
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
        {/* Row 2: Device */}
        <div className="flex items-center justify-between px-1">
          {CurrentDeviceStatus(true)}
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
          {ThemeToggles(false)}
        </div>
      </div>
    </div>
  );
}
