// Mock data matching GET /api/hospitals/:hospitalId/doctors
// Used for: Departments page (grouped by specialization), Staff page, Schedule
// The full doctor profiles include all fields returned by the backend, which allows the frontend to display detailed information about each doctor without needing additional API calls. This mock data can be used to populate the doctors list, their profiles, and to link with the schedule and staff management features in the hospital portal.
import type { DoctorProfile, HospitalStaffMember } from '@/types/hospital';

// Full doctor profiles — matches backend response shape exactly
export const MOCK_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-001',
    specialization: 'Cardiology',
    licenseNumber: 'RW-LIC-1001',
    firstName: 'Alice',
    lastName: 'Mutoni',
    isAvailable: true,
    bio: 'Senior cardiologist with 12 years of experience.',
    rating: 4.8,
    user: { email: 'alice.mutoni@evuze.rw', hospitalStaff: { firstName: 'Alice', lastName: 'Mutoni', phone: '+250788001001' } },
  },
  {
    id: 'doc-002',
    specialization: 'General Medicine',
    licenseNumber: 'RW-LIC-1002',
    firstName: 'Patrick',
    lastName: 'Habimana',
    isAvailable: true,
    bio: 'General practitioner specialising in infectious diseases.',
    rating: 4.6,
    user: { email: 'patrick.habimana@evuze.rw', hospitalStaff: { firstName: 'Patrick', lastName: 'Habimana', phone: '+250788001002' } },
  },
  {
    id: 'doc-003',
    specialization: 'Paediatrics',
    licenseNumber: 'RW-LIC-1003',
    firstName: 'Diane',
    lastName: 'Mukamana',
    isAvailable: true,
    bio: 'Paediatrician with focus on child nutrition and development.',
    rating: 4.9,
    user: { email: 'diane.mukamana@evuze.rw', hospitalStaff: { firstName: 'Diane', lastName: 'Mukamana', phone: '+250788001003' } },
  },
  {
    id: 'doc-004',
    specialization: 'Surgery',
    licenseNumber: 'RW-LIC-1004',
    firstName: 'Eric',
    lastName: 'Nsanzimana',
    isAvailable: false,
    bio: 'General surgeon. Currently on planned leave.',
    rating: 4.7,
    user: { email: 'eric.nsanzimana@evuze.rw', hospitalStaff: { firstName: 'Eric', lastName: 'Nsanzimana', phone: '+250788001004' } },
  },
  {
    id: 'doc-005',
    specialization: 'Neurology',
    licenseNumber: 'RW-LIC-1005',
    firstName: 'Solange',
    lastName: 'Ingabire',
    isAvailable: true,
    bio: 'Neurologist specialising in epilepsy and stroke management.',
    rating: 4.5,
    user: { email: 'solange.ingabire@evuze.rw', hospitalStaff: { firstName: 'Solange', lastName: 'Ingabire', phone: '+250788001005' } },
  },
  {
    id: 'doc-006',
    specialization: 'Orthopaedics',
    licenseNumber: 'RW-LIC-1006',
    firstName: 'Celestin',
    lastName: 'Rudasingwa',
    isAvailable: true,
    bio: 'Orthopaedic surgeon. Sports medicine certified.',
    rating: 4.7,
    user: { email: 'celestin.rudasingwa@evuze.rw', hospitalStaff: { firstName: 'Celestin', lastName: 'Rudasingwa', phone: '+250788001006' } },
  },
  {
    id: 'doc-007',
    specialization: 'Dermatology',
    licenseNumber: 'RW-LIC-1007',
    firstName: 'Beata',
    lastName: 'Mukamugisha',
    isAvailable: true,
    bio: 'Dermatologist with expertise in skin infections and eczema.',
    rating: 4.4,
    user: { email: 'beata.mukamugisha@evuze.rw', hospitalStaff: { firstName: 'Beata', lastName: 'Mukamugisha', phone: '+250788001007' } },
  },
];

