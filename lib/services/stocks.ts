const NEPSE_API_URL = process.env.NEXT_PUBLIC_NEPSE_API_URL || 'https://sharepulse.qzz.io/api/nepse/live-data';

export async function fetchStocks() {
  const response = await fetch(NEPSE_API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch from NEPSE API');
  }
  return response.json();
}
