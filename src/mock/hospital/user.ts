import type { MockDoctor, MockAdmin } from '@/types/hospital';

// TODO: to be  replaced with useAuth() once hospital login flow is confirmed
// For now, these mock user objects can be used to simulate logged-in doctor and admin users in the hospital portal during development and testing. They contain basic information such as name, role, specialization, department, hospital affiliation, and email. This allows the frontend to conditionally render content based on user role and to display user-specific information without needing a full authentication system in place yet.
export const MOCK_DOCTOR: MockDoctor = {
  id: 'doctor-mock-001',
  firstName: 'Alice',
  lastName: 'Mutoni',
  role: 'DOCTOR',
  specialisation: 'Cardiologist',
  department: 'Cardiology',
  hospitalId: 'hospital-mock-001',
  hospitalName: 'E-Vuze General Hospital',
  email: 'alice.mutoni@evuze.rw',
};

export const MOCK_ADMIN: MockAdmin = {
  id: 'admin-mock-001',
  firstName: 'Jean',
  lastName: 'Habimana',
  role: 'HOSPITAL_ADMIN',
  hospitalId: 'hospital-mock-001',
  hospitalName: 'E-Vuze General Hospital',
  email: 'jean.habimana@evuze.rw',
};
