import { Storage } from './Storage';

export class LocalStorage extends Storage {
  async getFile(path: string) {
    // Implementation for local file retrieval
  }

  async saveFile(path: string, data: Buffer) {
    // Implementation for local file saving
  }

  async deleteFile(path: string) {
    // Implementation for local file deletion
  }
}
