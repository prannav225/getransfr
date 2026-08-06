import { Device } from "@/types/device";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface ReceiveViewProps {
  currentDevice: Device | null;
}

export function ReceiveView({ currentDevice }: ReceiveViewProps) {
  const avatarUrl =
    currentDevice?.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=TitaniumEclipse`;
  const deviceName = currentDevice?.name || "Titanium Eclipse";

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-lg mx-auto px-4 py-8 text-center">
      {/* Central Radar Pulse Animation */}
      <div className="relative flex items-center justify-center my-8">
        {/* Radiating Waves in Brand Accent */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-primary/30 bg-primary/5"
            initial={{ width: "120px", height: "120px", opacity: 0 }}
            animate={{
              width: ["120px", "280px"],
              height: ["120px", "280px"],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              delay: i * 1.1,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Core Avatar Badge Container */}
        <div className="relative z-10 p-3 rounded-full bg-card border border-border/50 shadow-xl">
          <img
            src={avatarUrl}
            alt={deviceName}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover bg-muted/40"
          />

          {/* Active Pulse Dot */}
          <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-card flex items-center justify-center shadow-md">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
        </div>
      </div>

      {/* Device Identity Header */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
        {deviceName}
      </h2>

      <p className="text-sm text-muted-foreground font-medium mb-6">
        Ready to receive files via local network
      </p>

      {/* Status Badges */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-card border border-border/40 text-xs font-semibold text-foreground shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Discoverable</span>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-card border border-border/40 text-xs font-semibold text-foreground shadow-sm">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>Encrypted P2P</span>
        </div>
      </div>
    </div>
  );
}
