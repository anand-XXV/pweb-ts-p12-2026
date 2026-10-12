import { requireAuth, logout } from './shared/auth.js';
import {
  getQueueTypesStorage,
  getTicketsStorage,
  saveTicketsStorage
} from './shared/storage.js';
import {
  addQueueType,
  toggleQueueStatus,
  deleteQueue,
  createTicket,
  resetAllTickets
} from './shared/queue.js';
import { Priority } from './shared/types.js';

document.addEventListener('DOMContentLoaded', () => {
  const session = requireAuth(['admin', 'moderator']);

  const userDisplay = document.getElementById('user-display') as HTMLElement;
  const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
  const resetAntrianBtn = document.getElementById('reset-antrian-btn') as HTMLButtonElement;

  const addQueueForm = document.getElementById('add-queue-form') as HTMLFormElement;
  const queueCodeInput = document.getElementById('queue-code') as HTMLInputElement;
  const queueNameInput = document.getElementById('queue-name') as HTMLInputElement;
  const queueTypesList = document.getElementById('queue-types-list') as HTMLDivElement;

  const issueTicketForm = document.getElementById('issue-ticket-form') as HTMLFormElement;
  const ticketQueueSelect = document.getElementById('ticket-queue-select') as HTMLSelectElement;
  const ticketPrioritySelect = document.getElementById('ticket-priority-select') as HTMLSelectElement;
  const ticketsGroupedContainer = document.getElementById('tickets-grouped-container') as HTMLDivElement;

  userDisplay.textContent = `${session.firstName} (${session.role})`;

  logoutBtn.addEventListener('click', () => {
    logout();
  });

  resetAntrianBtn.addEventListener('click', () => {
    if (confirm('Apakah kamu yakin ingin mereset seluruh antrian?')) {
      resetAllTickets();
      renderAll();
    }
  });

  addQueueForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();

    try {
      addQueueType(queueCodeInput.value, queueNameInput.value);
      queueCodeInput.value = '';
      queueNameInput.value = '';
      renderAll();
    } catch (err: any) {
      alert(err.message);
    }
  });

  issueTicketForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();

    const selectedCode = ticketQueueSelect.value;
    const priority = ticketPrioritySelect.value as Priority;

    if (!selectedCode) return;

    createTicket(selectedCode, priority);
    renderAll();
  });

  (window as any).toggleQueue = (code: string) => {
    toggleQueueStatus(code);
    renderAll();
  };

  (window as any).removeQueue = (code: string) => {
    if (confirm(`Hapus jenis antrian dengan kode [${code}]?`)) {
      deleteQueue(code);
      renderAll();
    }
  };

  (window as any).updateTicketStatus = (ticketId: string, newStatus: string) => {
    const tickets = getTicketsStorage();
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = newStatus as any;
      saveTicketsStorage(tickets);
      renderAll();
    }
  };

  function renderAll() {
    renderQueueTypes();
    renderSelectOptions();
    renderGroupedTickets();
  }

  function renderQueueTypes() {
    const queueTypes = getQueueTypesStorage();
    const tickets = getTicketsStorage();

    queueTypesList.innerHTML = '';

    queueTypes.forEach(q => {
      const waitingCount = tickets.filter(t => t.queueTypeCode === q.code && t.status === 'Menunggu').length;

      const item = document.createElement('div');
      item.className = 'queue-item';
      item.innerHTML = `
        <div>
          <div class="queue-title">${q.name} (${q.code})</div>
          <div class="queue-subtitle">${waitingCount} menunggu ${!q.active ? ' • [Nonaktif]' : ''}</div>
        </div>
        <div class="queue-actions">
          <button class="btn-sm-secondary" onclick="toggleQueue('${q.code}')">
            ${q.active ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
          <button class="btn-sm-danger" onclick="removeQueue('${q.code}')">Hapus</button>
        </div>
      `;
      queueTypesList.appendChild(item);
    });
  }

  function renderSelectOptions() {
    const queueTypes = getQueueTypesStorage().filter(q => q.active);
    ticketQueueSelect.innerHTML = '';

    if (queueTypes.length === 0) {
      ticketQueueSelect.innerHTML = `<option value="">Tidak ada jenis antrian aktif</option>`;
      return;
    }

    queueTypes.forEach(q => {
      const opt = document.createElement('option');
      opt.value = q.code;
      opt.textContent = `${q.name} (${q.code})`;
      ticketQueueSelect.appendChild(opt);
    });
  }

  function renderGroupedTickets() {
    const queueTypes = getQueueTypesStorage();
    const tickets = getTicketsStorage();

    ticketsGroupedContainer.innerHTML = '';

    queueTypes.forEach(q => {
      const groupTickets = tickets.filter(t => t.queueTypeCode === q.code);
      if (groupTickets.length === 0) return;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'group-block';

      const header = document.createElement('div');
      header.className = 'group-header';
      header.textContent = q.name;
      groupDiv.appendChild(header);

      const sortedTickets = [...groupTickets].reverse();

      sortedTickets.forEach(t => {
        const ticketRow = document.createElement('div');
        ticketRow.className = 'ticket-item';

        const isPriority = t.priority !== 'Normal';
        const badgeClass = isPriority ? 'badge-priority' : 'badge-normal';

        let actionButtons = '';
        if (t.status === 'Menunggu') {
          actionButtons = `
            <button class="ticket-action-btn" onclick="updateTicketStatus('${t.id}', 'Dipanggil')">Panggil</button>
            <button class="ticket-action-btn danger" onclick="updateTicketStatus('${t.id}', 'Dilewati')">Lewati</button>
          `;
        } else if (t.status === 'Dipanggil') {
          actionButtons = `
            <button class="ticket-action-btn" style="color: #16a34a;" onclick="updateTicketStatus('${t.id}', 'Selesai')">Selesai</button>
          `;
        } else if (t.status === 'Selesai') {
          actionButtons = `<span style="color: #16a34a; font-size: 13px; font-weight: 500;">Selesai</span>`;
        } else if (t.status === 'Dilewati') {
          actionButtons = `<span style="color: #dc2626; font-size: 13px; font-weight: 500;">Dilewati</span>`;
        }

        ticketRow.innerHTML = `
          <div class="ticket-info">
            <span class="ticket-id">${t.id}</span>
            <span class="badge ${badgeClass}">${t.priority}</span>
            <span class="status-text status-${t.status}">${t.status}</span>
          </div>
          <div>${actionButtons}</div>
        `;
        groupDiv.appendChild(ticketRow);
      });

      ticketsGroupedContainer.appendChild(groupDiv);
    });
  }

  renderAll();
});