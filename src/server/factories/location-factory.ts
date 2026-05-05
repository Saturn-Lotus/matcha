import { LocationRepository } from '@/server/repositories/location-repository';
import { LocationService } from '@/server/services/location';
import { getPostgresDB } from './db-factory';

export const getLocationRepository = (): LocationRepository => {
  return new LocationRepository(getPostgresDB());
};

export const getLocationService = (): LocationService => {
  return new LocationService(getLocationRepository());
};
