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

    const isDarkTheme = theme === "dark" || theme === "glass" || theme === "cyberpunk" || theme === "retro";
    
    let activeTheme = theme;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      activeTheme = systemTheme;
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
      if (isDarkTheme) {
        root.classList.add("dark");
      }
    }

    // Update theme-color meta tag
    const themeColors: Record<string, string> = {
      light: "#f8fafc",
      dark: "#020817",
      glass: "#00040d",
      cyberpunk: "#03050a",
      retro: "#050401"
    };

    const color = themeColors[activeTheme] || themeColors.light;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      (meta as any).name = "theme-color";
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    meta.setAttribute('content', color);
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