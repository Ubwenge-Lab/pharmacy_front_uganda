// src/services/pharmacies.ts
// Placeholder API service for pharmacy location data
// TODO: Replace mock data with real API calls when backend /api/pharmacies/locations is ready

import { api, unwrapData } from '@/lib/api';
import { ApiResponse } from '@/types';
import { PharmacyLocation } from '@/features/map/pharmacyData';

export interface PharmacyLocationResponse {
  pharmacies: PharmacyLocation[];
  total: number;
}

export interface FetchResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch all pharmacy locations for the map
 * TODO: Uncomment real API call and remove mock return
 */
export async function fetchPharmacyLocations(signal?: AbortSignal): Promise<PharmacyLocation[]> {
  try {
    try {
      const res = await api.get('/pharmacies/locations', { signal });
      const data = unwrapData<PharmacyLocation>(res.data);
      if (data.length > 0) return data;
      if (Array.isArray(res.data?.pharmacies) && res.data.pharmacies.length > 0) return res.data.pharmacies;
    } catch {
      // Fallback for roles without access to /locations (e.g. Branch Managers)
    }

    // Fallback mapping directly to public /pharmacies endpoint
    const res = await api.get('/pharmacies', { signal });
    return res.data.map((p: any) => ({
      id: p.id,
      name: p.name,
      address: p.address || 'No Address',
      latitude: p.latitude,
      longitude: p.longitude,
      phone: p.phone || 'N/A',
      status: p.status === 'APPROVED' ? 'OPEN' : 'CLOSED',
      isActive: true,
      region: p.address ? p.address.split(',').pop()?.trim() : 'Unknown',
      hours: p.operatingHours ? 'Various' : '08:00 - 20:00',
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new Error('Failed to load pharmacy locations. Please try again.');
  }
}

/**
 * Fetch pharmacies near a given lat/lng within radiusKm
 * TODO: Backend should accept ?lat=&lng=&radius= query params
 * e.g. GET /pharmacies/nearby?lat=-1.9441&lng=30.0619&radius=5
 */
export async function fetchNearbyPharmacies(
  lat: number,
  lng: number,
  radiusKm = 5,
  signal?: AbortSignal
): Promise<PharmacyLocation[]> {
  if (!lat || !lng) {
    throw new Error('Location coordinates are required');
  }

  try {
    const res = await api.get<ApiResponse<PharmacyLocation[]>>(
      `/pharmacies/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
      { signal }
    );
    return unwrapData<PharmacyLocation>(res.data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to load nearby pharmacies';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch a single pharmacy by ID
 * TODO: Backend endpoint GET /pharmacies/:id
 */
export async function fetchPharmacyById(id: string, signal?: AbortSignal): Promise<PharmacyLocation> {
  if (!id) {
    throw new Error('Pharmacy ID is required');
  }

  try {
    const res = await api.get<ApiResponse<PharmacyLocation>>(`/pharmacies/${id}`, { signal });
    const pharmacy = res.data.data ?? res.data;
    if (!pharmacy) {
      throw new Error('Pharmacy not found');
    }
    return pharmacy;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to load pharmacy details';
    throw new Error(errorMessage);
  }
}
