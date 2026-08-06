import { Header } from "@/components/layout/Header";
import { Link } from "wouter";
import { ArrowLeft, Coffee, QrCode, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export function BuyMeCoffee() {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const upiId = "pr9n9v@axisbank";

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground flex flex-col font-sans select-none">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20">
        <Header />
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8 pb-16">
          {/* Back Navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Application</span>
          </Link>

          {/* Page Hero Header */}
          <div className="space-y-3 border-l-4 border-primary pl-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
              Support Development
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
              Getransfr is 100% free, private, and open-source with no ads or tracking. Your support helps sustain server signaling infrastructure and future mobile/web releases!
            </p>
          </div>

          {/* Contribution Options */}
          <div className="grid grid-cols-1 gap-4">
            {/* Option 1: Buy Me a Coffee */}
            <motion.a
              href="https://www.buymeacoffee.com/pra9v"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-card border border-border/40 hover:border-primary/50 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Coffee className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      Buy Me a Coffee
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      International
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Support via credit card, Apple Pay, or Google Pay.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm group-hover:opacity-90 transition-all">
                <span>Buy me a coffee ☕</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </motion.a>

            {/* Option 2: Regional UPI Support */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-secondary text-primary border border-border/30">
                  <QrCode className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      UPI Direct Payment
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold">
                      India (Instant)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    UPI ID: {upiId}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyUPI}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-secondary border border-border/40 text-xs font-bold text-foreground hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied!</span>
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
