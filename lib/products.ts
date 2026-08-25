export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  color: string;
  badge?: string | null;
  tone: string;
  description?: string | null;
  variants?: {
    id: number;
    sku: string;
    size: string;
    color: string;
    // stock УДАЛИЛИ - не отправляем на фронтенд
  }[];
  images?: {
    id: number;
    url: string;
    alt: string | null;
    sortOrder: number;
  }[];
};

export const formatPrice = (v: number) =>
  new Intl.NumberFormat('ru-RU').format(v) + ' ₽';
