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
  createWritable(): Promise<unknown>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
}
