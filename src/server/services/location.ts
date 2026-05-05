import { HTTPError } from '@/lib/exception-http-mapper';
import { LocationRepository, UpsertLocationInput } from '@/server/repositories/location-repository';
import { UserLocation } from '@/server/schemas/location';

@HTTPError(400)
export class LocationConsentError extends Error {
  constructor(message = 'Location consent is required to use matching features') {
    super(message);
    this.name = 'LocationConsentError';
  }
}

export class LocationService {
  private readonly locationRepository: LocationRepository;

  constructor(locationRepository: LocationRepository) {
    this.locationRepository = locationRepository;
  }

  getLocation = async (userId: string): Promise<UserLocation | null> => {
    return this.locationRepository.findByUserId(userId);
  };

  setLocation = async (userId: string, data: UpsertLocationInput): Promise<UserLocation> => {
    if (!data.consentGiven) {
      throw new LocationConsentError();
    }
    return this.locationRepository.upsert(userId, data);
  };
}
