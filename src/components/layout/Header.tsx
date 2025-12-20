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
    // Update meta theme-color for PWA/Mobile browser status bar
    const themeBgMap: Record<string, string> = {
      light: "#f8fafc",
      dark: "#020617",
      glass: "#00050a",
      cyberpunk: "#03050a",
      retro: "#0c0a05",
      minimalist: "#ffffff",
    };

    let themeName = theme;
    if (theme === "system") {
      themeName = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    const themeColor = themeBgMap[themeName] || "#020617";

    // Multiple ways to set theme color for better compatibility
    let meta = document.querySelector(
      'meta[name="theme-color"]'
    ) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", themeColor);

    // Update body background color style too to help with overscroll colors
    document.body.style.backgroundColor = themeColor;

    // Also update apple-mobile-web-app-status-bar-style
    let appleMeta = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    ) as HTMLMetaElement;
    if (!appleMeta) {
      appleMeta = document.createElement("meta");
      appleMeta.name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute("content", "black-translucent");
  }, [theme]);

  if (!mounted) {
    return <div className="h-[88px]" />; // Placeholder with same height to prevent layout shift
  }

  return (
    <div className="sticky top-2 lg:top-6 z-40 max-w-6xl mx-auto px-2 lg:px-4 transition-all duration-300">
      <div className="flex items-center justify-between gap-3 lg:gap-4 p-1.5 lg:p-2 bg-glass-card border border-white/10 rounded-full shadow-xl backdrop-blur-2xl">
        {/* Left: Brand & Connection Status */}
        <div className="flex items-center gap-2 lg:gap-4 pl-2 lg:pl-3 min-w-0">
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <img
              src="/G.png"
              alt="Getransfr"
              className="w-6 h-6 lg:w-8 lg:h-8 drop-shadow-sm transition-transform hover:scale-110"
            />
            <h1 className="hidden sm:block text-sm lg:text-lg font-black tracking-tighter bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-outfit">
              Getransfr
            </h1>
          </div>

          {currentDevice && currentDevice.name && (
            <>
              <div className="hidden sm:block w-px h-5 lg:h-6 bg-border/20 mx-1 lg:mx-2" />
              <div className="flex items-center gap-2 bg-black/5 dark:bg-black/20 pl-2 lg:pl-2.5 pr-3 lg:pr-4 py-1.5 lg:py-2 rounded-full border border-border/50 shadow-inner group/pill hover:bg-black/10 dark:hover:bg-white/5 transition-colors min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={currentDevice?.avatar}
                    alt={currentDevice?.name}
                    className="w-5 h-5 lg:w-6 lg:h-6 rounded-full ring-1 ring-primary/40 group-hover/pill:ring-primary/60 transition-all"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-background shadow-xs group-hover/pill:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] lg:text-[9px] uppercase tracking-[0.1em] font-black text-primary/60 leading-none mb-0.5 hidden lg:block">
                    You
                  </span>
                  <span className="text-[10px] lg:text-xs font-bold text-foreground truncate">
                    {currentDevice?.name}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Operations & Themes */}
        <div className="flex items-center gap-1 lg:gap-2 pr-2 lg:pr-3 shrink-0">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              playSound("tap");
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

          <div className="flex items-center gap-0.5 lg:gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-border/50 shrink-0">
            {[
              {
                name: "light",
                icon: Sun,
                color:
                  "bg-white text-orange-500 shadow-sm border border-border",
              },
              { name: "dark", icon: Moon, color: "bg-[#020817] text-blue-400" },
              {
                name: "glass",
                icon: Sparkles,
                color: "bg-blue-500/20 text-blue-400",
              },
              {
                name: "cyberpunk",
                icon: Zap,
                color: "bg-cyan-500/20 text-cyan-400",
              },
              {
                name: "retro",
                icon: Monitor,
                color: "bg-amber-500/20 text-amber-500",
              },
            ].map((t) => (
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
                title={`${
                  t.name.charAt(0).toUpperCase() + t.name.slice(1)
                } Mode`}
              >
                <t.icon className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
