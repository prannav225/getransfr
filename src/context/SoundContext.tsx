import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SoundProviderState {
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
}

const initialState: SoundProviderState = {
  isMuted: false,
  setIsMuted: () => null,
};

const SoundProviderContext = createContext<SoundProviderState>(initialState);

export function SoundProvider({
  children,
  storageKey = "getransfr-muted",
  ...props
}: {
  children: ReactNode;
  storageKey?: string;
}) {
  const [isMuted, setIsMutedState] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(isMuted));
  }, [isMuted, storageKey]);

  const setIsMuted = (muted: boolean) => {
    setIsMutedState(muted);
  };

  const value = {
    isMuted,
    setIsMuted,
  };

  return (
    <SoundProviderContext.Provider {...props} value={value}>
      {children}
    </SoundProviderContext.Provider>
  );
}

export const useSoundContext = () => {
  const context = useContext(SoundProviderContext);

  if (context === undefined)
    throw new Error("useSoundContext must be used within a SoundProvider");

  return context;
}
