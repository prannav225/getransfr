import { Header } from "@/components/layout/Header";
import { Link } from "wouter";
import { ArrowLeft, Shield, Server, EyeOff, HardDrive, Smartphone, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";

export function PrivacyPolicy() {
  const sections = [
    {
      icon: Shield,
      title: "1. Local-First Sovereignty",
      content:
        "Getransfr is architected for local-first operations. We do not transmit, analyze, or store your private files or text data on any central servers.",
    },
    {
      icon: Server,
      title: "2. Point-to-Point Encryption",
      content:
        "Files and text payloads are transferred directly between devices via encrypted WebRTC DataChannels (DTLS/SCTP). Signaling servers handle initial discovery only and never persist payload data.",
    },
    {
      icon: EyeOff,
      title: "3. Zero-Knowledge Collection",
      content:
        "• No user accounts or personal information required\n• No persistent device tracking or behavioral analytics\n• No contents inspection or metadata profiling",
    },
    {
      icon: HardDrive,
      title: "4. On-Device Storage",
      content:
        "Volatile metadata such as transfer logs or customized device names are kept purely within your local client sandbox (SharedPreferences / LocalStorage) and never leave your device.",
    },
    {
      icon: Smartphone,
      title: "5. Third-Party Infrastructure",
      content:
        "We utilize static web hosting and minimal telemetry to monitor service health. These providers have no visibility into the actual data being transferred.",
    },
    {
      icon: Lock,
      title: "6. Policy Amendments",
      content:
        "Any modifications to our privacy standards will be published in app releases and reflected directly on our official website.",
    },
  ];

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
              Privacy Policy
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
                Official Document
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Revision: August 2026
              </span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
              Your privacy is fundamental to Getransfr. Our zero-knowledge peer-to-peer architecture guarantees your files and text payloads remain entirely yours.
            </p>
          </div>

          {/* Sections List */}
          <div className="grid grid-cols-1 gap-4">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 sm:p-6 rounded-2xl bg-card border border-border/40 hover:border-border/70 transition-all shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-secondary text-primary border border-border/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-1">
                    {section.content}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* DPO Contact Footer Card */}
          <div className="p-6 rounded-2xl bg-card border border-border/40 text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Privacy Inquiries</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              For detailed technical disclosures or policy questions, contact our Privacy Officer.
            </p>
            <a
              href="mailto:pra9v@proton.me"
              className="inline-block px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide hover:opacity-90 transition-all shadow-sm"
            >
              Contact Privacy Officer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
