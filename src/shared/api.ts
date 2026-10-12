export interface LoginResponse {
  accessToken?: string;
  token?: string;
  role?: string;
  firstName?: string;
  username?: string;
  message?: string;
}

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch('https://dummyjson.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Username atau password salah!');
  }

  return data;
}