import path from 'node:path';
import { IStorage } from './base';
import { put, del, head } from '@vercel/blob';

export class VercelBlobStorage implements IStorage {
  private readonly bucket;

  constructor(bucketName: string) {
    this.bucket = bucketName;
  }

  private buildObjectKey(destination: string): string {
    const fileName = crypto.randomUUID();
    const fullPath = path.posix.join(destination, fileName);
    return fullPath;
  }

  async uploadFile(file: File, destination: string): Promise<string> {
    const objectKey = this.buildObjectKey(destination);
    const pathName = path.posix.join(this.bucket, objectKey);
    const blob = await put(pathName, file, {
      access: 'public',
    });

    return blob.pathname;
  }

  async bulkUploadFiles(files: File[], destination: string): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, destination),
    );
    return Promise.all(uploadPromises);
  }
  async deleteFile(filePath: string): Promise<void> {
    await del(filePath);
  }

  async getFileUrl(filePath: string): Promise<string> {
    const blobMetadata = await head(filePath);
    return blobMetadata.url;
  }

  async getFile(filePath: string): Promise<Buffer> {
    const blobMetadata = await head(filePath);
    const res = await fetch(blobMetadata.downloadUrl);
    if (!res.ok) {
      throw Error(`failed to download blob ${filePath}`);
    }
    const fileBuffer = await res.arrayBuffer();

    return Buffer.from(fileBuffer);
  }
}
