"use client";

export type OrderItemView = {
  id: number;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

export type OrderView = {
  id: number;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  deliveryMethod: string;
  deliveryCost?: number;
  discountAmount?: number;
  promoCode?: string | null;
  address?: string | null;
  trackingNumber?: string | null;
  bonusEarned?: number;
  items: OrderItemView[];
};

export const STATUS_LABEL: Record<string, string> = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

export const STATUS_BADGE: Record<string, string> = {
  NEW: "new",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PAYMENT_LABEL: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  FAILED: "Не прошла",
  REFUNDED: "Возврат средств",
  CANCELLED: "Оплата отменена",
};

export const PAYMENT_BADGE: Record<string, string> = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

export const DELIVERY_LABEL: Record<string, string> = {
  COURIER: "Курьер",
  PICKUP: "Самовывоз",
  MAIL: "Почта России",
  CDEK: "СДЭК",
  OZON: "Ozon",
};

export const ORDER_STEPS: Record<string, number> = {
  NEW: 0,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  COMPLETED: 3,
  CANCELLED: 0,
};

export const STEP_LABELS = [
  "Заказ оформлен",
  "В обработке",
  "Передан в доставку",
  "Доставлен",
];

export const money = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(n) + " ₽";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
