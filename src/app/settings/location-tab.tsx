'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AlertCircle, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { UserLocation } from '@/server/schemas/location';
import { cn } from '@/lib/utils';

const CASABLANCA_COORDS = { lat: 33.5731, lng: -7.5898 };
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const DEFAULT_CENTER = CASABLANCA_COORDS;
const MAP_CONTAINER_STYLE = { width: '100%', height: '300px' };

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string;
  neighborhood: string;
  locationType: 'gps' | 'manual';
  consentGiven: boolean;
}

interface MapPreviewProps {
  center: { lat: number; lng: number };
  zoom: number;
  markerPosition: { lat: number; lng: number } | null;
  draggable: boolean;
  onDragEnd: (e: google.maps.MapMouseEvent) => void;
}

function MapPreview({ center, zoom, markerPosition, draggable, onDragEnd }: MapPreviewProps) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_API_KEY });

  if (!isLoaded) return null;

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={zoom}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      {markerPosition && (
        <Marker position={markerPosition} draggable={draggable} onDragEnd={onDragEnd} />
      )}
    </GoogleMap>
  );
}

interface LocationTabProps {
  userId: string;
  location: LocationState;
  onChange: (location: LocationState) => void;
}

export function LocationTab({ userId, location, onChange }: LocationTabProps) {
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    apiClient
      .get<UserLocation | null>('/users/location')
      .then((data) => {
        if (data) {
          onChangeRef.current({
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city ?? '',
            neighborhood: data.neighborhood ?? '',
            locationType: data.locationType,
            consentGiven: data.consentGiven,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const set = (patch: Partial<LocationState>) => onChange({ ...location, ...patch });

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        set({ latitude: lat, longitude: lon, locationType: 'gps', consentGiven: true });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'Accept-Language': 'en,fr,ar' } },
          );
          const geo = await res.json();
          const addr = geo.address ?? {};
          set({
            latitude: lat,
            longitude: lon,
            locationType: 'gps',
            consentGiven: true,
            city: addr.city || addr.town || addr.village || '',
            neighborhood: addr.neighbourhood || addr.suburb || '',
          });
        } catch {
          toast.warning('Could not reverse geocode your location. Coordinates have been saved, but city and neighborhood are unavailable.');
        }

        setLocating(false);
      },
      () => {
        toast.error('Could not get your location. Please enter it manually.');
        setLocating(false);
      },
    );
  };

  const handleMarkerDrag = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      set({ latitude: e.latLng.lat(), longitude: e.latLng.lng() });
    }
  };

  const mapCenter =
    location.latitude !== null && location.longitude !== null
      ? { lat: location.latitude, lng: location.longitude }
      : DEFAULT_CENTER;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={location.consentGiven}
          onChange={(e) => set({ consentGiven: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-gray-300 accent-pink-500"
        />
        <span className="text-sm text-gray-600">
          I consent to sharing my location to enable nearby matching features. Your exact
          coordinates are never shown to other users.
        </span>
      </label>

      {!location.consentGiven && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Location sharing is required for matching. You can provide your city manually if you
            prefer not to use GPS.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Location method</Label>
        <div className="flex gap-3">
          {(['gps', 'manual'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set({ locationType: type })}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors',
                location.locationType === type
                  ? 'bg-pink-50 border-pink-300 text-pink-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {type === 'gps' ? 'GPS (Automatic)' : 'Manual'}
            </button>
          ))}
        </div>
      </div>

      {location.locationType === 'gps' && (
        <Button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          variant="outline"
          className="w-full border-pink-200 text-pink-600 hover:bg-pink-50"
        >
          <Navigation className="w-4 h-4 mr-2" />
          {locating ? 'Getting location…' : 'Locate Me'}
        </Button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={location.city}
            onChange={(e) => set({ city: e.target.value })}
            placeholder="e.g. Paris"
            disabled={location.locationType === 'gps'}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input
            id="neighborhood"
            value={location.neighborhood}
            onChange={(e) => set({ neighborhood: e.target.value })}
            placeholder="e.g. Montmartre"
            disabled={location.locationType === 'gps'}
          />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden">
        {MAPS_API_KEY ? (
          <MapPreview
            center={mapCenter}
            zoom={location.latitude !== null ? 13 : 4}
            markerPosition={
              location.latitude !== null && location.longitude !== null
                ? { lat: location.latitude, lng: location.longitude }
                : null
            }
            draggable={location.locationType === 'manual'}
            onDragEnd={handleMarkerDrag}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 text-gray-400">
            <MapPin className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Map unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
}
