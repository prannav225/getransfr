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
    <header className="w-full flex items-center justify-between px-5 sm:px-8 py-3 bg-background/80 backdrop-blur-md border-b border-border/20 z-40">
      {/* Title / Brand */}
      <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.6px] text-foreground font-sans">
          {title}
        </h1>
      </Link>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Theme Switcher Circular Pill */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95 shadow-sm"
          title="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-primary" />
          ) : (
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-primary" />
          )}
        </button>

        {/* Combined History & Settings Capsule Pill */}
        <div className="flex items-center h-9 sm:h-10 px-1 bg-card border border-border/40 rounded-full shadow-sm">
          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenHistory?.();
            }}
            className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full active:scale-95"
            title="Transfer History"
          >
            <History className="w-4 h-4 text-primary" />
          </button>

          <div className="w-[0.5px] h-4 bg-border/60 mx-0.5" />

          <button
            onClick={() => {
              triggerHaptic("light");
              onOpenSettings?.();
            }}
            className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full active:scale-95"
            title="Settings & Profile"
          >
            <Settings className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>
    </header>
  );
}
