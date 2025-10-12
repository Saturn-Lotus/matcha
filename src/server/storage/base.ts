export interface IStorage {
  uploadFile(file: File, path: string): Promise<string>;
  bulkUploadFiles(files: File[], path: string): Promise<string[]>;
  deleteFile(path: string): Promise<void>;
  getFileUrl(path: string): Promise<string>;
  getFile(path: string): Promise<Buffer>;
}
