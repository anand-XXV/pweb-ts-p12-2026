import { UserSession, QueueType, Ticket } from './types.js';

const SESSION_KEY = 'user_session';
const QUEUE_TYPES_KEY = 'jenis_antrian';
const TICKETS_KEY = 'tiket_antrian';

const DEFAULT_QUEUE_TYPES: QueueType[] = [
  { id: 'A', code: 'A', name: 'UMUM-1', active: true },
  { id: 'B', code: 'B', name: 'UMUM-2', active: true },
  { id: 'C', code: 'C', name: 'UMUM-3', active: true },
  { id: 'G', code: 'G', name: 'GIGI', active: true },
  { id: 'F', code: 'F', name: 'FARMASI', active: true },
  { id: 'P', code: 'P', name: 'PSIKOLOG', active: true }
];

export const getSessionStorage = (): UserSession | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const setSessionStorage = (session: UserSession): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSessionStorage = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const getQueueTypesStorage = (): QueueType[] => {
  const data = localStorage.getItem(QUEUE_TYPES_KEY);
  if (!data) {
    saveQueueTypesStorage(DEFAULT_QUEUE_TYPES);
    return DEFAULT_QUEUE_TYPES;
  }
  return JSON.parse(data);
};

export const saveQueueTypesStorage = (queueTypes: QueueType[]): void => {
  localStorage.setItem(QUEUE_TYPES_KEY, JSON.stringify(queueTypes));
};

export const getTicketsStorage = (): Ticket[] => {
  const data = localStorage.getItem(TICKETS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTicketsStorage = (tickets: Ticket[]): void => {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
};