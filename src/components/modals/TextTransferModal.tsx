import { useState } from 'react';
import { X, Clipboard as ClipboardIcon, Send, Check, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSound } from '@/hooks/useSound';

interface TextTransferModalProps {
  mode: 'send' | 'receive';
  deviceName: string;
  initialText?: string;
  onAction: (text?: string) => void;
  onClose: () => void;
}

export function TextTransferModal({ mode, deviceName, initialText = '', onAction, onClose }: TextTransferModalProps) {
  const { playSound } = useSound();
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      // Fallback for non-secure contexts (HTTP)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // Avoid scrolling
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } else {
            throw new Error('Fallback failed');
        }
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr);
        toast.error('Failed to copy. Please copy manually.');
      }
    }
  };

  const handleSend = () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
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
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md overflow-hidden bg-glass-card rounded-[var(--radius-xl)] text-card-foreground shadow-2xl"
      >
        {/* Header Section */}
        <div className="relative p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius-lg)] bg-primary/10 ring-1 ring-primary/20">
                {mode === 'send' ? (
                  <Send className="w-5 h-5 text-primary" />
                ) : (
                  <ClipboardIcon className="w-5 h-5 text-primary" />
                )}
              </div>
              <h3 className="text-[var(--text-xl)] font-bold tracking-tight">
                {mode === 'send' ? 'Share Text' : 'Received Text'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <p className="text-[var(--text-sm)] lg:text-[var(--text-base)] text-muted-foreground leading-relaxed">
            {mode === 'send' ? (
              <>Sharing snippet with <span className="font-semibold text-foreground">{deviceName}</span></>
            ) : (
              <>Incoming snippet from <span className="font-semibold text-foreground">{deviceName}</span></>
            )}
          </p>
        </div>

        {/* Content Section */}
        <div className="px-6 lg:px-8 py-2">
          <div className="relative group">
            {mode === 'send' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text here..."
                className="w-full h-40 p-4 rounded-[var(--radius-lg)] bg-black/5 dark:bg-black/20 border border-white/10 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all resize-none text-[var(--text-sm)] lg:text-[var(--text-base)] custom-scrollbar text-foreground"
                autoFocus
              />
            ) : (
              <div className="w-full max-h-60 overflow-y-auto p-4 rounded-[var(--radius-lg)] bg-black/5 dark:bg-black/20 border border-white/10 text-[var(--text-sm)] lg:text-[var(--text-base)] custom-scrollbar whitespace-pre-wrap break-words text-foreground">
                {text}
              </div>
            )}
            
            {mode === 'receive' && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 rounded-[var(--radius-md)] bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-white/10 shadow-sm transition-all"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Actions Section */}
        <div className="p-6 lg:p-8 pt-6 flex gap-3">
          <button
            onClick={() => {
              onClose();
              playSound('tap');
            }}
            className="flex-1 py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-white/10 shadow-sm transition-all active:scale-95"
          >
            {mode === 'send' ? 'Cancel' : 'Dismiss'}
          </button>
          
          {mode === 'send' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleSend();
                playSound('tap');
              }}
              className="relative flex-[2] py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-primary-foreground bg-primary hover:brightness-110 shadow-lg shadow-primary/25 transition-all overflow-hidden group/btn"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Send snippet
              </span>
            </motion.button>
          )}
          
          {mode === 'receive' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleCopy();
                playSound('tap');
              }}
              className="relative flex-[2] py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-primary-foreground bg-primary hover:brightness-110 shadow-lg shadow-primary/25 transition-all overflow-hidden group/btn"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {copied ? 'Copied!' : 'Copy snippet'}
              </span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
