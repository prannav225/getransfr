import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { TransferHistoryModal } from "@/components/modals/TransferHistoryModal";
import { useDevices } from "@/hooks/useDevices";
import { Link } from "wouter";
import { ArrowLeft, Coffee, QrCode, Copy, Check, ExternalLink, Heart, Zap, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export function BuyMeCoffee() {
  const { currentDevice, updateDeviceName, randomizeAvatar } = useDevices();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("transfer_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleClearHistory = () => {
    setTransferHistory([]);
    localStorage.removeItem("transfer_history");
  };

  const [copiedUpi, setCopiedUpi] = useState(false);
  const upiId = "pr9n9v@axisbank";

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const featurePills = [
    { icon: Zap, text: "100% Free Forever" },
    { icon: Shield, text: "No Ads or Data Selling" },
    { icon: Heart, text: "Community Driven" },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-40">
        <Header
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Settings & History Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentDevice={currentDevice}
        onUpdateDeviceName={updateDeviceName}
        onRandomizeAvatar={randomizeAvatar}
      />

      <TransferHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={transferHistory}
        onClearHistory={handleClearHistory}
      />

      {/* Scrollable Body Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
          
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border/40 text-xs font-bold text-muted-foreground hover:text-primary transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </Link>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Coffee className="w-3.5 h-3.5" />
              <span>Support Development</span>
            </div>
          </div>

          {/* Hero Presentation Card */}
          <div className="relative p-8 sm:p-12 rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden text-center sm:text-left">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold tracking-wider uppercase">
                <Heart className="w-3.5 h-3.5 fill-primary" />
                <span>Keep Getransfr Free</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-sans leading-tight">
                Fuel the Project ☕
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Getransfr is a zero-knowledge local file sharing utility. We don't run ads, sell data, or charge subscriptions. Your contributions help keep server signaling fast and sustain open-source development!
              </p>

              {/* Feature Pills Grid */}
              <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {featurePills.map((pill, idx) => {
                  const Icon = pill.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/70 border border-border/30 text-xs font-semibold text-foreground"
                    >
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span>{pill.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Support Showcase Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Option 1: Buy Me a Coffee (Hero Card) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-7 rounded-3xl bg-card border border-border/50 shadow-md hover:border-primary/50 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider">
                    International
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground font-sans">
                  Buy Me a Coffee
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Support the developer via Buy Me a Coffee. Accepts Credit Card, Apple Pay, Google Pay, and international cards securely.
                </p>
              </div>

              <a
                href="https://www.buymeacoffee.com/pra9v"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-5 rounded-full bg-primary text-primary-foreground text-xs font-extrabold tracking-wide flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-all relative z-10"
              >
                <span>Buy me a coffee ☕</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Option 2: Regional UPI Support */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-7 rounded-3xl bg-card border border-border/50 shadow-md flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-secondary text-primary border border-border/40 flex items-center justify-center">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-extrabold uppercase tracking-wider">
                    India (UPI)
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground font-sans">
                  Direct UPI Transfer
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instant zero-fee transfer via GPay, PhonePe, Paytm, or BHIM UPI apps.
                </p>

                <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border/30 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">UPI ID</span>
                    <span className="text-sm font-bold font-mono text-foreground">{upiId}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyUPI}
                className="w-full py-3 px-5 rounded-full bg-secondary border border-border/50 text-xs font-extrabold text-foreground hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied UPI ID!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-primary" />
                    <span>Copy UPI ID</span>
                  </>
                )}
              </button>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
