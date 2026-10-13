import { getSessionStorage, clearSessionStorage } from './storage.js';
import { UserSession, Role } from './types.js';

export function requireAuth(allowedRoles: Role[]): UserSession {
  const session = getSessionStorage();

  if (!session) {
    window.location.href = 'login.html';
    throw new Error('Unauthorized');
  }

  const effectiveRole = session.role === 'moderator' ? 'admin' : session.role;

  if (!allowedRoles.includes(effectiveRole)) {
    alert('Akses ditolak!');
    window.location.href = 'login.html';
    throw new Error('Forbidden');
  }

  return session;
}

export function logout(): void {
  clearSessionStorage();
  window.location.href = 'login.html';
}

export function redirectIfLoggedIn(): void {
  const session = getSessionStorage();
  if (session) {
    if (session.role === 'admin' || session.role === 'moderator') {
      window.location.href = 'index.html';
    } else {
      window.location.href = 'ambil-antrian.html';
    }
  }
}