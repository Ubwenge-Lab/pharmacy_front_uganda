// src/features/map/pharmacyData.ts
// Mock pharmacy data for triangulation feature
// TODO: Replace with API call to /api/pharmacies/locations when backend is ready

export interface PharmacyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  status: 'OPEN' | 'CLOSED';
  distance?: number; // km from user – populated at runtime
  isActive: boolean;
  rating?: number;
  hours: string;
  region: string;
}

export const MOCK_PHARMACIES: PharmacyLocation[] = [
  {
    id: 'ph-001',
    name: 'Kampala Central Pharmacy',
    address: 'Kampala Road, City Centre, Kampala',
    latitude: 0.3163,
    longitude: 32.5822,
    phone: '+256 700 100 001',
    status: 'OPEN',
    isActive: true,
    rating: 4.8,
    hours: '08:00 – 22:00',
    region: 'Kampala',
  },
  {
    id: 'ph-002',
    name: 'Ntinda HealthPlus Pharmacy',
    address: 'Ntinda Road, Ntinda, Kampala',
    latitude: 0.3558,
    longitude: 32.6127,
    phone: '+256 700 100 002',
    status: 'OPEN',
    isActive: true,
    rating: 4.5,
    hours: '07:30 – 21:00',
    region: 'Kampala',
  },
  {
    id: 'ph-003',
    name: 'Nakawa MedPlus',
    address: 'Jinja Road, Nakawa, Kampala',
    latitude: 0.3364,
    longitude: 32.6163,
    phone: '+256 700 100 003',
    status: 'CLOSED',
    isActive: true,
    rating: 4.2,
    hours: '08:00 – 20:00',
    region: 'Kampala',
  },
  {
    id: 'ph-004',
    name: 'Rubaga Family Pharmacy',
    address: 'Rubaga Road, Rubaga, Kampala',
    latitude: 0.3086,
    longitude: 32.5488,
    phone: '+256 700 100 004',
    status: 'OPEN',
    isActive: true,
    rating: 4.6,
    hours: '08:00 – 22:00',
    region: 'Kampala',
  },
  {
    id: 'ph-005',
    name: 'Kireka Express Pharmacy',
    address: 'Kireka Road, Kireka, Wakiso',
    latitude: 0.3597,
    longitude: 32.6403,
    phone: '+256 700 100 005',
    status: 'OPEN',
    isActive: true,
    rating: 4.3,
    hours: '07:00 – 23:00',
    region: 'Kampala',
  },
  {
    id: 'ph-006',
    name: 'Entebbe City Pharmacy',
    address: 'Entebbe Road, Entebbe',
    latitude: 0.0593,
    longitude: 32.4595,
    phone: '+256 700 100 006',
    status: 'OPEN',
    isActive: true,
    rating: 4.1,
    hours: '08:00 – 20:00',
    region: 'Central Region',
  },
  {
    id: 'ph-007',
    name: 'Gulu Northern Pharma',
    address: 'Gulu Avenue, Gulu',
    latitude: 2.7747,
    longitude: 32.2990,
    phone: '+256 700 100 007',
    status: 'CLOSED',
    isActive: false,
    rating: 3.9,
    hours: '08:00 – 19:00',
    region: 'Northern Region',
  },
  {
    id: 'ph-008',
    name: 'Jinja Lake View Pharmacy',
    address: 'Main Street, Jinja',
    latitude: 0.4244,
    longitude: 33.2041,
    phone: '+256 700 100 008',
    status: 'OPEN',
    isActive: true,
    rating: 4.4,
    hours: '08:00 – 21:00',
    region: 'Eastern Region',
  },
  {
    id: 'ph-009',
    name: 'Kololo Premium Pharmacy',
    address: 'Acacia Avenue, Kololo, Kampala',
    latitude: 0.3412,
    longitude: 32.5886,
    phone: '+256 700 100 009',
    status: 'OPEN',
    isActive: true,
    rating: 4.9,
    hours: '24 Hours',
    region: 'Kampala',
  },
  {
    id: 'ph-010',
    name: 'Bugolobi Health Pharmacy',
    address: 'Bugolobi Road, Bugolobi, Kampala',
    latitude: 0.3285,
    longitude: 32.6023,
    phone: '+256 700 100 010',
    status: 'OPEN',
    isActive: true,
    rating: 4.7,
    hours: '07:00 – 22:00',
    region: 'Kampala',
  },
];

export const DEFAULT_CENTER: [number, number] = [0.3476, 32.5825]; // Kampala
export const DEFAULT_ZOOM = 13;
export const ADMIN_DEFAULT_ZOOM = 8;
