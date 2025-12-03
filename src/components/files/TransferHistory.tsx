import { useState, useEffect } from 'react';
import { FileTypeIcon } from './FileTypeIcon';
import { formatDistanceToNow } from 'date-fns';

interface TransferRecord {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  timestamp: Date;
  type: 'sent' | 'received';
  deviceName: string;
}

export function TransferHistory() {
  const [history, setHistory] = useState<TransferRecord[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('transferHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).map((record: TransferRecord) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      })));
    }
  }, []);

  return (
    <div className="bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm rounded-2xl shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5 p-6 text-dropmate-text-primary dark:text-dropmate-text-primary-dark">
      <h3 className="text-lg font-medium mb-4">Transfer History</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {history.map(record => (
          <div key={record.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
            <FileTypeIcon mimeType={record.fileType} className="w-8 h-8" />
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{record.fileName}</p>
              <p className="text-xs text-gray-500">
                {record.type === 'sent' ? 'Sent to' : 'Received from'} {record.deviceName} • {formatDistanceToNow(record.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}