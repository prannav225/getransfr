import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  EyeOff,
  Server,
  HardDrive,
  Smartphone,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";

export function PrivacyPolicy() {
  const containerRef = useRef<HTMLDivElement>(null);

  const sections = [
    {
      icon: <Shield className="w-5 h-5 text-muted-foreground" />,
      title: "Data Sovereignty",
      content:
        "Getransfr is architected for local-first operations. We do not transmit, analyze, or store your private files or text data on any central servers.",
    },
    {
      icon: <Server className="w-5 h-5 text-muted-foreground" />,
      title: "Transmission Protocol",
      content: (
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
          <li>End-user selected files</li>
          <li>User-shared text payloads or URLs</li>
        </ul>
      ),
      footer:
        "Data is transferred point-to-point where possible. Relays are utilized only for NAT traversal and do not persist data.",
    },
    {
      icon: <EyeOff className="w-5 h-5 text-muted-foreground" />,
      title: "Zero-Knowledge Collection",
      content: (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <li className="flex items-center gap-2 text-muted-foreground font-medium">
            <div className="w-1 h-1 rounded-full bg-border" />
            No mandatory accounts
          </li>
          <li className="flex items-center gap-2 text-muted-foreground font-medium">
            <div className="w-1 h-1 rounded-full bg-border" />
            No PII collection
          </li>
          <li className="flex items-center gap-2 text-muted-foreground font-medium">
            <div className="w-1 h-1 rounded-full bg-border" />
            No content inspection
          </li>
          <li className="flex items-center gap-2 text-muted-foreground font-medium">
            <div className="w-1 h-1 rounded-full bg-border" />
            No persistent device identifiers
          </li>
        </ul>
      ),
    },
    {
      icon: <HardDrive className="w-5 h-5 text-muted-foreground" />,
      title: "On-Device Persistence",
      content:
        "Volatile metadata such as transfer logs or temporary device names are stored within the client-side environment. This information never leaves your browser's local sandbox.",
    },
    {
      icon: <Smartphone className="w-5 h-5 text-muted-foreground" />,
      title: "Third-Party Infrastructure",
      content:
        "We utilize static web hosting and minimal telemetry to monitor service health. These providers have no visibility into the actual data being transferred.",
    },
    {
      icon: <Lock className="w-5 h-5 text-muted-foreground" />,
      title: "Policy Amendments",
      content:
        "Any modifications to our privacy standards will be reflected on this page with an updated revision date.",
    },
  ];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground flex flex-col font-sans">
      {/* Muted Background Layer */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-muted/5 to-background" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Header currentDevice={null} />
      </div>

      {/* Content Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 custom-scrollbar z-0"
      >
        <div className="max-w-3xl mx-auto py-8">
          <div className="mb-12">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6 group">
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                Return to Application
              </a>
            </Link>

            <div className="space-y-2 border-l-2 border-primary/20 pl-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-outfit">
                Privacy Policy
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Official Document
                </span>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-medium">
                  Revision: January 2026
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-glass-card rounded-3xl p-6 sm:p-8 border border-border/40"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="p-3 rounded-2xl bg-muted/20 border border-border/40 shrink-0">
                    {section.icon}
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold tracking-tight font-outfit">
                      {section.title}
                    </h2>
                    <div className="text-sm sm:text-base text-muted-foreground leading-relaxed font-inter">
                      {section.content}
                    </div>
                    {section.footer && (
                      <p className="inline-block px-3 py-1 rounded-lg bg-background/50 border border-border/20 text-xs text-muted-foreground/60 mt-4">
                        {section.footer}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 p-8 rounded-[2.5rem] bg-glass-card border border-border/40 flex flex-col items-center text-center space-y-4"
          >
            <div className="p-4 rounded-full bg-muted/20 border border-border/40">
              <Mail className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-outfit">
                Policy Inquiries
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                For detailed technical clarifications or legal inquiries
                regarding our privacy standards, please reach out via our secure
                channel.
              </p>
            </div>
            <a
              href="mailto:pra9v@proton.me"
              className="mt-4 px-8 py-3 bg-foreground text-background rounded-full text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              Contact DPO
            </a>
          </motion.div>

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
