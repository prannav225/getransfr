import JSZip from 'jszip';

export async function createZipFile(files: File[]): Promise<Blob> {
  const zip = new JSZip();
  
  for (const file of files) {
    zip.file(file.name, file);
  }
  
  return await zip.generateAsync({ type: "blob" });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}