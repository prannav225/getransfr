import { useState, useEffect, useCallback } from "react";

export interface Snippet {
  id: string; // To uniquely identify snippets
  text: string;
  timestamp: number;
}

const STORAGE_KEY = "getransfr_snippet_history";
const MAX_SNIPPETS = 4;
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function useSnippetHistory() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  // Load snippets from localStorage on mount and clean up expired ones
  useEffect(() => {
    const loadSnippets = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Snippet[] = JSON.parse(stored);
          const now = Date.now();
          // Filter out expired snippets
          const valid = parsed.filter((s) => now - s.timestamp < EXPIRY_MS);

          setSnippets(valid);
          // Update storage if we cleaned up something
          if (valid.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
          }
        }
      } catch (error) {
        console.error("Failed to load snippet history:", error);
      }
    };

    loadSnippets();

    // Optional: Periodic cleanup (every minute)
    const interval = setInterval(loadSnippets, 60000);
    return () => clearInterval(interval);
  }, []);

  const addSnippet = useCallback((text: string) => {
    setSnippets((prev) => {
      const now = Date.now();
      // Avoid duplicates at the top (optional, but good UX)
      if (prev.length > 0 && prev[0].text === text) {
        // Just update timestamp if it's the exact same text sent recently
        const updated = [{ ...prev[0], timestamp: now }, ...prev.slice(1)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }

      const newSnippet: Snippet = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        timestamp: now,
      };

      // Add new, filter expired (just in case), truncate to MAX
      const updated = [newSnippet, ...prev]
        .filter((s) => now - s.timestamp < EXPIRY_MS)
        .slice(0, MAX_SNIPPETS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { snippets, addSnippet };
}
