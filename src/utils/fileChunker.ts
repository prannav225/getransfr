/* eslint-disable @typescript-eslint/no-unused-vars */
const CHUNK_SIZE = 16384; // 16KB chunks

export class FileChunker {
  static async* createChunks(file: File) {
    let offset = 0;
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      offset += CHUNK_SIZE;
      yield chunk;
    }
  }

  static async assembleChunks(chunks: Blob[], totalSize: number): Promise<Blob> {
    return new Blob(chunks, { type: 'application/octet-stream' });
  }
}