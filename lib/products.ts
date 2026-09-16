export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  offerPrice?: number | null;
  color: string;
  badge?: string | null;
  tone: string;
  description?: string | null;
  variants?: {
    id: number;
    sku: string;
    size: string;
    color: string;
    inStock?: boolean;
  }[];
  images?: {
    id: number;
    url: string;
    alt: string | null;
    sortOrder: number;
  }[];
};

export type DiscountLike = {
  type: string;
  value: number;
  active: boolean;
  startsAt: Date | string | null;
  expiresAt: Date | string | null;
};

export function isDiscountActive(d: DiscountLike | null | undefined, now = new Date()): boolean {
  if (!d) return false;
  if (!d.active) return false;
  if (d.startsAt && new Date(d.startsAt) > now) return false;
  if (d.expiresAt && new Date(d.expiresAt) < now) return false;
  return true;
}

export function computeOfferPrice(price: number, d: DiscountLike | null | undefined): number | null {
  if (!d || d.type === 'NONE' || !isDiscountActive(d)) return null;
  if (d.type === 'PERCENT') return Math.max(0, Math.round(price * (100 - d.value) / 100));
  if (d.type === 'FIXED') return Math.max(0, price - d.value);
  return null;
}

export const formatPrice = (v: number) =>
  new Intl.NumberFormat('ru-RU').format(v) + ' ₽';
