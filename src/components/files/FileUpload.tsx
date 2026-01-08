import { Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FileTypeIcon } from "./FileTypeIcon";

interface FileUploadProps {
  selectedFiles: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
}

// --- File System Access API Types (Standard / Chrome) ---

interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  filesystem: FileSystem;
}

interface FileSystemFileEntry extends FileSystemEntry {
  isFile: true;
  isDirectory: false;
  file: (
    callback: (file: File) => void,
    errorCallback?: (error: DOMException) => void
  ) => void;
}

interface FileSystemDirectoryReader {
  readEntries: (
    successCallback: (entries: FileSystemEntry[]) => void,
    errorCallback?: (error: DOMException) => void
  ) => void;
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
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (
      selectedFiles.length > 0 &&
      selectedFiles[0].type.startsWith("image/")
    ) {
      const cleanup = handlePreview(selectedFiles[0]);
      return cleanup;
    }
  }, [selectedFiles]);

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
          // Manually define webkitRelativePath for the file because the File object from entry.file() doesn't have it
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
    } else if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      const validFiles = fileList.filter((file) => file.size > 0);

      if (validFiles.length > 0) {
        if ("vibrate" in navigator) navigator.vibrate(25);
        const event = {
          target: {
            files: Object.assign([], validFiles),
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileSelect(event);
      }
    }
  };

  return (
    <div className="relative bg-glass-card rounded-[var(--radius-xl)] p-4 lg:p-8 transition-all duration-300 h-full flex flex-col group/card text-card-foreground">
      <div className="hidden lg:flex items-center gap-3 mb-8 relative z-10">
        <div className="p-2.5 rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-[var(--text-xl)] lg:text-[var(--text-2xl)] font-bold tracking-tight">
          Share Files
        </h2>
      </div>

      <div
        className={`relative flex flex-col items-center justify-center w-full h-full min-h-[140px] lg:min-h-[300px] p-4 lg:p-8 rounded-[var(--radius-lg)] lg:rounded-[var(--radius-xl)] border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer group hover:bg-glass-card-hover overflow-hidden backdrop-blur-md ${
          isDragging
            ? "dropzone-active"
            : "border-border bg-black/5 dark:bg-black/20 shadow-inner"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
        <div
          className="cursor-pointer w-full h-full flex flex-col items-center justify-center relative z-20"
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <div
            className={`mb-3 lg:mb-6 p-4 lg:p-6 rounded-full bg-gradient-to-br from-primary/10 to-transparent transition-all duration-500 shadow-inner-light dark:shadow-inner-dark ${
              !isDragging && "animate-pulse-subtle"
            }`}
          >
            <Upload className="w-8 h-8 lg:w-12 lg:h-12 text-primary drop-shadow-sm" />
          </div>
          <p className="text-base lg:text-lg text-device-name mb-1 lg:mb-2 text-center px-4">
            {isDragging
              ? "Drop folders or files here"
              : "Drop folders or files here"}
          </p>
          <div className="text-xs lg:text-sm text-muted-foreground hidden lg:flex items-center gap-1">
            <span>or click to</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("file-upload")?.click();
              }}
              className="text-primary hover:underline font-semibold"
            >
              browse files
            </button>
            <span>or</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("folder-upload")?.click();
              }}
              className="text-primary hover:underline font-semibold"
            >
              upload folder
            </button>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4 relative z-10">
          {previewUrl && (
            <div className="relative rounded-[var(--radius-lg)] overflow-hidden shadow-lg ring-1 ring-border">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <div className="glass-panel rounded-[var(--radius-lg)] p-4 space-y-1 max-h-[30vh] lg:max-h-[40vh] overflow-y-auto custom-scrollbar">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-4 py-3 first:pt-1 last:pb-1"
              >
                <div className="p-2.5 rounded-[var(--radius-md)] bg-background/80 shadow-sm border border-border/50">
                  <FileTypeIcon
                    mimeType={file.type}
                    className="w-6 h-6 text-foreground"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-device-name truncate text-foreground">
                    {file.name}
                  </p>
                  <p className="text-status mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => onFileRemove(index)}
                  className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
