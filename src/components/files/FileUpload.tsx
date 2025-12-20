import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FileTypeIcon } from './FileTypeIcon';

interface FileUploadProps {
  selectedFiles: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
}

export function FileUpload({ selectedFiles, onFileSelect, onFileRemove }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (selectedFiles.length > 0 && selectedFiles[0].type.startsWith('image/')) {
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

      const traverseFileTree = async (item: any, path = '') => {
        if (item.isFile) {
          const file = await new Promise<File>((resolve) => item.file(resolve));
          // Manually define webkitRelativePath for the file because the File object from entry.file() doesn't have it
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path + file.name
          });
          files.push(file);
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          const entries = await new Promise<any[]>((resolve) => {
            dirReader.readEntries(resolve);
          });
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + '/');
          }
        }
      };

      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await traverseFileTree(entry);
        }
      }

      if (files.length > 0) {
        const event = {
          target: {
            files: Object.assign([], files)
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileSelect(event);
      }
    } else if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      const validFiles = fileList.filter(file => file.size > 0);

      if (validFiles.length > 0) {
        const event = {
          target: {
            files: Object.assign([], validFiles)
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileSelect(event);
      }
    }
  }

  return (
    <div className="relative overflow-hidden backdrop-blur-2xl bg-glass-card border border-white/20 dark:border-white/10 rounded-2xl lg:rounded-3xl shadow-soft dark:shadow-soft-dark p-4 lg:p-8 transition-all duration-300 h-full flex flex-col group/card hover:shadow-glow dark:hover:shadow-glow-dark">
      <div className="hidden lg:flex items-center gap-3 mb-8 relative z-10">
        <div className="p-2.5 rounded-full bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Share Files</h2>
      </div>

      <div
        className={`relative flex flex-col items-center justify-center w-full h-full min-h-[140px] lg:min-h-[300px] p-4 lg:p-8 rounded-xl lg:rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer group hover:bg-glass-card-hover overflow-hidden backdrop-blur-md ${
          isDragging 
          ? 'border-primary bg-primary/10 scale-[1.02] shadow-[0_0_30px_rgba(var(--primary),0.2)]' 
          : 'border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 shadow-inner'
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
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className={`mb-3 lg:mb-6 p-4 lg:p-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 transition-all duration-500 shadow-inner-light dark:shadow-inner-dark ${!isDragging && 'animate-breathe'}`}>
            <Upload className="w-8 h-8 lg:w-12 lg:h-12 text-primary drop-shadow-sm" />
          </div>
          <p className="text-base lg:text-lg font-medium text-foreground mb-1 lg:mb-2 text-center px-4">
            {isDragging ? 'Drop folders or files here' : 'Drop folders or files here'}
          </p>
          <div className="text-xs lg:text-sm text-muted-foreground hidden lg:flex items-center gap-1">
            <span>or click to</span>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}
              className="text-primary hover:underline font-semibold"
            >
              browse files
            </button>
            <span>or</span>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); document.getElementById('folder-upload')?.click(); }}
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
            <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10 dark:ring-white/5">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover transition-transform duration-700 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <div className="bg-card/50 backdrop-blur-md rounded-2xl p-4 border border-white/10 dark:border-white/5 shadow-sm">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-4 py-3 first:pt-1 last:pb-1">
                <div className="p-2.5 rounded-xl bg-background/80 shadow-sm border border-border/50">
                  <FileTypeIcon mimeType={file.type} className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
  )
}