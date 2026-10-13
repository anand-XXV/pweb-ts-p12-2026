import { loginApi } from './shared/api.js';
import { setSessionStorage } from './shared/storage.js';
import { redirectIfLoggedIn } from './shared/auth.js';
import { Role, UserSession } from './shared/types.js';

document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();

  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const btnText = document.getElementById('btn-text') as HTMLSpanElement;
  const errorAlert = document.getElementById('error-alert') as HTMLDivElement;

  loginForm.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    hideError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginApi(username, password);

      let role: Role = data.role ? (data.role.toLowerCase() as Role) : 'user';

      const session: UserSession = {
        token: data.accessToken || data.token || 'mock-token',
        role: role,
        firstName: data.firstName || username,
        username: data.username || username
      };

      setSessionStorage(session);

      if (role === 'admin' || role === 'moderator') {
        window.location.href = 'index.html';
      } else {
        window.location.href = 'ambil-antrian.html';
      }
    } catch (error: any) {
      showError(error.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading: boolean) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.textContent = 'Memproses...';
    } else {
      submitBtn.disabled = false;
      btnText.textContent = 'Masuk';
    }
  }

  function showError(msg: string) {
    errorAlert.textContent = msg;
    errorAlert.classList.remove('hidden');
  }

  function hideError() {
    errorAlert.classList.add('hidden');
    errorAlert.textContent = '';
  }
});