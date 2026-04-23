import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";

interface BottomNavProps {
  activeTab: "send" | "receive";
  onTabChange: (tab: "send" | "receive") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { triggerHaptic } = useHaptics();
  const [clickedTab, setClickedTab] = useState<string | null>(null);

  const tabs = [
    { id: "receive", label: "Receive", icon: ArrowDownLeft },
    { id: "send", label: "Send", icon: ArrowUpRight },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/10 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-stretch justify-center h-20 max-w-lg mx-auto px-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setClickedTab(tab.id);
                onTabChange(tab.id);
                triggerHaptic("light");
                setTimeout(() => setClickedTab(null), 400);
              }}
              className="flex-1 relative flex flex-col items-center justify-center gap-1.5 outline-none group transform-gpu"
            >
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
                />
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isActive ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                {tab.label}
              </span>

              {/* Tap Feedback Layer */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="absolute inset-0 z-0"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