// Full staff list including nurses — used by Staff Management page
export const MOCK_HOSPITAL_STAFF: HospitalStaffMember[] = [
  { id: 'doc-001', firstName: 'Alice',    lastName: 'Mutoni',       role: 'DOCTOR',      specialization: 'Cardiology',      department: 'Cardiology',      email: 'alice.mutoni@evuze.rw',      phone: '+250788001001', status: 'ACTIVE',    joinedAt: '2022-03-01' },
  { id: 'doc-002', firstName: 'Patrick',  lastName: 'Habimana',     role: 'DOCTOR',      specialization: 'General Medicine', department: 'General Medicine', email: 'patrick.habimana@evuze.rw',  phone: '+250788001002', status: 'ACTIVE',    joinedAt: '2021-07-15' },
  { id: 'doc-003', firstName: 'Diane',    lastName: 'Mukamana',     role: 'DOCTOR',      specialization: 'Paediatrics',     department: 'Paediatrics',     email: 'diane.mukamana@evuze.rw',    phone: '+250788001003', status: 'ACTIVE',    joinedAt: '2020-11-20' },
  { id: 'doc-004', firstName: 'Eric',     lastName: 'Nsanzimana',   role: 'DOCTOR',      specialization: 'Surgery',         department: 'Surgery',         email: 'eric.nsanzimana@evuze.rw',   phone: '+250788001004', status: 'ON_LEAVE',  joinedAt: '2019-05-08' },
  { id: 'doc-005', firstName: 'Solange',  lastName: 'Ingabire',     role: 'DOCTOR',      specialization: 'Neurology',       department: 'Neurology',       email: 'solange.ingabire@evuze.rw',  phone: '+250788001005', status: 'ACTIVE',    joinedAt: '2023-01-10' },
  { id: 'doc-006', firstName: 'Celestin', lastName: 'Rudasingwa',   role: 'DOCTOR',      specialization: 'Orthopaedics',    department: 'Orthopaedics',    email: 'celestin.rudasingwa@evuze.rw',phone:'+250788001006', status: 'ACTIVE',    joinedAt: '2022-09-14' },
  { id: 'doc-007', firstName: 'Beata',    lastName: 'Mukamugisha',  role: 'DOCTOR',      specialization: 'Dermatology',     department: 'Dermatology',     email: 'beata.mukamugisha@evuze.rw', phone: '+250788001007', status: 'ACTIVE',    joinedAt: '2024-02-01' },
  { id: 'nur-001', firstName: 'Claudine', lastName: 'Umutoni',      role: 'NURSE',                                          department: 'Cardiology',      email: 'claudine.umutoni@evuze.rw',  phone: '+250788002001', status: 'ACTIVE',    joinedAt: '2022-04-01' },
  { id: 'nur-002', firstName: 'Jeanne',   lastName: 'Murekatete',   role: 'NURSE',                                          department: 'Paediatrics',     email: 'jeanne.murekatete@evuze.rw', phone: '+250788002002', status: 'ACTIVE',    joinedAt: '2021-08-20' },
  { id: 'nur-003', firstName: 'Sandrine', lastName: 'Uwimana',      role: 'NURSE',                                          department: 'Surgery',         email: 'sandrine.uwimana@evuze.rw',  phone: '+250788002003', status: 'ACTIVE',    joinedAt: '2023-03-15' },
  { id: 'nur-004', firstName: 'Olive',    lastName: 'Niyonkuru',    role: 'NURSE',                                          department: 'General Medicine', email: 'olive.niyonkuru@evuze.rw',  phone: '+250788002004', status: 'INACTIVE',  joinedAt: '2020-06-10' },
  { id: 'nur-005', firstName: 'Aline',    lastName: 'Ishimwe',      role: 'NURSE',                                          department: 'Neurology',       email: 'aline.ishimwe@evuze.rw',     phone: '+250788002005', status: 'ACTIVE',    joinedAt: '2024-01-08' },
];

// Department summary derived from MOCK_DOCTORS grouped by specialization
// Used by Departments page — matches Tab 6 strategy in API mapping doc
export const MOCK_DEPARTMENTS = [
  { id: 'dept-001', name: 'Cardiology',      doctorCount: 1, nurseCount: 1, status: 'ACTIVE' as const },
  { id: 'dept-002', name: 'General Medicine', doctorCount: 1, nurseCount: 1, status: 'ACTIVE' as const },
  { id: 'dept-003', name: 'Paediatrics',      doctorCount: 1, nurseCount: 1, status: 'ACTIVE' as const },
  { id: 'dept-004', name: 'Surgery',          doctorCount: 1, nurseCount: 1, status: 'ACTIVE' as const },
  { id: 'dept-005', name: 'Neurology',        doctorCount: 1, nurseCount: 1, status: 'ACTIVE' as const },
  { id: 'dept-006', name: 'Orthopaedics',     doctorCount: 1, nurseCount: 0, status: 'ACTIVE' as const },
  { id: 'dept-007', name: 'Dermatology',      doctorCount: 1, nurseCount: 0, status: 'ACTIVE' as const },
];
