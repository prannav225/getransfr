import { Sun, Moon, History, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useHaptics } from "@/hooks/useHaptics";
import { Link } from "wouter";

interface HeaderProps {
  activeTab?: "receive" | "send";
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  currentDevice?: any;
}

export function Header({
  activeTab = "receive",
  onOpenHistory,
  onOpenSettings,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { triggerHaptic } = useHaptics();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[60px]" />;
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    triggerHaptic("light");
    setTheme(isDark ? "light" : "dark");
  };

  const title = activeTab === "receive" ? "Receive" : "Send";
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-24 pointer-events-none z-40 bg-(--bg)/40 [-webkit-backdrop-filter:blur(16px)] [backdrop-filter:blur(16px)] mask-[linear-gradient(to_bottom,black_0%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]" />
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-transparent px-4 sm:px-8 pointer-events-none transition-all duration-300 max-w-4xl mx-auto pt-4 pb-2">
        {/* Leading Edge: Navigation Title */}
        <div className="flex items-center gap-3 pointer-events-auto min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-[-0.6px] text-foreground font-sans truncate">
              {title}
            </h1>
          </Link>
        </div>

        {/* Trailing Edge: Grouped Toolbar Items in Glass Pill */}
        <div className="flex items-center justify-end gap-2.5 pointer-events-auto shrink-0">
          <div className="flex items-center p-1 border border-black/5 dark:border-white/10 bg-white/40 dark:bg-[#2d2d2c]/60 backdrop-blur-3xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)]">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="relative h-7 w-7 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer bg-transparent text-foreground/80 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 border-none outline-none"
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-primary" />
              ) : (
                <Moon className="w-4 h-4 text-primary" />
              )}
            </button>

            <div className="w-[0.5px] h-4 bg-border/60 mx-0.5" />

            {/* History Button */}
            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenHistory?.();
              }}
              className="relative h-7 w-7 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer bg-transparent text-foreground/80 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 border-none outline-none"
              aria-label="Transfer History"
            >
              <History className="w-4 h-4 text-primary" />
            </button>

            <div className="w-[0.5px] h-4 bg-border/60 mx-0.5" />

            {/* Settings Button */}
            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenSettings?.();
              }}
              className="relative h-7 w-7 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer bg-transparent text-foreground/80 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 border-none outline-none"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
