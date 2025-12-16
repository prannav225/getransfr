import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: 'send' | 'receive';
  onTabChange: (tab: 'send' | 'receive') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto">
      <div className="flex items-center gap-1 p-1.5 rounded-full bg-glass-card backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-glow dark:shadow-glow-dark">
        <button
          onClick={() => onTabChange('send')}
          className={`relative px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300 ${
            activeTab === 'send' 
              ? 'text-white' 
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          {activeTab === 'send' && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2 font-medium">
            <ArrowUpRight className="w-5 h-5" />
            Send
          </span>
        </button>

        <button
          onClick={() => onTabChange('receive')}
          className={`relative px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300 ${
            activeTab === 'receive' 
              ? 'text-white' 
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          {activeTab === 'receive' && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2 font-medium">
            <ArrowDownLeft className="w-5 h-5" />
            Receive
          </span>
        </button>
      </div>
    </div>
  );
}
