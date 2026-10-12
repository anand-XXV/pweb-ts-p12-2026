import {
  getQueueTypesStorage,
  saveQueueTypesStorage,
  getTicketsStorage,
  saveTicketsStorage
} from './storage.js';
import { QueueType, Ticket, Priority } from './types.js';

export function addQueueType(code: string, name: string): QueueType {
  const formattedCode = code.trim().toUpperCase();
  const formattedName = name.trim();

  const queueTypes = getQueueTypesStorage();

  const isCodeExist = queueTypes.some(q => q.code.toUpperCase() === formattedCode);
  const isNameExist = queueTypes.some(q => q.name.toUpperCase() === formattedName.toUpperCase());

  if (isCodeExist) {
    throw new Error(`Kode jenis antrian '${formattedCode}' sudah digunakan!`);
  }

  if (isNameExist) {
    throw new Error(`Nama jenis antrian '${formattedName}' sudah digunakan!`);
  }

  const newQueue: QueueType = {
    id: formattedCode,
    code: formattedCode,
    name: formattedName,
    active: true
  };

  queueTypes.push(newQueue);
  saveQueueTypesStorage(queueTypes);
  return newQueue;
}

export function toggleQueueStatus(code: string): void {
  const queueTypes = getQueueTypesStorage();
  const target = queueTypes.find(q => q.code === code);
  if (target) {
    target.active = !target.active;
    saveQueueTypesStorage(queueTypes);
  }
}

export function deleteQueue(code: string): void {
  const queueTypes = getQueueTypesStorage().filter(q => q.code !== code);
  saveQueueTypesStorage(queueTypes);
}

export function createTicket(queueTypeCode: string, priority: Priority): Ticket {
  const tickets = getTicketsStorage();
  const sameQueueTickets = tickets.filter(t => t.queueTypeCode === queueTypeCode);
  const nextNumber = sameQueueTickets.length + 1;

  const formattedNum = String(nextNumber).padStart(3, '0');
  const ticketId = `${queueTypeCode}-${formattedNum}`;

  const newTicket: Ticket = {
    id: ticketId,
    queueTypeCode,
    number: nextNumber,
    priority,
    status: 'Menunggu',
    createdAt: Date.now()
  };

  tickets.push(newTicket);
  saveTicketsStorage(tickets);
  return newTicket;
}

export function resetAllTickets(): void {
  saveTicketsStorage([]);
}