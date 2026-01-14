import { ArrowLeft, Coffee, Copy, Check, QrCode } from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { useState } from "react";
import toast from "react-hot-toast";

export function BuyMeCoffee() {
  const [isCopied, setIsCopied] = useState(false);
  const upiId = "pr9n9v@axisbank";

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground flex flex-col font-sans">
      {/* Muted Background Layer */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-background" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Header currentDevice={null} />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 custom-scrollbar z-0">
        <div className="max-w-3xl mx-auto py-8">
          {/* Back & Title */}
          <div className="mb-12">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6 group">
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                Return to Application
              </a>
            </Link>

            <div className="space-y-4 border-l-2 border-primary/20 pl-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-outfit">
                Support Development
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed max-w-xl font-inter">
                Getransfr is a community-driven, open-source project. While the
                service remains free and ad-free, your contributions help
                sustain infrastructure and future development.
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
              className="group relative overflow-hidden rounded-[2.5rem] bg-glass-card border border-border/40 p-8 transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-105">
                  <Coffee className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold font-outfit">
                      Global Contribution
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base pr-4 leading-relaxed font-inter">
                    Support the project via Buy Me a Coffee, accepting
                    international payments.
                  </p>
                </div>
              </div>
            </a>

            {/* Option 2: UPI Support */}
            <div className="group relative overflow-hidden rounded-[2.5rem] bg-glass-card border border-border/40 p-8 transition-all duration-300">
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-105">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold font-outfit">
                      Regional (UPI)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground text-[8px] font-black uppercase tracking-wider">
                      India
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed font-inter">
                    Direct transfer via Unified Payments Interface for local
                    support.
                  </p>

                  {/* UPI Copy Area */}
                  <div className="relative flex items-center bg-black/5 dark:bg-white/5 rounded-2xl border border-border/40 p-3 pr-14 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                    <code className="flex-1 font-mono text-xs sm:text-sm px-2 text-foreground truncate select-all font-bold">
                      {upiId}
                    </code>
                    <button
                      onClick={handleCopyUPI}
                      className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-foreground text-background transition-all flex items-center justify-center hover:opacity-90 active:scale-95 shadow-sm"
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

          <div className="mt-16 text-center space-y-4">
            <div className="w-12 h-1 bg-border/40 mx-auto rounded-full" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
              Gratitude for your support
            </p>
          </div>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
