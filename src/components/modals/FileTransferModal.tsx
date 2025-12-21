import { useEffect, useState } from 'react';
import { X, Share2, ShieldCheck, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileTypeIcon } from '../files/FileTypeIcon';
import { useSound } from '@/hooks/useSound';

interface FileTransferModalProps {
  files: Array<{ name: string; size: number; type: string }>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FileTransferModal({ files, onConfirm, onCancel }: FileTransferModalProps) {
  const { playSound } = useSound();
  const [totalSize, setTotalSize] = useState('0 B');

  useEffect(() => {
    console.log('[FileTransferModal] Component mounted');
    const size = files.reduce((acc, file) => acc + file.size, 0);
    setTotalSize(formatSize(size));
  }, [files]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => {
            console.log('[FileTransferModal] Backdrop clicked');
            onCancel();
        }}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md overflow-hidden bg-glass-card rounded-[var(--radius-xl)] shadow-2xl text-card-foreground"
      >
        {/* Header Section */}
        <div className="relative p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius-lg)] bg-primary/10 ring-1 ring-primary/20">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[var(--text-xl)] font-bold tracking-tight">Incoming Transfer</h3>
            </div>
            <button
              onClick={() => {
                console.log('[FileTransferModal] X button clicked');
                onCancel();
              }}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <p className="text-[var(--text-sm)] lg:text-[var(--text-base)] text-muted-foreground leading-relaxed">
            Nearby device wants to share <span className="font-semibold text-foreground">{files.length} file{files.length > 1 ? 's' : ''}</span> with you.
          </p>
        </div>

        {/* File List Section */}
        <div className="px-6 lg:px-8 py-2">
          <div className="bg-black/5 dark:bg-black/20 rounded-[var(--radius-xl)] border border-white/10 overflow-hidden">
            <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {files.map((file, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="p-2 rounded-[var(--radius-md)] bg-background shadow-sm border border-border/50 group-hover:scale-105 transition-transform flex-none">
                    <FileTypeIcon mimeType={file.type} className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground opacity-70">
                      {formatSize(file.size)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Summary Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-t border-white/10">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary/70">
                <HardDrive className="w-3.5 h-3.5" />
                Total Payload
              </div>
              <span className="text-sm font-bold text-primary">{totalSize}</span>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div className="px-6 lg:px-8 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
              Secure Peer-to-Peer Encrypted Connection
            </span>
          </div>
        </div>

        {/* Actions Section */}
        <div className="p-6 lg:p-8 pt-6 flex gap-3">
          <button
            onClick={() => {
              console.log('[FileTransferModal] Decline button clicked');
              onCancel();
              playSound('tap');
            }}
            className="flex-1 py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-white/10 shadow-sm transition-all active:scale-95"
          >
            Decline
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              console.log('[FileTransferModal] Accept button clicked');
              onConfirm();
              playSound('tap');
            }}
            className="relative flex-[2] py-3.5 rounded-[var(--radius-lg)] font-bold text-sm text-primary-foreground bg-primary hover:brightness-110 shadow-lg shadow-primary/25 transition-all overflow-hidden group/btn"
          >
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" 
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Accept Transfer
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}