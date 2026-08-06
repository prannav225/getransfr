import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";

interface BottomNavProps {
  activeTab: "receive" | "send";
  onTabChange: (tab: "receive" | "send") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { triggerHaptic } = useHaptics();

  const activeIndex = activeTab === "receive" ? 0 : 1;

  const tabs = [
    {
      id: "receive",
      label: "Receive",
      icon: ArrowDownLeft,
    },
    {
      id: "send",
      label: "Send",
      icon: ArrowUpRight,
    },
  ] as const;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40 bg-(--bg)/40 [-webkit-backdrop-filter:blur(16px)] [backdrop-filter:blur(16px)] mask-[linear-gradient(to_top,black_0%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,transparent_100%)]" />
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="pointer-events-auto relative grid grid-cols-2 w-64 sm:w-72 p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-3xl border border-black/10 dark:border-white/15 rounded-full shadow-[0_16px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.5)] select-none">
          {/* iOS Liquid Glass Inner Border */}
          <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/10 pointer-events-none" />

          {/* Theme-Aware Glitch-Free Sliding Active Pill */}
          <motion.div
            className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-black/10 border border-black/10 dark:bg-white/15 dark:border-white/20 rounded-full shadow-sm pointer-events-none"
            animate={{ x: `${activeIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />

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
                className="relative z-10 flex items-center justify-center gap-2.5 h-11 sm:h-12 rounded-full text-xs sm:text-sm tracking-tight transition-colors duration-200 outline-none active:scale-95"
              >
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] transition-all ${
                    isActive
                      ? "text-[#D97757] scale-110 drop-shadow-[0_0_8px_rgba(217,119,87,0.4)]"
                      : "text-muted-foreground"
                  }`}
                />

                <span
                  className={`font-sans text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#D97757]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
