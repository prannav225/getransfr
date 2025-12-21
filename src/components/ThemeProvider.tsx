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

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark", "glass", "cyberpunk", "retro");

    let activeTheme = theme;
    if (theme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    // Force color-scheme to match the APP'S chosen theme, not the system theme.
    // This is the key to override the system navigation bar color on Android.
    const isDarkTheme = activeTheme === "dark" || activeTheme === "glass" || activeTheme === "cyberpunk" || activeTheme === "retro";
    
    root.classList.add(activeTheme);
    if (isDarkTheme) {
      root.classList.add("dark");
    }
    
    // Set color-scheme on root style for system UI (nav bars, scrollbars)
    root.style.colorScheme = isDarkTheme ? "dark" : "light";

    // Consolidated theme color mapping
    const themeColors: Record<string, string> = {
      light: "#f8fafc",
      dark: "#020617",
      glass: "#00050a",
      cyberpunk: "#03050a",
      retro: "#0c0a05"
    };

    const color = themeColors[activeTheme] || themeColors.light;

    // 1. Theme-color Meta Tag
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      (meta as any).name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);

    // 2. Body Background (Crucial for safe areas/overscroll)
    document.body.style.backgroundColor = color;

    // 3. Apple Status Bar Style
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      (appleMeta as any).name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute('content', isDarkTheme ? "black-translucent" : "default");
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

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