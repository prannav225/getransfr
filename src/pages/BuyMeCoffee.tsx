import { ArrowLeft, Coffee, Copy, Check, QrCode } from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { useState } from "react";
import toast from "react-hot-toast";

export function BuyMeCoffee() {
  const [isCopied, setIsCopied] = useState(false);
  const upiId = "pr9n9v@axisbank"; // Replace with your actual UPI ID if different

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground flex flex-col font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Header - Fixed/Absolute Glass Layer */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
        <div className="pointer-events-auto relative">
          <Header currentDevice={null} />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-12 custom-scrollbar z-0">
        <div className="max-w-2xl mx-auto py-4">
          {/* Back & Title */}
          <div className="mb-8 space-y-4 text-center sm:text-left">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </a>
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent inline-block">
                Support Getransfr
              </h1>
              <p className="text-muted-foreground mt-3 text-lg leading-relaxed max-w-lg">
                Getransfr is free, open source, and ad-free. If you enjoy using
                it, consider supporting its development!
              </p>
            </div>
          </div>
          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Option 1: Buy Me a Coffee */}
            <a
              href="https://www.buymeacoffee.com/pra9v"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-[var(--radius-xl)] bg-glass-card border border-amber-500/20 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

              <div className="relative flex items-center gap-6">
                <div className="p-4 rounded-full bg-background/50 ring-1 ring-border/50 shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Coffee className="w-6 h-6 text-amber-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold group-hover:text-amber-500 transition-colors mb-1">
                    Buy me a coffee
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base pr-4">
                    Fuel my coding sessions with a warm cup of coffee.
                  </p>
                </div>
              </div>
            </a>

            {/* Option 2: UPI Support */}
            <div className="group relative overflow-hidden rounded-[var(--radius-xl)] bg-glass-card border border-blue-500/20 p-6 transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="p-4 rounded-full bg-background/50 ring-1 ring-border/50 shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-6 h-6 text-blue-500" />
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-xl font-bold group-hover:text-blue-500 transition-colors mb-1">
                    Support via UPI
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base mb-4">
                    For Indian users, you can support directly using UPI.
                  </p>

                  {/* UPI Copy Area */}
                  <div className="relative flex items-center bg-black/20 dark:bg-black/40 rounded-lg border border-white/10 p-2 pr-12 group/input">
                    <code className="flex-1 font-mono text-sm px-2 text-foreground truncate select-all">
                      {upiId}
                    </code>
                    <button
                      onClick={handleCopyUPI}
                      className="absolute right-1 top-1 bottom-1 px-3 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center justify-center"
                      title="Copy UPI ID"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center px-4">
            <p className="text-sm text-muted-foreground/60">
              No pressure - the app works fully without support.
            </p>
          </div>
          <div className="h-12" /> {/* Spacer */}
        </div>
      </div>
    </div>
  );
}
