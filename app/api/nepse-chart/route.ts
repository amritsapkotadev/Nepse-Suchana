import { generateMockNepseData } from '@/utils/nepseDataGenerator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const period = searchParams.get('period') || '1M';

  try {
    // For now, use mock data
    if (!symbol) return Response.json({ error: 'Symbol required' }, { status: 400 });
    const data = generateMockNepseData(symbol, period);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
