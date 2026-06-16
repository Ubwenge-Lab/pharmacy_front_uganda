import type { HospitalSettings, AdminProfile } from '@/types/hospital';
// This file contains mock data for hospital settings and admin profile, which can be used for testing and development purposes. The hospital settings include basic information about the hospital such as name, address, phone, and email. The admin profile includes personal information about the hospital administrator. This mock data can be used to populate the settings page in the hospital portal and to test features related to managing hospital information and administrator profiles.
export const MOCK_HOSPITAL_SETTINGS: HospitalSettings = {
  hospitalName: 'E-Vuze General Hospital',
  address: 'Kololo Avenue, Kampala, Uganda',
  phone: '+250788000100',
  email: 'admin@evuze-hospital.rw',
};

export const MOCK_ADMIN_PROFILE: AdminProfile = {
  firstName: 'Jean',
  lastName: 'Habimana',
  email: 'jean.habimana@evuze.rw',
  phone: '+250788000200',
};
