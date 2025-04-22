import { Upload } from 'lucide-react';

interface FileUploadProps {
  selectedFiles: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUpload({ selectedFiles, onFileSelect }: FileUploadProps) {
  return (
    <div className="bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm rounded-2xl shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-5 h-5 text-dropmate-primary dark:text-dropmate-primary-dark" />
        <h2 className="text-xl font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark">Share Files</h2>
      </div>

      <div className="border-2 border-dashed border-dropmate-primary/20 dark:border-dropmate-primary-dark/20 rounded-xl p-8 text-center hover:border-dropmate-primary/40 dark:hover:border-dropmate-primary-dark/40 transition-colors">
        <input
          type="file"
          multiple
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer block"
        >
          <div className="mb-3">
            <Upload className="w-10 h-10 text-dropmate-primary/40 dark:text-dropmate-primary-dark/40 mx-auto" />
          </div>
          <p className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70 mb-1">
            Drop files here or click to select
          </p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 bg-black/5 dark:bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark mb-3">
            Selected Files ({selectedFiles.length})
          </h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <li key={index} className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-dropmate-primary/40 dark:bg-dropmate-primary-dark/40 rounded-full" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-xs">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}