import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";

interface BottomNavProps {
  activeTab: "receive" | "send";
  onTabChange: (tab: "receive" | "send") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { triggerHaptic } = useHaptics();

  const tabs = [
    { id: "receive", label: "Receive", icon: ArrowDownLeft },
    { id: "send", label: "Send", icon: ArrowUpRight },
  ] as const;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto flex items-center p-1.5 bg-card/90 backdrop-blur-xl border border-border/40 rounded-full shadow-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic("light");
                onTabChange(tab.id);
              }}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm tracking-tight transition-colors duration-200 outline-none ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-secondary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="relative z-10 w-4 h-4 stroke-[2.5]" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
