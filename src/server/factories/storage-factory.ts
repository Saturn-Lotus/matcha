import { IStorage } from '../storage/base';

export const getStorage = (storage?: string): IStorage => {
  const storageType = storage || process.env.STORAGE_TYPE || 'local';
  switch (storageType) {
    case 'azure':
      // return new AzureBlobStorage(USERS_CONTAINER);
      throw new Error('Azure storage not implemented yet');
    case 'local':
      // return new LocalStorage(USERS_CONTAINER);
      throw new Error('Local storage not implemented yet');
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
  // return new AzureBlobStorage(USERS_CONTAINER);
};
