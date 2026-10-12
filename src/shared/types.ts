export type Role = 'admin' | 'moderator' | 'user';

export type Priority = 'Normal' | 'Lansia' | 'Disabilitas' | 'VIP';

export type TicketStatus = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati';

export interface UserSession {
  token: string;
  role: Role;
  firstName: string;
  username: string;
}

export interface QueueType {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Ticket {
  id: string;              // Format: "A-001"
  queueTypeCode: string;
  number: number;
  priority: Priority;
  status: TicketStatus;
  createdAt: number;
}