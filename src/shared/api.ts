
import type { Role } from './types.js';

export interface LoginResponse {
  id?: number;
  accessToken?: string;
  token?: string;
  role?: string;
  firstName?: string;
  username?: string;
  message?: string;
}

interface FilteredUsersResponse {
  users?: Array<{
    id?: number;
    username?: string;
  }>;
}

interface UserProfileResponse {
  username?: string;
  role?: string;
}

async function getFilteredUserRole(
  userId: number,
  username: string
): Promise<Role> {
  const roles = ['admin', 'user'] as const;
  const results = await Promise.all(roles.map(async role => {
    const response = await fetch(
      `https://dummyjson.com/users/filter?key=role&value=${role}&limit=0`
    );

    if (!response.ok) {
      throw new Error(`Gagal memverifikasi daftar pengguna ${role}.`);
    }

    const data: FilteredUsersResponse = await response.json();
    return {
      role,
      user: data.users?.find(user => user.id === userId)
    };
  }));

  const matches = results.filter(result => result.user);
  if (matches.length > 1) {
    throw new Error('Role pengguna tidak dapat diverifikasi secara unik.');
  }

  const match = matches[0];
  if (match) {
    if (match.user?.username !== username) {
      throw new Error('Username pada data role tidak cocok dengan akun login.');
    }
    return match.role;
  }

  const response = await fetch(`https://dummyjson.com/users/${userId}`);
  if (!response.ok) {
    throw new Error('Gagal mengambil data role moderator.');
  }

  const profile: UserProfileResponse = await response.json();
  if (profile.username !== username || profile.role?.toLowerCase() !== 'moderator') {
    throw new Error('Data role pengguna tidak valid.');
  }

  return 'moderator';
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

  const role = await getFilteredUserRole(data.id, data.username ?? username);

  return {
    ...data,
    role
  };
}
