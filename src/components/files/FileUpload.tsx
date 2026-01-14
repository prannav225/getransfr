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
    <div className="relative bg-glass-card rounded-[2.5rem] p-4 lg:p-6 transition-all duration-300 h-full flex flex-col group/card overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10 px-2 lg:px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight font-outfit">
            Select Files
          </h2>
        </div>
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {selectedFiles.length} Ready
            </span>
          </div>
        )}
      </div>

      <motion.div
        className={`relative flex flex-col items-center justify-center w-full min-h-[160px] lg:min-h-[240px] rounded-[2rem] border-2 transition-all duration-500 ease-in-out cursor-pointer overflow-hidden ${
          isDragging
            ? "border-primary bg-primary/5 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]"
            : "border-dashed border-border/50 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 0.995 }}
        whileTap={{ scale: 0.98 }}
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
        <input
          type="file"
          multiple
          webkitdirectory="true"
          onChange={onFileSelect}
          className="hidden"
          id="folder-upload"
        />

        {/* Animated Background Content */}
        <div className="flex flex-col items-center justify-center relative z-10 py-12 lg:py-20">
          <motion.div
            animate={isDragging ? { y: -10, scale: 1.1 } : { y: [0, -5, 0] }}
            transition={
              isDragging
                ? { type: "spring", stiffness: 300 }
                : { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }
            className={`p-6 lg:p-8 rounded-[2rem] mb-6 lg:mb-8 ${
              isDragging
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            } shadow-xl shadow-primary/5`}
          >
            <Upload className="w-8 h-8 lg:w-10 lg:h-10" />
          </motion.div>

          <div className="text-center px-6">
            <p className="text-base lg:text-lg font-bold text-foreground mb-1 font-outfit">
              {isDragging ? "Drop to add files" : "Tap or Drop files here"}
            </p>
            <p className="text-sm text-muted-foreground font-medium max-w-[240px] leading-relaxed font-inter">
              Folders and individual files are supported
            </p>
          </div>
        </div>
      </motion.div>

      {/* Selected Files List - Enhanced Preview */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 flex-1 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Current Selection
              </span>
              <button
                onClick={onClearAll}
                className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-primary/5 active:scale-95"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="group relative flex items-center gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border/50 hover:border-border hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
                >
                  <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-background border border-border/50 shadow-sm overflow-hidden">
                    {file.type.startsWith("image/") ? (
                      <div className="absolute inset-0">
                        {/* We could use the global URL, but for simplicity let's stick to icons for now or a small canvas */}
                        <FileTypeIcon
                          mimeType={file.type}
                          className="w-5 h-5 opacity-40"
                        />
                      </div>
                    ) : (
                      <FileTypeIcon
                        mimeType={file.type}
                        className="w-5 h-5 text-primary"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate font-outfit">
                      {file.name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(index);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-200"
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
