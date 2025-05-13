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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  
    if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      const validFiles = fileList.filter(file => file.size > 0);
      
      if(validFiles.length > 0) {
        const event = {
          target: {
            files: Object.assign([], validFiles) // Convert validFiles array to FileList-like object
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileSelect(event);
      }
    }
  }

  return (
    <div className="bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm rounded-2xl shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-5 h-5 text-dropmate-primary dark:text-dropmate-primary-dark" />
        <h2 className="text-xl font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark">Share Files</h2>
      </div>

      <div
        className={`border-2 border-dashed transition-all duration-300 ${
          isDragging 
            ? 'border-dropmate-primary dark:border-dropmate-primary-dark bg-dropmate-primary/5 dark:bg-dropmate-primary-dark/5 scale-102' 
            : 'border-dropmate-primary/20 dark:border-dropmate-primary-dark/20'
        } rounded-xl p-8 text-center`}
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
        <label
          htmlFor="file-upload"
          className="cursor-pointer block"
        >
          <div className="mb-3">
            <Upload className="w-10 h-10 text-dropmate-primary/40 dark:text-dropmate-primary-dark/40 mx-auto" />
          </div>
          <p className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70 mb-1">
            {isDragging ? 'Drop files here' : 'Drop files here or click to select'}
          </p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-4">
          {previewUrl && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
            </div>
          )}
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-3 py-2">
                <FileTypeIcon mimeType={file.type} className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => onFileRemove(index)}
                  className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}