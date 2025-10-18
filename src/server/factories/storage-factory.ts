import { IStorage, MinioStorage } from '@/server/storage';

export const getStorage = async (storage?: string): Promise<IStorage> => {
  const storageType = storage || process.env.STORAGE_TYPE || 'local';
  const bucketName = process.env.STORAGE_BUCKET_NAME || 'matcha';
  switch (storageType) {
    case 'minio':
      return await MinioStorage.create(bucketName);
    case 'local':
      throw new Error('Local storage not implemented yet');
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
};
