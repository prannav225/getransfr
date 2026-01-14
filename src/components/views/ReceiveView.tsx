import { Device } from "@/types/device";
import { motion } from "framer-motion";
import { Wifi } from "lucide-react";

interface ReceiveViewProps {
  currentDevice: Device | null;
}

// Define Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const topItemVariants = {
  hidden: { y: -30, opacity: 0, scale: 0.98 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 30,
    },
  },
};

export function ReceiveView({ currentDevice }: ReceiveViewProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center h-full min-h-[60vh] relative pt-4 sm:pt-10 px-4 overflow-hidden"
    >
      <motion.div
        variants={topItemVariants}
        className="relative z-10 text-center w-full max-w-sm"
      >
        <div className="relative mb-10 inline-block">
          {/* Sonar Pulse - High Fidelity Waves */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-primary/30 dark:border-primary/20 bg-primary/2"
                initial={{ width: "120px", height: "120px", opacity: 0 }}
                animate={{
                  width: ["120px", "min(420px, 85vw)"],
                  height: ["120px", "min(420px, 85vw)"],
                  opacity: [0, 0.4, 0],
                  scale: [1, 1.15],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </div>

          {/* Core Avatar with Breathing Effect */}
          <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 blur-3xl rounded-full" />
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
              rotate: [0, 1, -1, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <img
              src={
                currentDevice?.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=fallback`
              }
              alt="Device Avatar"
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-xl ring-4 ring-primary/20 relative z-10 bg-background object-cover"
            />
            {/* Status Indicator */}
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-4 border-background z-20 shadow-lg shadow-green-500/20">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-full h-full rounded-full bg-white/30"
              />
            </div>
          </motion.div>
        </div>

        {/* Discovery Info */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-green-500">
              Discoverable
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-outfit">
            {currentDevice?.name}
          </h2>

          <div className="flex flex-col items-center gap-1">
            <p className="text-muted-foreground transition-colors duration-500 flex items-center justify-center gap-2 text-sm sm:text-base font-medium">
              <Wifi className="w-4 h-4 text-primary" />
              Waiting for files...
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground/50 font-bold uppercase tracking-widest leading-relaxed">
              Stay on this screen so others can find you.
            </p>
          </div>
        </div>

        <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary/60"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
            Secure Local Discovery
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
