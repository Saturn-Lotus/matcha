import { IStorage, MinioStorage, VercelBlobStorage } from '@/server/storage';

export const getStorage = async (storage?: string): Promise<IStorage> => {
  const storageType = storage || process.env.STORAGE_TYPE || 'local';
  const bucketName = process.env.STORAGE_BUCKET_NAME || 'matcha';
  switch (storageType) {
    case 'minio':
      return await MinioStorage.create(bucketName);
    case 'vercel-blob':
      return new VercelBlobStorage(bucketName);
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
};
