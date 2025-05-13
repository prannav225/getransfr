import { File, FileImage, FileText, FileVideo, FileMusic, FileArchive } from 'lucide-react';

interface FileTypeIconProps {
  mimeType: string;
  className?: string;
}

export function FileTypeIcon({ mimeType, className = "w-4 h-4" }: FileTypeIconProps) {
  if (mimeType.startsWith('image/')) return <FileImage className={className} />;
  if (mimeType.startsWith('video/')) return <FileVideo className={className} />;
  if (mimeType.startsWith('audio/')) return <FileMusic className={className} />;
  if (mimeType.startsWith('text/')) return <FileText className={className} />;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className={className} />;
  return <File className={className} />;
}