const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const getMediaUrl = (path?: string | null, fallback = '/images/default.png') => {
  if (!path) return fallback;
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads')) return `${apiBase}${path}`;
  if (path.includes('/Content/Images/')) return path.replace('/Content/Images/', '/images/');
  if (path.startsWith('/')) return path;
  return `/images/${path.replace(/^images\//, '')}`;
};
