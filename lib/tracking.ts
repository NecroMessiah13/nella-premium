const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function rand(max: number): number {
  return Math.floor(Math.random() * max);
}

function digits(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += String(rand(10));
  return s;
}

function letters(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += LETTERS[rand(LETTERS.length)];
  return s;
}

export type TrackingCarrier = "PICKUP" | "COURIER" | "MAIL";

// Форматы трек-номеров по способу доставки:
// - MAIL    — Почта России: 2 буквы + 9 цифр + 2 буквы (RU123456789RU)
// - COURIER — курьер/СДЭК: 10 цифр
// - PICKUP  — код выдачи самовывоза: PVZ-XXXXXX
export function generateTrackingNumber(deliveryMethod?: TrackingCarrier | string): string {
  switch ((deliveryMethod as string) || "COURIER") {
    case "MAIL":
      return `${letters(2)}${digits(9)}${letters(2)}`;
    case "PICKUP":
      return `PVZ-${digits(6)}${letters(2)}`;
    case "COURIER":
    default:
      return digits(10);
  }
}