import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { TransferHistoryModal } from "@/components/modals/TransferHistoryModal";
import { useDevices } from "@/hooks/useDevices";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Lock, Radio, Server, CheckCircle2, HardDrive, Mail } from "lucide-react";

export function PrivacyPolicy() {
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

  const privacyGuarantees = [
    "No user accounts or logins required",
    "No personal data collection (PII)",
    "No file content inspection or profiling",
    "No behavioral tracking or analytics",
    "No cloud server file storage",
    "No third-party data selling or sharing",
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans select-none overflow-x-hidden">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/20">
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
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Knowledge P2P</span>
            </div>
          </div>

          {/* Hero Banner Section */}
          <div className="relative p-8 sm:p-10 rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-2xl">
              <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-widest text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span>Security & Data Policy</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-sans leading-tight">
                Privacy Policy & Data Security
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
                Getransfr is engineered from the ground up for absolute local privacy. Your files, text payloads, and transfers never touch or sit on central cloud servers.
              </p>

              <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                <span>Effective Date: August 2026</span>
                <span>•</span>
                <span>Version 1.0.0</span>
              </div>
            </div>
          </div>

          {/* Visual Architecture Diagram Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">P2P Data Channel Architecture</h2>
                <p className="text-xs text-muted-foreground">How data moves between your devices</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/60 border border-border/30 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                  A
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Sender Device</h4>
                  <p className="text-[11px] text-muted-foreground">Local Client Sandbox</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 my-2 md:my-0">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-bold border border-emerald-500/20">
                  Encrypted DTLS/SCTP Channel
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Direct Device-to-Device</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center font-bold text-xs text-emerald-500 shadow-sm">
                  B
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Receiver Device</h4>
                  <p className="text-[11px] text-muted-foreground">Local Client Sandbox</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pl-1">
              Signaling servers are used exclusively to facilitate initial WebRTC handshake discovery. Once connected, all data flows directly peer-to-peer over your local network or WebRTC channel with 0% server payload retention.
            </p>
          </div>

          {/* Privacy Guarantees Grid */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Core Privacy Commitments</h2>
                <p className="text-xs text-muted-foreground">Zero-knowledge operational standards</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {privacyGuarantees.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Policy Provisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-card border border-border/40 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                <HardDrive className="w-4 h-4" />
                <h3>On-Device Storage</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Temporary parameters (such as your custom device nickname or transfer history logs) are stored purely within your local browser/app sandbox (LocalStorage / SharedPreferences). They never leave your device.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/40 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                <Server className="w-4 h-4" />
                <h3>Infrastructure & Analytics</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We host static client files on Vercel with minimal service health monitoring. These hosting providers have zero access or visibility into payload content being transferred.
              </p>
            </div>
          </div>

          {/* Privacy Officer Contact Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Questions or Inquiries?</h3>
              <p className="text-xs text-muted-foreground">
                Reach out directly to our Data Protection Officer for technical or privacy clarifications.
              </p>
            </div>

            <a
              href="mailto:pra9v@proton.me"
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-sm shrink-0 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Privacy Officer</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
