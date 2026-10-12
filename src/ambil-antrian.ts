
import { getQueueTypesStorage } from './shared/storage.js';
import { createTicket } from './shared/queue.js';
import type { Priority, QueueType } from './shared/types.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('queue-types-container') as HTMLDivElement;
  const template = document.getElementById('queue-card-template') as HTMLTemplateElement;
  const loadingMessage = document.getElementById('loading-message') as HTMLParagraphElement;
  const emptyMessage = document.getElementById('empty-message') as HTMLParagraphElement;
  const errorMessage = document.getElementById('error-message') as HTMLParagraphElement;

  const ticketResult = document.getElementById('ticket-result') as HTMLElement;
  const ticketNumber = document.getElementById('ticket-number') as HTMLElement;
  const ticketQueueName = document.getElementById('ticket-queue-name') as HTMLElement;
  const ticketPriority = document.getElementById('ticket-priority') as HTMLElement;
  const closeButton = document.getElementById('ticket-close-btn') as HTMLButtonElement;

  const allowedPriorities: Priority[] = [
    'Normal', 'Lansia', 'Disabilitas', 'VIP'
  ];

  let previousData = '';

  function showError(message: string): void {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function renderQueues(queues: QueueType[]): void {
    container.replaceChildren();

    const activeQueues = queues.filter(queue => queue.active);

    emptyMessage.hidden = activeQueues.length > 0;
    loadingMessage.hidden = true;

    activeQueues.forEach(queue => {
      const fragment = template.content.cloneNode(true) as DocumentFragment;

      const card = fragment.querySelector<HTMLElement>('.queue-card')!;
      const name = fragment.querySelector<HTMLElement>('.queue-name')!;
      const code = fragment.querySelector<HTMLElement>('.queue-code')!;

      card.dataset.queueCode = queue.code;
      name.textContent = queue.name;
      code.textContent = queue.code;

      container.appendChild(fragment);
    });
  }

  function refreshQueues(): void {
    try {
      const queues = getQueueTypesStorage();
      const latestData = JSON.stringify(queues);

      if (latestData === previousData) return;

      previousData = latestData;
      renderQueues(queues);
      errorMessage.hidden = true;
    } catch {
      loadingMessage.hidden = true;
      showError('Gagal membaca daftar layanan antrean.');
    }
  }

  container.addEventListener('click', (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest<HTMLButtonElement>(
      'button[data-priority]'
    );

    if (!button) return;

    const code = button.closest<HTMLElement>(
      '.queue-card'
    )?.dataset.queueCode;

    const selectedPriority = button.dataset.priority;

    if (
      !code ||
      !selectedPriority ||
      !allowedPriorities.includes(selectedPriority as Priority)
    ) {
      showError('Layanan atau prioritas tidak valid.');
      return;
    }

    try {
      const queue = getQueueTypesStorage().find(
        q => q.code === code && q.active
      );

      if (!queue) {
        refreshQueues();
        throw new Error(
          'Layanan ini tidak tersedia lagi. Pilih layanan lain.'
        );
      }

      const ticket = createTicket(
        queue.code,
        selectedPriority as Priority
      );

      ticketNumber.textContent = ticket.id;
      ticketQueueName.textContent = queue.name;
      ticketPriority.textContent = ticket.priority;

      ticketResult.hidden = false;
      errorMessage.hidden = true;

      ticketResult.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : 'Gagal mengambil nomor antrean.'
      );
    }
  });

  closeButton.addEventListener('click', () => {
    ticketResult.hidden = true;
  });

  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === 'jenis_antrian' || event.key === null) {
      refreshQueues();
    }
  });

  refreshQueues();

  window.setInterval(refreshQueues, 2500);
});
