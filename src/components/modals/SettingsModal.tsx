import { useState } from "react";
import { X, Shield, Coffee, Copy, Check, RefreshCw, Smartphone } from "lucide-react";
import { Device } from "@/types/device";
import toast from "react-hot-toast";
import { Link } from "wouter";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDevice: Device | null;
  onUpdateDeviceName?: (newName: string) => void;
  onRandomizeAvatar?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentDevice,
  onUpdateDeviceName,
  onRandomizeAvatar,
}: SettingsModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentDevice?.name || "Titanium Eclipse");

  if (!isOpen) return null;

  const deviceName = currentDevice?.name || "Titanium Eclipse";
  const deviceId = currentDevice?.id || "4f92ff75";
  const avatarUrl =
    currentDevice?.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${deviceName}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("pra9v@fam");
    setCopiedUpi(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSaveName = () => {
    if (nameInput.trim() && onUpdateDeviceName) {
      onUpdateDeviceName(nameInput.trim());
      toast.success("Device name updated!");
    }
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h2 className="text-lg font-bold text-foreground">Settings & Profile</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* YOUR DEVICE IDENTITY */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Device Identity
            </h3>
            <div className="p-4 rounded-2xl bg-secondary/60 border border-border/30 flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl}
                  alt={deviceName}
                  className="w-14 h-14 rounded-2xl object-cover bg-card border border-border/40"
                />
                {onRandomizeAvatar && (
                  <button
                    onClick={onRandomizeAvatar}
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-110 active:scale-95 transition-all"
                    title="Randomize Avatar"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      className="w-full px-2 py-1 rounded-lg bg-card border border-primary text-sm font-bold text-foreground focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-foreground truncate">
                      {deviceName}
                    </h4>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  ID: {deviceId.substring(0, 8)}
                </p>
              </div>
            </div>
          </div>

          {/* LEGAL & COMPLIANCE */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Legal & Compliance
            </h3>
            <div className="rounded-2xl bg-secondary/60 border border-border/30 divide-y divide-border/20 overflow-hidden">
              <Link href="/privacy" onClick={onClose}>
                <div className="p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Privacy Policy</h4>
                      <p className="text-xs text-muted-foreground">
                        Local-first & WebRTC zero-knowledge
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* SUPPORT & ABOUT */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Support & About
            </h3>
            <div className="rounded-2xl bg-secondary/60 border border-border/30 p-4 space-y-4">
              {/* Buy Me a Coffee Button */}
              <Link href="/support" onClick={onClose}>
                <div className="p-3.5 rounded-xl bg-primary text-primary-foreground flex items-center justify-between font-bold text-sm shadow-sm hover:opacity-90 transition-all cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Coffee className="w-5 h-5" />
                    <span>Support Development</span>
                  </div>
                  <span className="text-xs font-normal opacity-90">Buy me a coffee ☕</span>
                </div>
              </Link>

              {/* UPI ID */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">UPI ID</span>
                  <span className="text-xs text-muted-foreground font-mono">pra9v@fam</span>
                </div>
                <button
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 rounded-xl bg-card border border-border/40 text-xs font-bold text-foreground hover:text-primary transition-all flex items-center gap-1.5"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-primary" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-border/20 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span>Getransfr Web & Mobile</span>
                </div>
                <span>Version 1.0.0 (Production)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
