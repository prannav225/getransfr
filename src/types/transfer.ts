export interface FileProgress {
  onProgress: (progress: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  getFile(): Promise<File>;
  createWritable(options?: {
    keepExistingData?: boolean;
  }): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemDirectoryHandle>;
  getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemFileHandle>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: Uint8Array | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}
