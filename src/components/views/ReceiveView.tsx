import { Device } from '@/types/device';
import { motion } from 'framer-motion';
import { Shield, Wifi } from 'lucide-react';

interface ReceiveViewProps {
  currentDevice: Device | null;
}

// Define Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
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

const bottomItemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.98 },
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
      className="flex flex-col items-center justify-center h-full min-h-[60vh] relative"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-primary/20 dark:border-primary/10"
            initial={{ width: '100px', height: '100px', opacity: 0.8 }}
            animate={{
              width: ['100px', '300px', '600px', '900px'],
              height: ['100px', '300px', '600px', '900px'],
              opacity: [0.8, 0.4, 0.1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.3,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <motion.div variants={topItemVariants} className="relative z-10 text-center">
        <div className="relative mb-6 inline-block">
          <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 blur-3xl rounded-full" />
          <motion.div
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="relative"
          >
             <img 
              src={currentDevice?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=fallback`}
              alt="Device Avatar"
              className="w-32 h-32 rounded-full shadow-2xl ring-4 ring-primary/20 relative z-10 bg-background"
             />
             <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background z-20" />
          </motion.div>
        </div>
        
        <h2 className="text-[var(--text-3xl)] font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {currentDevice?.name}
        </h2>
        
        <p className="text-muted-foreground flex items-center justify-center gap-2 text-[var(--text-lg)]">
          <Wifi className="w-5 h-5 animate-pulse text-primary" />
          Ready to receive...
        </p>
      </motion.div>

      <motion.div 
        variants={bottomItemVariants} 
        className="grid grid-cols-2 gap-4 w-full max-w-lg mt-12 px-4"
      >
        <div className="p-4 text-center">
           <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
           <h3 className="font-semibold mb-1">Secure</h3>
           <p className="text-xs text-muted-foreground">End-to-end Encrypted</p>
        </div>
        <div className="p-4 text-center">
           <Wifi className="w-6 h-6 text-primary mx-auto mb-2" />
           <h3 className="font-semibold mb-1">Fast</h3>
           <p className="text-xs text-muted-foreground">Local Network Speed</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
