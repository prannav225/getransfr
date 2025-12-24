import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system" | "glass" | "cyberpunk" | "retro";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "getransfr-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    root.classList.remove("light", "dark", "glass", "cyberpunk", "retro");

    let activeTheme = theme;
    if (theme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    const isDarkTheme = activeTheme === "dark" || activeTheme === "glass" || activeTheme === "cyberpunk" || activeTheme === "retro";
    
    root.classList.add(activeTheme);
    if (isDarkTheme) {
      root.classList.add("dark");
    }
    
    // Set color-scheme on root element for system UI theme matching.
    root.style.setProperty('color-scheme', isDarkTheme ? 'dark' : 'light');

    // Atmospheric theme colors for status bar integration
    const themeColors: Record<string, string> = {
      light: "#f8fafc",
      dark: "#020617",
      glass: "#0a1220", // Deep Navy Glow
      cyberpunk: "#051616", // Tech Teal Glow
      retro: "#0c0a05"
    };

    const color = themeColors[activeTheme] || themeColors.light;

    // Standard meta update (not deleting the tag)
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = "theme-color";
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);

    // Sync backgrounds
    document.body.style.backgroundColor = color;
    root.style.backgroundColor = color;

    // Standard Apple meta update
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
    if (!appleMeta) {
        appleMeta = document.createElement('meta');
        appleMeta.name = "apple-mobile-web-app-status-bar-style";
        document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute('content', isDarkTheme ? "black-translucent" : "default");

  }, [theme, mounted]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  if (!mounted) return null;

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};