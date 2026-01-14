import { useState, useEffect } from "react";
import {
  X,
  Clipboard as ClipboardIcon,
  Send,
  Check,
  Copy,
  ExternalLink,
  History,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useSnippetHistory } from "@/hooks/useSnippetHistory";
import { formatDistanceToNow } from "date-fns";

interface TextTransferModalProps {
  mode: "send" | "receive";
  deviceName: string;
  initialText?: string;
  onAction: (text?: string) => void;
  onClose: () => void;
}

export function TextTransferModal({
  mode,
  deviceName,
  initialText = "",
  onAction,
  onClose,
}: TextTransferModalProps) {
  const { triggerHaptic } = useHaptics();
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { addSnippet, snippets } = useSnippetHistory();

  // Save received text to history
  useEffect(() => {
    if (mode === "receive" && initialText) {
      addSnippet(initialText);
    }
  }, [mode, initialText, addSnippet]);

  // Check if text is a valid URL
  const isUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const isContentUrl = isUrl(text);

  const handleCopy = async (textToCopy: string = text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        triggerHaptic("medium");
        toast.success("Copied to clipboard");
        // Auto dismiss after a short delay to show success state
        setTimeout(() => {
          setCopied(false);
          // Only auto-close if copying the main text in receive mode
          if (mode === "receive" && textToCopy === text) onClose();
        }, 800);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      // Fallback for non-secure contexts (HTTP)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed"; // Avoid scrolling
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          triggerHaptic("medium");
          toast.success("Copied to clipboard");
          setTimeout(() => {
            setCopied(false);
            if (mode === "receive" && textToCopy === text) onClose();
          }, 800);
        } else {
          throw new Error("Fallback failed");
        }
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
        toast.error("Failed to copy. Please copy manually.");
      }
    }
  };

  const handleSend = () => {
    // Double check trim, though button should be disabled
    if (!text.trim()) {
      return;
    }
    onAction(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: isFocused ? -80 : 0, // Move up when focused (mobile keyboard handling)
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-glass-card rounded-[var(--radius-xl)] text-card-foreground shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header Section */}
        <div className="relative p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius-lg)] bg-primary/10 ring-1 ring-primary/20">
                {mode === "send" ? (
                  <Send className="w-5 h-5 text-primary" />
                ) : (
                  <ClipboardIcon className="w-5 h-5 text-primary" />
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {mode === "send" ? "Share Text" : "Received Text"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
            {mode === "send" ? (
              <>
                Sharing snippet with{" "}
                <span className="font-semibold text-foreground">
                  {deviceName}
                </span>
              </>
            ) : (
              <>
                From{" "}
                <span className="font-semibold text-foreground">
                  {deviceName}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Content Section */}
        <div className="px-6 lg:px-8 py-2">
          <div className="relative group">
            {mode === "send" ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    if (text.trim()) {
                      handleSend();
                    }
                  }
                }}
                placeholder="Paste text or link to send immediately"
                className="w-full h-40 p-4 rounded-[var(--radius-lg)] bg-black/5 dark:bg-black/20 border border-white/10 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all resize-none text-sm lg:text-base custom-scrollbar text-foreground"
                autoFocus
              />
            ) : (
              <div className="w-full max-h-60 overflow-y-auto p-4 rounded-[var(--radius-lg)] bg-black/5 dark:bg-black/20 border border-white/10 text-sm lg:text-base custom-scrollbar whitespace-pre-wrap break-words text-foreground">
                {text}
              </div>
            )}

            {mode === "receive" && (
              <button
                onClick={() => handleCopy()}
                className="absolute top-2 right-2 p-2 rounded-[var(--radius-md)] bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-white/10 shadow-sm transition-all"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Actions Section */}
        <div className="p-6 lg:p-8 pt-6 flex gap-3">
          <button
            onClick={() => {
              onClose();
              triggerHaptic("light");
            }}
            className="flex-1 py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-white/10 shadow-sm transition-all active:scale-95"
          >
            {mode === "send" ? "Cancel" : "Dismiss"}
          </button>

          {mode === "send" && (
            <motion.button
              whileHover={{ scale: text.trim() ? 1.02 : 1 }}
              whileTap={{ scale: text.trim() ? 0.95 : 1 }}
              disabled={!text.trim()}
              onClick={() => {
                if (text.trim()) {
                  handleSend();
                  triggerHaptic("medium");
                }
              }}
              className={`relative flex-[2] py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-primary-foreground shadow-lg shadow-primary/25 transition-all overflow-hidden group/btn ${
                !text.trim()
                  ? "opacity-50 cursor-not-allowed bg-muted"
                  : "bg-primary hover:brightness-110"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Send snippet
              </span>
            </motion.button>
          )}

          {mode === "receive" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isContentUrl) {
                  window.open(text, "_blank");
                  onClose();
                } else {
                  handleCopy();
                }
                triggerHaptic("light");
              }}
              className="relative flex-[2] py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-primary-foreground bg-primary hover:brightness-110 shadow-lg shadow-primary/25 transition-all overflow-hidden group/btn"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isContentUrl ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </>
                ) : (
                  <>{copied ? "Copied!" : "Copy snippet"}</>
                )}
              </span>
            </motion.button>
          )}
        </div>

        {/* Recent Snippets History */}
        {mode === "receive" && snippets.length > 0 && (
          <div className="px-6 lg:px-8 pb-8">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <History className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Recent Snippets
              </span>
            </div>
            <div className="space-y-2">
              {snippets.map((snippet) => (
                <motion.div
                  key={snippet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-[var(--radius-lg)] border transition-all cursor-pointer group ${
                    text === snippet.text
                      ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                      : "bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setText(snippet.text);
                    triggerHaptic("light");
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground line-clamp-2 break-all font-mono">
                      {snippet.text}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDistanceToNow(snippet.timestamp, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
