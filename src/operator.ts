import { logout, requireAuth } from './shared/auth.js';
import {
  getQueueTypesStorage,
  getTicketsStorage,
  saveTicketsStorage
} from './shared/storage.js';
import { Priority, Ticket, UserSession } from './shared/types.js';

const PRIORITY_ORDER: Record<Priority, number> = {
  VIP: 0,
  Disabilitas: 1,
  Lansia: 2,
  Normal: 3
};

document.addEventListener('DOMContentLoaded', () => {
  let session: UserSession;

  try {
    session = requireAuth(['admin']);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return;
    }
    throw error;
  }

  const userDisplay = getElement<HTMLElement>('user-display');
  const dashboardLink = getElement<HTMLAnchorElement>('dashboard-link');
  const logoutButton = getElement<HTMLButtonElement>('logout-btn');
  const currentTicket = getElement<HTMLElement>('current-ticket');
  const currentDetails = getElement<HTMLElement>('current-details');
  const nextTicket = getElement<HTMLElement>('next-ticket');
  const nextDetails = getElement<HTMLElement>('next-details');
  const queueSummary = getElement<HTMLElement>('queue-summary');
  const feedback = getElement<HTMLElement>('operator-feedback');
  const callNextButton = getElement<HTMLButtonElement>('call-next-btn');
  const skipButton = getElement<HTMLButtonElement>('skip-btn');
  const finishButton = getElement<HTMLButtonElement>('finish-btn');

  userDisplay.textContent = `${session.firstName} (${session.role})`;
  dashboardLink.hidden = false;
  logoutButton.addEventListener('click', logout);

  callNextButton.addEventListener('click', () => {
    try {
      const tickets = getTicketsStorage();
      const current = getCurrentTicket(tickets);
      if (current) current.status = 'Selesai';

      const next = getNextTicket(tickets);
      if (next) {
        next.status = 'Dipanggil';
        feedback.textContent = `Memanggil ${next.id}.`;
      } else {
        feedback.textContent = 'Tidak ada tiket menunggu.';
      }

      saveTicketsStorage(tickets);
      render();
    } catch (error) {
      showError(error);
    }
  });

  skipButton.addEventListener('click', () => {
    updateCurrentTicket('Dilewati', 'Tiket ditandai sebagai dilewati.');
  });

  finishButton.addEventListener('click', () => {
    updateCurrentTicket('Selesai', 'Tiket selesai.');
  });

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('focus', render);
  window.setInterval(render, 2500);
  render();

  function updateCurrentTicket(status: 'Dilewati' | 'Selesai', message: string): void {
    try {
      const tickets = getTicketsStorage();
      const current = getCurrentTicket(tickets);

      if (!current) {
        feedback.textContent = 'Tidak ada tiket yang sedang dipanggil.';
        render();
        return;
      }

      current.status = status;
      saveTicketsStorage(tickets);
      feedback.textContent = message;
      render();
    } catch (error) {
      showError(error);
    }
  }

  function render(): void {
    try {
      const tickets = getTicketsStorage();
      const current = getCurrentTicket(tickets);
      const next = getNextTicket(tickets);
      const waitingCount = tickets.filter(ticket => ticket.status === 'Menunggu').length;
      const skippedCount = tickets.filter(ticket => ticket.status === 'Dilewati').length;

      currentTicket.textContent = current?.id ?? '—';
      currentDetails.textContent = current
        ? `${getQueueName(current.queueTypeCode)} · ${current.priority}`
        : 'Belum ada tiket yang dipanggil';
      nextTicket.textContent = next?.id ?? '—';
      nextDetails.textContent = next
        ? `${getQueueName(next.queueTypeCode)} · ${next.priority}`
        : 'Tidak ada tiket menunggu';
      queueSummary.textContent = `${waitingCount} menunggu · ${skippedCount} dilewati`;

      callNextButton.disabled = !next;
      skipButton.disabled = !current;
      finishButton.disabled = !current;
      feedback.classList.remove('error');
    } catch (error) {
      showError(error);
    }
  }

  function getQueueName(code: string): string {
    return getQueueTypesStorage().find(queue => queue.code === code)?.name ?? `Antrian ${code}`;
  }

  function handleStorageChange(event: StorageEvent): void {
    if (event.key === 'tiket_antrian' || event.key === 'jenis_antrian') render();
    if (event.key === 'user_session' && !event.newValue) window.location.href = 'login.html';
  }

  function showError(error: unknown): void {
    feedback.textContent = error instanceof Error ? error.message : 'Gagal memuat data antrian.';
    feedback.classList.add('error');
  }
});

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemen #${id} tidak ditemukan.`);
  return element as T;
}

function getCurrentTicket(tickets: Ticket[]): Ticket | undefined {
  return tickets
    .filter(ticket => ticket.status === 'Dipanggil')
    .sort((left, right) => left.createdAt - right.createdAt || left.number - right.number)[0];
}

function getNextTicket(tickets: Ticket[]): Ticket | undefined {
  return tickets
    .filter(ticket => ticket.status === 'Menunggu')
    .sort((left, right) =>
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
      left.createdAt - right.createdAt ||
      left.number - right.number
    )[0];
}
