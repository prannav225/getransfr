export interface FileProgress {
  onProgress: (progress: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}
