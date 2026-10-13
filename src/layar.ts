import { logout, requireAuth } from './shared/auth.js';
import { getQueueTypesStorage, getTicketsStorage } from './shared/storage.js';
import { QueueType, Ticket, UserSession } from './shared/types.js';

document.addEventListener('DOMContentLoaded', () => {
  let session: UserSession;

  try {
    session = requireAuth(['admin', 'moderator', 'user']);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return;
    throw error;
  }

  const userDisplay = getElement<HTMLElement>('user-display');
  const logoutButton = getElement<HTMLButtonElement>('logout-btn');
  const callsContainer = getElement<HTMLElement>('active-calls');
  const queuesContainer = getElement<HTMLElement>('queue-cards');
  const updatedAt = getElement<HTMLElement>('updated-at');
  const feedback = getElement<HTMLElement>('display-feedback');
  const fullscreenButton = getElement<HTMLButtonElement>('fullscreen-btn');
  const dashboardLink = getElement<HTMLAnchorElement>('dashboard-link');

  userDisplay.textContent = `${session.firstName} (${session.role})`;
  dashboardLink.hidden = session.role !== 'admin' && session.role !== 'moderator';
  logoutButton.addEventListener('click', logout);
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('focus', render);
  window.setInterval(render, 2500);
  render();
  updateFullscreenButton();

  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        feedback.textContent = 'Mode layar penuh tidak didukung oleh browser ini.';
      }
    } catch (error) {
      feedback.textContent = error instanceof Error
        ? `Tidak dapat mengubah mode layar penuh: ${error.message}`
        : 'Tidak dapat mengubah mode layar penuh.';
    }
  }

  function updateFullscreenButton(): void {
    fullscreenButton.textContent = document.fullscreenElement
      ? 'Keluar dari layar penuh'
      : 'Layar penuh';
    fullscreenButton.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  }

  function handleStorageChange(event: StorageEvent): void {
    if (event.key === 'user_session' && !event.newValue) {
      window.location.href = 'login.html';
      return;
    }
    if (event.key === 'tiket_antrian' || event.key === 'jenis_antrian') render();
  }

  function render(): void {
    try {
      const queueTypes = getQueueTypesStorage().filter(queue => queue.active);
      const tickets = getTicketsStorage();
      const activeCalls = tickets
        .filter(ticket => ticket.status === 'Dipanggil')
        .sort((left, right) => left.createdAt - right.createdAt || left.number - right.number);

      renderActiveCalls(activeCalls);
      renderQueueCards(queueTypes, tickets, activeCalls);
      updatedAt.textContent = `Diperbarui ${new Date().toLocaleTimeString('id-ID')}`;
      feedback.textContent = '';
    } catch (error) {
      feedback.textContent = error instanceof Error
        ? `Gagal memuat data antrian: ${error.message}`
        : 'Gagal memuat data antrian.';
    }
  }

  function renderActiveCalls(activeCalls: Ticket[]): void {
    callsContainer.replaceChildren();

    if (activeCalls.length === 0) {
      callsContainer.append(createMessage('Belum ada nomor yang dipanggil.'));
      return;
    }

    for (const ticket of activeCalls) {
      const call = document.createElement('article');
      call.className = 'active-call';

      const number = document.createElement('strong');
      number.className = 'active-call-number';
      number.textContent = ticket.id;

      const details = document.createElement('span');
      details.textContent = `${getQueueName(ticket.queueTypeCode)} · ${ticket.priority}`;

      call.append(number, details);
      callsContainer.append(call);
    }
  }

  function renderQueueCards(
    queueTypes: QueueType[],
    tickets: Ticket[],
    activeCalls: Ticket[]
  ): void {
    queuesContainer.replaceChildren();

    if (queueTypes.length === 0) {
      queuesContainer.append(createMessage('Belum ada jenis antrian yang aktif.'));
      return;
    }

    for (const queue of queueTypes) {
      const card = document.createElement('article');
      card.className = 'queue-card';

      const heading = document.createElement('h2');
      heading.textContent = `${queue.name} (${queue.code})`;

      const calledTicket = activeCalls.find(ticket => ticket.queueTypeCode === queue.code);
      const calledLabel = document.createElement('p');
      calledLabel.className = 'queue-card-current';
      calledLabel.textContent = calledTicket
        ? `Dipanggil: ${calledTicket.id}`
        : 'Belum dipanggil';

      const waitingCount = tickets.filter(
        ticket => ticket.queueTypeCode === queue.code && ticket.status === 'Menunggu'
      ).length;
      const waitingLabel = document.createElement('p');
      waitingLabel.className = 'queue-card-waiting';
      waitingLabel.textContent = `${waitingCount} antrian menunggu`;

      card.append(heading, calledLabel, waitingLabel);
      queuesContainer.append(card);
    }
  }

  function getQueueName(code: string): string {
    return getQueueTypesStorage().find(queue => queue.code === code)?.name ?? `Antrian ${code}`;
  }
});

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemen #${id} tidak ditemukan.`);
  return element as T;
}

function createMessage(message: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.className = 'empty-state';
  paragraph.textContent = message;
  return paragraph;
}
