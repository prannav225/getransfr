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
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Your privacy matters.",
      content:
        "Getransfr is designed to work locally and privately. We do not upload, store, or inspect your files or text.",
    },
    {
      icon: <Server className="w-6 h-6 text-emerald-500" />,
      title: "What we transfer",
      content: (
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
          <li>Files you choose to send</li>
          <li>Text or links you explicitly share</li>
        </ul>
      ),
      footer:
        "All transfers happen directly between devices or are relayed only temporarily to establish the connection.",
    },
    {
      icon: <EyeOff className="w-6 h-6 text-rose-500" />,
      title: "What we do NOT collect",
      content: (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <li className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            No accounts
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            No personal information
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            No files or text content
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            No device scanning
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            No background clipboard access
          </li>
        </ul>
      ),
    },
    {
      icon: <HardDrive className="w-6 h-6 text-amber-500" />,
      title: "Local storage",
      content:
        "Some information (like recent transfers or device names) may be stored locally on your device for convenience. This data never leaves your device.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-indigo-500" />,
      title: "Third-party services",
      content:
        "Getransfr may use minimal third-party services for hosting or analytics. These services do not have access to your files or shared content.",
    },
    {
      icon: <Lock className="w-6 h-6 text-slate-500 dark:text-slate-400" />,
      title: "Changes to this policy",
      content:
        "If this policy changes, the updated version will always be available on this page.",
    },
  ];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground flex flex-col font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Header - Fixed/Absolute Glass Layer */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
        <div className="pointer-events-auto relative">
          <Header currentDevice={null} />
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-12 custom-scrollbar z-0"
      >
        <div className="max-w-2xl mx-auto space-y-6 py-4">
          <div className="mb-8 space-y-4">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </a>
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mt-2">
                Last updated: January 2026
              </p>
            </div>
          </div>
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 100,
              }}
              className="bg-glass-card rounded-[var(--radius-lg)] p-5 sm:p-6 border border-border/50 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-background/50 ring-1 ring-border/50 shrink-0">
                  {section.icon}
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {section.content}
                  </div>
                  {section.footer && (
                    <p className="text-sm text-muted-foreground/80 mt-2 italic">
                      {section.footer}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 rounded-[var(--radius-xl)] bg-indigo-500/5 border border-indigo-500/10 text-center space-y-2"
          >
            <div className="mx-auto w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-lg">Still have questions?</h3>
            <p className="text-sm text-muted-foreground pb-2">
              We're happy to answer any questions about our privacy practices.
            </p>
            <a
              href="mailto:pra9v@proton.me"
              className="inline-block px-4 py-2 bg-indigo-500 text-white rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
            >
              pra9v@proton.me
            </a>
          </motion.div>
          <div className="h-12" /> {/* Spacer */}
        </div>
      </div>
    </div>
  );
}
