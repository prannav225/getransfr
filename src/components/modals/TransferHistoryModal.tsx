import { X, History, Trash2, Download, FileText } from "lucide-react";
import { FileTypeIcon } from "@/components/files/FileTypeIcon";
import toast from "react-hot-toast";

export interface TransferHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  peerName: string;
  isSent: boolean;
  timestamp: number;
  mimeType?: string;
  downloadUrl?: string;
}

interface TransferHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TransferHistoryItem[];
  onClearHistory: () => void;
}

export function TransferHistoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory,
}: TransferHistoryModalProps) {
  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Transfer History</h2>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  onClearHistory();
                  toast.success("Transfer history cleared");
                }}
                className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-3">
              <div className="p-4 rounded-full bg-secondary border border-border/30 text-muted-foreground">
                <FileText className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Transfer History</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Your sent and received files will appear here automatically.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/50 border border-border/30 hover:border-border/60 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-card border border-border/40 shrink-0">
                    <FileTypeIcon mimeType={item.mimeType || "application/octet-stream"} className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {item.fileName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                      <span className={item.isSent ? "text-primary" : "text-emerald-500"}>
                        {item.isSent ? "Sent to" : "Received from"} {item.peerName}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(item.fileSize)}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                </div>

                {item.downloadUrl && (
                  <a
                    href={item.downloadUrl}
                    download={item.fileName}
                    className="p-2 rounded-xl bg-card border border-border/40 text-muted-foreground hover:text-primary transition-all shrink-0 ml-2"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
