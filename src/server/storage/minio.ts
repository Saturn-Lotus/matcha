import path from 'node:path';
import { IStorage } from './base';

import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
});

export class MinioStorage implements IStorage {
  private readonly client = minioClient;
  private readonly bucket;

  private constructor(bucketName: string) {
    this.bucket = bucketName;
  }

  static async create(bucketName: string) {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket '${bucketName}' created in "us-east-1".`);
    }
    return new MinioStorage(bucketName);
  }

  private buildObjectKey(destination: string): string {
    const fileName = crypto.randomUUID();
    const fullPath = path.posix.join(destination, fileName);
    return fullPath;
  }

  private buildObjectMetadata(file: File): Minio.ItemBucketMetadata {
    return { 'Content-Type': file.type, 'original-name': file.name };
  }

  async uploadFile(file: File, destination: string): Promise<string> {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileSize = file.size;
    const objectKey = this.buildObjectKey(destination);
    const metadata = this.buildObjectMetadata(file);

    await this.client.putObject(
      this.bucket,
      objectKey,
      fileBuffer,
      fileSize,
      metadata,
    );
    return objectKey;
  }

  async bulkUploadFiles(files: File[], destination: string): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, destination),
    );
    return Promise.all(uploadPromises);
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.client.removeObject(this.bucket, filePath);
  }

  async getFileUrl(filePath: string): Promise<string> {
    const url = await this.client.presignedGetObject(
      this.bucket,
      filePath,
      24 * 60 * 60,
    );
    return url;
  }

  async getFile(filePath: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, filePath);
    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
