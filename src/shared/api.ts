
export interface LoginResponse {
  id?: number;
  accessToken?: string;
  token?: string;
  role?: string;
  firstName?: string;
  username?: string;
  message?: string;
}

export async function loginApi(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch('https://dummyjson.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data: LoginResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Username atau password salah!');
  }

  if (typeof data.id !== 'number') {
    throw new Error('ID pengguna tidak ditemukan.');
  }

  const userResponse = await fetch(
    `https://dummyjson.com/users/${data.id}`
  );

  if (!userResponse.ok) {
    throw new Error('Gagal mengambil data role pengguna.');
  }

  const userData: {
    username?: string;
    role?: string;
  } = await userResponse.json();

  const role = userData.role?.toLowerCase();

  if (
    userData.username !== data.username ||
    (role !== 'admin' && role !== 'moderator' && role !== 'user')
  ) {
    throw new Error('Data role pengguna tidak valid.');
  }

  return {
    ...data,
    role
  };
}
