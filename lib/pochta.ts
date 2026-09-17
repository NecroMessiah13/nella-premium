import axios from 'axios';

const POCHTA_CALC_URL = 'https://otpravka.pochta.ru/calculate/tariff';

// Ключи Почты России:
//  POCHTA_API_KEY может быть:
//   - "login:password"  -> заголовок X-User-Authorization (Basic)
//   - простое значение  -> заголовок Authorization: AccessToken <key>
function pochtaHeaders(): Record<string, string> {
  const key = process.env.POCHTA_API_KEY || '';
  if (!key) return { 'Content-Type': 'application/json' };

  if (key.includes(':')) {
    const [login, ...rest] = key.split(':');
    const password = rest.join(':');
    return {
      'Content-Type': 'application/json',
      'X-User-Authorization': `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`,
    };
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `AccessToken ${key}`,
  };
}

// Расчёт стоимости пересылки (тариф Почты России)
export async function calculatePochtaRate(opts: {
  toIndex: string;
  weight: number;
  fromIndex?: string;
}): Promise<{ cost: number | null; raw?: any }> {
  const fromIndex = opts.fromIndex || process.env.POCHTA_SENDER_INDEX || '357827';
  const weight = Math.max(1, Math.round(opts.weight));

  try {
    const response = await axios.post(
      POCHTA_CALC_URL,
      {
        'mail-category': 'ORDINARY',
        'mail-type': 'POSTAL_PARCEL',
        'index-from': fromIndex,
        'index-to': opts.toIndex,
        weight,
        sumoc: 0,
        hpayment: 1,
      },
      { headers: pochtaHeaders(), timeout: 15000 }
    );

    const d = response.data;
    if (d && typeof d.tariff === 'number' && d.tariff >= 0) {
      return { cost: Math.round(d.tariff * 100), raw: d };
    }
    return { cost: null, raw: d };
  } catch (error: any) {
    console.error('POCHTA calc error:', error?.response?.status, error?.response?.data || error.message);
    return { cost: null, raw: error?.response?.data };
  }
}