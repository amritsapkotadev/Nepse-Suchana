export interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateMockNepseData(
  symbol: string,
  period: string = '1M'
): ChartData[] {
  const data: ChartData[] = [];
  const basePrice = 1000 + Math.random() * 2000;
  let currentPrice = basePrice;
  
  // Determine number of data points based on period
  let days = 30; // Default 1 month
  if (period === '1D') days = 1;
  else if (period === '1W') days = 7;
  else if (period === '3M') days = 90;
  else if (period === '6M') days = 180;
  else if (period === '1Y') days = 365;
  else if (period === 'ALL') days = 365 * 3;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulate price movement
    const change = (Math.random() - 0.5) * 50;
    currentPrice = Math.max(100, currentPrice + change);
    
    const open = currentPrice;
    const close = open + (Math.random() - 0.5) * 40;
    const high = Math.max(open, close) + Math.random() * 20;
    const low = Math.min(open, close) - Math.random() * 20;
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      time: date.toISOString().split('T')[0], // YYYY-MM-DD format
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
  }
  
  return data;
}
