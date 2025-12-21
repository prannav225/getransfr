import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';

interface BottomNavProps {
  activeTab: 'send' | 'receive';
  onTabChange: (tab: 'send' | 'receive') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { playSound } = useSound();
  const [clickedTab, setClickedTab] = useState<string | null>(null);

  const tabs = [
    { id: 'send', label: 'Send', icon: ArrowUpRight },
    { id: 'receive', label: 'Receive', icon: ArrowDownLeft }
  ] as const;

  return (
    <div className="fixed bottom-nav-safe left-1/2 -translate-x-1/2 z-50 w-auto">
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-glass-card border border-white/10 relative overflow-hidden backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setClickedTab(tab.id);
                onTabChange(tab.id);
                playSound('tap');
                setTimeout(() => setClickedTab(null), 400);
              }}
              className="relative px-7 py-3 rounded-full flex items-center gap-2.5 outline-none group transform-gpu"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-nav-active rounded-full"
                  transition={{ 
                    type: "spring", 
                    stiffness: 600, 
                    damping: 30,
                    mass: 0.8
                  }}
                />
              )}
              
              <div className="relative z-10 flex items-center gap-2.5">
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.15 : 0.9,
                    rotate: isActive ? (tab.id === 'send' ? 45 : -45) : 0,
                    y: isActive ? -1 : 0
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[3]' : 'stroke-[2]'}`} />
                </motion.div>

                <motion.span 
                  animate={{ 
                    color: isActive ? 'hsl(var(--primary))' : 'var(--muted-foreground)',
                    scale: isActive ? 1 : 0.95,
                    opacity: isActive ? 1 : 0.8
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-device-name text-sm sm:text-base selection:bg-transparent"
                >
                  {tab.label}
                </motion.span>
              </div>

              {/* Click Ripple Effect */}
              <AnimatePresence>
                {clickedTab === tab.id && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-full bg-white/20 z-0 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Tap Feedback */}
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="absolute inset-0 rounded-full"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
