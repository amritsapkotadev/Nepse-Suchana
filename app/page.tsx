interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  change: number;
  changePercent: number;
  turnover: number;
}

interface MarketSummary {
  name: string;
  value: number;
}

interface StockSummary {
  advanced: number;
  declined: number;
  unchanged: number;
}

interface Index {
  name: string;
  symbol: string;
  currentValue: number;
  change: number;
  changePercent: number;
}

interface ApiResponse {
  marketSummary: MarketSummary[];
  stockSummary: StockSummary;
  indices: Index[];
  topTurnover: Stock[];
  topGainers: Stock[];
  topLosers: Stock[];
}

async function getNepseData(): Promise<ApiResponse | null> {
  try {
    const apiUrl = process.env.NEPSE_API_KEY;
    if (!apiUrl) {
      console.error('NEPSE_API_KEY not found in environment variables');
      return null;
    }

    const response = await fetch(apiUrl, {
      next: { revalidate: 60 },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch NEPSE data:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching NEPSE data:', error);
    return null;
  }
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatCrore(num: number): string {
  return (num / 10000000).toFixed(2);
}

export default async function Home() {
  const nepseData = await getNepseData();

  if (!nepseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Unable to fetch NEPSE data
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Please check your API configuration
          </p>
        </div>
      </div>
    );
  }

  const nepseIndex = nepseData.indices?.find(i => i.symbol === 'NEPSE');
  const totalTurnover = nepseData.marketSummary?.find(m => m.name === 'Total Turnover Rs:')?.value || 0;
  const totalVolume = nepseData.marketSummary?.find(m => m.name === 'Total Traded Shares')?.value || 0;
  const gainers = nepseData.stockSummary?.advanced || 0;
  const losers = nepseData.stockSummary?.declined || 0;
  const topStocks = nepseData.topTurnover?.slice(0, 15) || [];
  const topGainers = nepseData.topGainers?.slice(0, 10) || [];
  const topLosers = nepseData.topLosers?.slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            NEPSE Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Nepal Stock Exchange Live Data
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">NEPSE Index</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {nepseIndex?.currentValue.toFixed(2) || 'N/A'}
            </p>
            <p className={`text-sm mt-1 ${(nepseIndex?.change ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {(nepseIndex?.change ?? 0) >= 0 ? '+' : ''}{nepseIndex?.change.toFixed(2)} ({nepseIndex?.changePercent.toFixed(2)}%)
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Turnover</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Rs {formatCrore(totalTurnover)} Cr
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Volume: {formatNumber(totalVolume)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Gainers</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{gainers}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Stocks up today</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Losers</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{losers}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Stocks down today</p>
          </div>
        </div>

       

        {/* Top Gainers and Losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Top Gainers */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top Gainers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      LTP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {topGainers.length > 0 ? (
                    topGainers.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {stock.symbol}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          Rs {stock.lastTradedPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
                          +{stock.changePercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top Losers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      LTP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {topLosers.length > 0 ? (
                    topLosers.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {stock.symbol}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          Rs {stock.lastTradedPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-semibold">
                          {stock.changePercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live data from NEPSE API • Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  );
}
