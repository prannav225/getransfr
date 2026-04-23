import { Upload, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { FileTypeIcon } from "./FileTypeIcon";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  selectedFiles: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
  onClearAll: () => void;
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
  onFileRemove,
  onClearAll,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    // ... traverse logic ...
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.items) {
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
    }
  };

  return (
    <div className="relative p-5 lg:p-8 h-full flex flex-col group/card">
      <div className="flex items-center justify-between mb-6 relative z-10 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold tracking-tight font-outfit uppercase">
            Select Files
          </h2>
        </div>
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {selectedFiles.length} Ready
            </span>
          </div>
        )}
      </div>

      <motion.div
        className={`relative flex flex-col items-center justify-center w-full min-h-[140px] lg:min-h-[220px] rounded-2xl border transition-all duration-300 ease-in-out cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
            : "border-border/10 bg-muted/20 hover:bg-muted/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileTap={{ scale: 0.99 }}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          type="file"
          multiple
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
          accept="*/*"
        />

        <div className="flex flex-col items-center justify-center relative z-10 py-8 lg:py-16">
          <motion.div
            animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0 }}
            className={`p-5 rounded-2xl mb-4 ${
              isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            }`}
          >
            <Upload className="w-8 h-8 lg:w-9 lg:h-9" />
          </motion.div>

          <div className="text-center px-6">
            <p className="text-base font-bold text-foreground mb-1 font-outfit">
              {isDragging ? "Drop to add files" : "Tap or Drop files here"}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest leading-relaxed">
              Folders and files supported
            </p>
          </div>
        </div>
      </motion.div>

      {/* Selected Files List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 flex-1 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Selection
              </span>
              <button
                onClick={onClearAll}
                className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                Clear All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  className="group relative flex items-center gap-3 p-3 rounded-xl bg-background border border-border/5 hover:bg-muted/30 transition-all duration-200"
                >
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-card border border-border/5">
                    <FileTypeIcon
                      mimeType={file.type}
                      className="w-5 h-5 text-primary"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate font-outfit">
                      {file.name}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(index);
                    }}
                    className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
