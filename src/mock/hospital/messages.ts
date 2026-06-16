import type { Conversation } from '@/types/hospital';
// This file contains mock data for hospital conversations, which can be used for testing and development purposes. The data includes a list of conversations with various attributes such as sender name, role, last message, timestamp, unread message count, and an array of messages within each conversation. Each message has its own text, direction (sent or received), and timestamp. This mock data can be used to populate the messaging interface in the hospital portal and to test features related to communication between healthcare staff.
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-001',
    senderName: 'Dr. Patrick Habimana',
    role: 'General Medicine',
    lastMessage: 'Patient Claudine Uwimana labs are back. Malaria confirmed.',
    timestamp: '2026-06-01T09:45:00Z',
    unread: 2,
    messages: [
      { id: 'm-001', text: 'Good morning Alice. Did you review the triage notes for apt-002?', direction: 'RECEIVED', timestamp: '2026-06-01T08:10:00Z' },
      { id: 'm-002', text: 'Yes, noted. Claudine has elevated temp and fatigue — waiting on labs.', direction: 'SENT', timestamp: '2026-06-01T08:25:00Z' },
      { id: 'm-003', text: 'Patient Claudine Uwimana labs are back. Malaria confirmed.', direction: 'RECEIVED', timestamp: '2026-06-01T09:45:00Z' },
      { id: 'm-004', text: 'Initiating artemether-lumefantrine. I will update the consultation notes.', direction: 'RECEIVED', timestamp: '2026-06-01T09:47:00Z' },
    ],
  },
  {
    id: 'conv-002',
    senderName: 'Nurse Claudine Umutoni',
    role: 'Cardiology Ward',
    lastMessage: 'Vitals done for apt-001. BP: 148/92, HR: 84.',
    timestamp: '2026-06-01T08:35:00Z',
    unread: 0,
    messages: [
      { id: 'm-005', text: 'Dr. Mutoni, patient Jean Bosco has arrived for his 8:30 appointment.', direction: 'RECEIVED', timestamp: '2026-06-01T08:28:00Z' },
      { id: 'm-006', text: 'Thank you. Please complete triage and send me vitals before I call him in.', direction: 'SENT', timestamp: '2026-06-01T08:30:00Z' },
      { id: 'm-007', text: 'Vitals done for apt-001. BP: 148/92, HR: 84.', direction: 'RECEIVED', timestamp: '2026-06-01T08:35:00Z' },
      { id: 'm-008', text: 'Noted. I will see him now.', direction: 'SENT', timestamp: '2026-06-01T08:38:00Z' },
    ],
  },
  {
    id: 'conv-003',
    senderName: 'Dr. Eric Nsanzimana',
    role: 'Surgery',
    lastMessage: 'Theogene Murenzi booked for appendectomy on June 10.',
    timestamp: '2026-06-01T07:55:00Z',
    unread: 1,
    messages: [
      { id: 'm-009', text: 'Alice, can you refer Theogene Murenzi to me after your consult? Appendicitis suspected.', direction: 'RECEIVED', timestamp: '2026-06-01T07:40:00Z' },
      { id: 'm-010', text: 'Will do. I will add a surgical referral note to his file.', direction: 'SENT', timestamp: '2026-06-01T07:50:00Z' },
      { id: 'm-011', text: 'Theogene Murenzi booked for appendectomy on June 10.', direction: 'RECEIVED', timestamp: '2026-06-01T07:55:00Z' },
    ],
  },
  {
    id: 'conv-004',
    senderName: 'Dr. Solange Ingabire',
    role: 'Neurology',
    lastMessage: 'Can we discuss the Chantal Mukabutera post-stroke protocol?',
    timestamp: '2026-05-31T16:20:00Z',
    unread: 0,
    messages: [
      { id: 'm-012', text: 'Can we discuss the Chantal Mukabutera post-stroke protocol?', direction: 'RECEIVED', timestamp: '2026-05-31T16:20:00Z' },
      { id: 'm-013', text: 'Sure, I will be free after 14:00 tomorrow. Let us meet in the ward.', direction: 'SENT', timestamp: '2026-05-31T16:45:00Z' },
    ],
  },
  {
    id: 'conv-005',
    senderName: 'Hospital Admin — Jean Habimana',
    role: 'Administration',
    lastMessage: 'Q2 staff performance reviews are due by June 15.',
    timestamp: '2026-05-30T10:00:00Z',
    unread: 0,
    messages: [
      { id: 'm-014', text: 'Good afternoon Dr. Mutoni. Q2 staff performance reviews are due by June 15.', direction: 'RECEIVED', timestamp: '2026-05-30T10:00:00Z' },
      { id: 'm-015', text: 'Understood. I will submit the Cardiology ward review by June 12.', direction: 'SENT', timestamp: '2026-05-30T10:30:00Z' },
    ],
  },
];
