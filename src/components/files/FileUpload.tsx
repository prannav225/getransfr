import { PlusCircle, FileText, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface FileUploadProps {
  selectedFiles: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
  onClearAll: () => void;
  isLoading?: boolean;
}

// --- File System Access API Types (Standard / Chrome) ---
interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
}

interface FileSystemFileEntry extends FileSystemEntry {
  isFile: true;
  isDirectory: false;
  file: (callback: (file: File) => void) => void;
}

interface FileSystemDirectoryReader {
  readEntries: (successCallback: (entries: FileSystemEntry[]) => void) => void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  isFile: false;
  isDirectory: true;
  createReader: () => FileSystemDirectoryReader;
}

export function FileUpload({
  selectedFiles,
  onFileSelect,
  onClearAll,
  isLoading = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading && !isDropping) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.items) {
      setIsDropping(true);
      try {
        const files: File[] = [];
        const items = Array.from(e.dataTransfer.items);

        const traverseFileTree = async (item: FileSystemEntry, path = "") => {
          if (item.isFile) {
            const fileEntry = item as FileSystemFileEntry;
            const file = await new Promise<File>((resolve) =>
              fileEntry.file(resolve)
            );
            Object.defineProperty(file, "webkitRelativePath", {
              value: path + file.name,
            });
            files.push(file);
          } else if (item.isDirectory) {
            const dirEntry = item as FileSystemDirectoryEntry;
            const dirReader = dirEntry.createReader();
            const entries = await new Promise<FileSystemEntry[]>((resolve) => {
              dirReader.readEntries(resolve);
            });
            for (const entry of entries) {
              await traverseFileTree(entry, path + item.name + "/");
            }
          }
        };

        for (const item of items) {
          const entry = item.webkitGetAsEntry() as FileSystemEntry | null;
          if (entry) {
            await traverseFileTree(entry);
          }
        }

        if (files.length > 0) {
          if ("vibrate" in navigator) navigator.vibrate(25);
          const event = {
            target: {
              files: Object.assign([], files),
            },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onFileSelect(event);
        }
      } finally {
        setIsDropping(false);
      }
    }
  };

  const isBusy = isLoading || isDropping;
  const hasFiles = selectedFiles.length > 0;
  const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
  const formattedSize = (totalSize / 1024 / 1024).toFixed(2) + " MB";

  return (
    <motion.div
      className={`relative flex items-center justify-between w-full rounded-[22px] border p-5 transition-all duration-300 ease-in-out shadow-sm ${
        isBusy
          ? "border-primary/60 bg-primary/5 cursor-wait"
          : isDragging
          ? "border-primary bg-primary/5 cursor-pointer"
          : hasFiles
          ? "border-primary bg-card cursor-pointer"
          : "border-border/40 bg-card hover:border-primary/40 cursor-pointer"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileTap={isBusy ? undefined : { scale: 0.98 }}
      onClick={() => {
        if (!isBusy) {
          document.getElementById("file-upload")?.click();
        }
      }}
    >
      <input
        type="file"
        multiple
        disabled={isBusy}
        onChange={onFileSelect}
        className="hidden"
        id="file-upload"
        accept="*/*"
      />

      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl ${
            isBusy
              ? "bg-primary/15 text-primary"
              : hasFiles
              ? "bg-primary/10 text-primary"
              : "bg-muted/50 text-muted-foreground"
          }`}
        >
          {isBusy ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : hasFiles ? (
            <FileText className="w-6 h-6" />
          ) : (
            <PlusCircle className="w-6 h-6" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <p className="text-[16px] font-bold text-foreground truncate flex items-center gap-2">
            <span>
              {isBusy
                ? "Processing Large File(s)..."
                : hasFiles
                ? `${selectedFiles.length} File(s) Selected`
                : "Select Files to Send"}
            </span>
            {isBusy && (
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
            )}
          </p>
          <p className="text-[12px] text-muted-foreground truncate">
            {isBusy
              ? "Reading & preparing file metadata, please wait..."
              : hasFiles
              ? formattedSize
              : "Tap to choose photos, videos, or files"}
          </p>
        </div>
      </div>

      {hasFiles && !isBusy && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  );
}

