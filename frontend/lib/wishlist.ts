'use client';

import api from '@/lib/api';

type WishlistCache = {
  ids: number[];
  count: number;
};

let wishlistCache: WishlistCache | null = null;
let pendingWishlistPromise: Promise<WishlistCache> | null = null;

const emitWishlistUpdated = () => {
  window.dispatchEvent(new CustomEvent('wishlistUpdated'));
};

export const clearWishlistCache = () => {
  wishlistCache = null;
  pendingWishlistPromise = null;
};

export const loadWishlistCache = async () => {
  if (wishlistCache) return wishlistCache;
  if (pendingWishlistPromise) return pendingWishlistPromise;

  pendingWishlistPromise = api
    .get('/wishlist')
    .then((res) => {
      const items = res.data?.data || [];
      wishlistCache = {
        ids: items.map((item: any) => Number(item.product_id)),
        count: items.length
      };
      return wishlistCache;
    })
    .catch(() => {
      wishlistCache = { ids: [], count: 0 };
      return wishlistCache;
    })
    .finally(() => {
      pendingWishlistPromise = null;
    });

  return pendingWishlistPromise;
};

export const getWishlistCount = async () => {
  const cache = await loadWishlistCache();
  return cache.count;
};

export const isWishlisted = async (productId: number) => {
  const cache = await loadWishlistCache();
  return cache.ids.includes(productId);
};

export const toggleWishlist = async (productId: number) => {
  const res = await api.post('/wishlist/toggle', { productId });
  const current = await loadWishlistCache();

  if (res.data?.action === 'added') {
    wishlistCache = {
      ids: Array.from(new Set([...current.ids, productId])),
      count: current.ids.includes(productId) ? current.count : current.count + 1
    };
  } else {
    wishlistCache = {
      ids: current.ids.filter((id) => id !== productId),
      count: Math.max(0, current.count - (current.ids.includes(productId) ? 1 : 0))
    };
  }

  emitWishlistUpdated();
  return res.data;
};

export const removeWishlistItem = async (productId: number) => {
  await api.delete(`/wishlist/${productId}`);
  const current = await loadWishlistCache();
  wishlistCache = {
    ids: current.ids.filter((id) => id !== productId),
    count: Math.max(0, current.count - (current.ids.includes(productId) ? 1 : 0))
  };
  emitWishlistUpdated();
};
