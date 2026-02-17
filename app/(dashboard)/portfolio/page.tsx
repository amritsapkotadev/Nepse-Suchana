import PortfolioClient from './PortfolioClient';

async function getAllStocks() {
  const apiUrl = process.env.NEPSE_API_KEY;
  if (!apiUrl) return [];
  const res = await fetch(apiUrl, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.liveCompanyData.map((c: any) => ({
    symbol: c.symbol,
    name: c.securityName,
  }));
}

export default function PortfolioPage() {
  return <PortfolioClient />;
}