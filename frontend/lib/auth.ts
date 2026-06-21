export interface AuthUser {
  account_id: number;
  Name?: string | null;
  email?: string | null;
  Phone?: string | null;
  Role: number;
  Avatar?: string | null;
}

export const authUpdatedEvent = 'authUpdated';

export const persistAuthSession = (token: string, user: AuthUser) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', String(user.Role));
  localStorage.setItem('userId', String(user.account_id));
  localStorage.setItem('userName', user.Name || '');
  localStorage.setItem('userEmail', user.email || '');
  localStorage.setItem('userPhone', user.Phone || '');
  localStorage.setItem('userAvatar', user.Avatar || '/images/default.png');

  document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = `userRole=${user.Role}; path=/; max-age=604800; SameSite=Lax`;
  window.dispatchEvent(new Event(authUpdatedEvent));
};

export const clearAuthSession = () => {
  [
    'token',
    'userRole',
    'userId',
    'userName',
    'userEmail',
    'userPhone',
    'userAvatar'
  ].forEach((key) => localStorage.removeItem(key));

  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax';
  window.dispatchEvent(new Event(authUpdatedEvent));
};
