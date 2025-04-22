import { useEffect, useState } from 'react';
import { FileIcon, X } from 'lucide-react';

interface FileTransferModalProps {
  files: Array<{ name: string; size: number; type: string }>;
  onAccept: () => void;
  onDecline: () => void;
}

export function FileTransferModal({ files, onAccept, onDecline }: FileTransferModalProps) {
  const [totalSize, setTotalSize] = useState('0 B');

  useEffect(() => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-96 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Incoming Files</h3>
          <button onClick={onDecline} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Someone wants to share {files.length} file{files.length > 1 ? 's' : ''} with you
          </p>
          
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <FileIcon className="w-5 h-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Total size: {totalSize}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Accept
            </button>
            <button
              onClick={onDecline}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}