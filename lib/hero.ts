export const HERO_DEFAULTS: Record<string, string> = {
  eyebrow: "НОВАЯ КОЛЛЕКЦИЯ · ОСЕНЬ 2026",
  title1: "Создано",
  title2: "с заботой",
  title3: "о деталях",
  subtitle: "Современная женская одежда с идеальной посадкой, натуральными тканями и характером.",
  button: "Смотреть коллекцию",
  photoLabel: "НЕЛЛА",
  photoCaption: "COLLECTION 01",
  photoImage: "",
};

export function heroFromRows(rows: { key: string; value: string }[]): Record<string, string> {
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;
  return { ...HERO_DEFAULTS, ...s };
}

export const HERO_KEYS = Object.keys(HERO_DEFAULTS);