export interface IStorage {
  uploadFile(file: File, destination: string): Promise<string>;
  bulkUploadFiles(files: File[], destination: string): Promise<string[]>;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(filePath: string): Promise<string>;
  getFile(filePath: string): Promise<Buffer>;
}
