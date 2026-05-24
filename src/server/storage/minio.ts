import path from 'node:path';
import { IStorage } from './base';

import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
});

const buildPublicBaseUrl = (): string => {
  if (process.env.MINIO_PUBLIC_URL) {
    return process.env.MINIO_PUBLIC_URL.replace(/\/+$/, '');
  }
  // MINIO_ENDPOINT (e.g. "minio") is the in-container service name and is not
  // reachable from the browser. MINIO_PUBLIC_HOST must be set explicitly when
  // MINIO_ENDPOINT differs from the host the browser uses.
  const scheme = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const host = process.env.MINIO_PUBLIC_HOST || 'localhost';
  const port =
    process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || '9000';
  return `${scheme}://${host}:${port}`;
};

const buildPublicReadPolicy = (bucket: string) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });

export class MinioStorage implements IStorage {
  private readonly client = minioClient;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly publicBucketPrefix: string;

  private constructor(bucketName: string, publicBaseUrl: string) {
    this.bucket = bucketName;
    this.publicBaseUrl = publicBaseUrl;
    this.publicBucketPrefix = `${publicBaseUrl}/${bucketName}/`;
  }

  static async create(bucketName: string) {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket '${bucketName}' created in "us-east-1".`);
    }
    await minioClient.setBucketPolicy(
      bucketName,
      buildPublicReadPolicy(bucketName),
    );
    return new MinioStorage(bucketName, buildPublicBaseUrl());
  }

  private buildObjectKey(destination: string): string {
    const fileName = crypto.randomUUID();
    return path.posix.join(destination, fileName);
  }

  private buildObjectMetadata(file: File): Minio.ItemBucketMetadata {
    return { 'Content-Type': file.type, 'original-name': file.name };
  }

  private buildPublicUrl(objectKey: string): string {
    return `${this.publicBucketPrefix}${objectKey}`;
  }

  private extractObjectKey(urlOrKey: string): string {
    if (urlOrKey.startsWith(this.publicBucketPrefix)) {
      return urlOrKey.slice(this.publicBucketPrefix.length);
    }
    return urlOrKey;
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
    return this.buildPublicUrl(objectKey);
  }

  async bulkUploadFiles(files: File[], destination: string): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, destination),
    );
    return Promise.all(uploadPromises);
  }

  async deleteFile(urlOrKey: string): Promise<void> {
    await this.client.removeObject(
      this.bucket,
      this.extractObjectKey(urlOrKey),
    );
  }

  async getFileUrl(urlOrKey: string): Promise<string> {
    if (urlOrKey.startsWith(this.publicBaseUrl)) return urlOrKey;
    return this.buildPublicUrl(this.extractObjectKey(urlOrKey));
  }

  async getFile(
    urlOrKey: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const objectKey = this.extractObjectKey(urlOrKey);
    const [stat, stream] = await Promise.all([
      this.client.statObject(this.bucket, objectKey),
      this.client.getObject(this.bucket, objectKey),
    ]);
    const contentType =
      stat.metaData?.['content-type'] ?? 'application/octet-stream';
    const chunks: Buffer[] = [];
    return new Promise<{ buffer: Buffer; contentType: string }>(
      (resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () =>
          resolve({ buffer: Buffer.concat(chunks), contentType }),
        );
        stream.on('error', reject);
      },
    );
  }
}
