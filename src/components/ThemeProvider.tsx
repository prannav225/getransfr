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

    // 1. Refresh classes
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
    
    // 2. Force color-scheme STYLE property (Crucial for Android Nav Bar)
    root.style.setProperty('color-scheme', isDarkTheme ? 'dark' : 'light');

    // 3. Define mapping for system UI colors (Hex)
    const themeColors: Record<string, string> = {
      light: "#f8fafc",
      dark: "#020617",
      glass: "#010205",
      cyberpunk: "#010205",
      retro: "#0a0802"
    };

    const color = themeColors[activeTheme] || themeColors.light;

    // 4. Update meta theme-color (Force refresh by removing and re-adding)
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());
    const meta = document.createElement('meta');
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);

    // 5. Apply background to both HTML and Body (Ensures no white gaps)
    root.style.backgroundColor = color;
    document.body.style.backgroundColor = color;

    // 6. Apple Status Bar Style
    document.querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]').forEach(el => el.remove());
    const appleMeta = document.createElement('meta');
    appleMeta.name = "apple-mobile-web-app-status-bar-style";
    appleMeta.content = isDarkTheme ? "black-translucent" : "default";
    document.head.appendChild(appleMeta);

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