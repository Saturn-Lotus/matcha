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
    return path.posix.join(destination, fileName);
  }

  async uploadFile(file: File, destination: string): Promise<string> {
    const objectKey = this.buildObjectKey(destination);
    const pathName = path.posix.join(this.bucket, objectKey);
    const blob = await put(pathName, file, {
      access: 'public',
    });

    return blob.url;
  }

  async bulkUploadFiles(files: File[], destination: string): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, destination),
    );
    return Promise.all(uploadPromises);
  }

  async deleteFile(urlOrPathname: string): Promise<void> {
    await del(urlOrPathname);
  }

  async getFileUrl(urlOrPathname: string): Promise<string> {
    if (/^https?:\/\//i.test(urlOrPathname)) return urlOrPathname;
    const blobMetadata = await head(urlOrPathname);
    return blobMetadata.url;
  }

  async getFile(
    urlOrPathname: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const blobMetadata = await head(urlOrPathname);
    const res = await fetch(blobMetadata.downloadUrl);
    if (!res.ok) {
      throw Error(`failed to download blob ${urlOrPathname}`);
    }
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      contentType: blobMetadata.contentType,
    };
  }
}
