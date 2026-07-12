import { TrendingUp, TrendingDown, DollarSign, Calendar, Landmark, Coins } from "lucide-react";

interface StatsCardsProps {
  bankName: string;
  statementPeriod: string;
  currency: string;
  totalDeposits: number;
  totalWithdrawals: number;
}

export function StatsCards({
  bankName,
  statementPeriod,
  currency,
  totalDeposits,
  totalWithdrawals,
}: StatsCardsProps) {
  // Format currency indicator
  const getCurrencySymbol = (code: string) => {
    const symbolMap: { [key: string]: string } = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
      AUD: "A$",
      CAD: "C$",
      JPY: "¥",
    };
    return symbolMap[code.toUpperCase()] || code || "$";
  };

  const symbol = getCurrencySymbol(currency);
  const netSavings = totalDeposits - Math.abs(totalWithdrawals);
  const isPositive = netSavings >= 0;

  return (
    <div id="stats-cards-grid" className="space-y-4">
      {/* Statement Meta Row */}
      <div
        id="statement-meta-card"
        className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Detected Bank
            </p>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {bankName || "Unknown Bank"}
            </h4>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:border-l sm:border-zinc-200 sm:dark:border-zinc-800 sm:pl-6">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Statement Period
            </p>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {statementPeriod || "Unknown Period"}
            </h4>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:border-l sm:border-zinc-200 sm:dark:border-zinc-800 sm:pl-6">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-xl">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Base Currency
            </p>
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase">
              {currency || "USD"} ({symbol})
            </h4>
          </div>
        </div>
      </div>

      {/* Financial Numbers Grid */}
      <div id="financial-kpi-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deposits Card */}
        <div className="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Deposits (Income)
              </p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2 tracking-tight">
                {symbol}
                {totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2 opacity-5 pointer-events-none">
            <TrendingUp className="h-28 w-28 text-emerald-600" />
          </div>
        </div>

        {/* Withdrawals Card */}
        <div className="p-5 rounded-2xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Total Withdrawals (Expenses)
              </p>
              <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2 tracking-tight">
                {symbol}
                {Math.abs(totalWithdrawals).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-rose-100/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2 opacity-5 pointer-events-none">
            <TrendingDown className="h-28 w-28 text-rose-600" />
          </div>
        </div>

        {/* Net Savings Card */}
        <div className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden group ${
          isPositive
            ? "border-sky-100 dark:border-sky-950/40 bg-sky-50/20 dark:bg-sky-950/10"
            : "border-amber-100 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/10"
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                isPositive ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                Net Savings / Flow
              </p>
              <h3 className={`text-2xl font-black mt-2 tracking-tight ${
                isPositive ? "text-sky-700 dark:text-sky-300" : "text-amber-700 dark:text-amber-300"
              }`}>
                {isPositive ? "" : "-"}
                {symbol}
                {Math.abs(netSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${
              isPositive
                ? "bg-sky-100/50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
                : "bg-amber-100/50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
            }`}>
              {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2 opacity-5 pointer-events-none">
            <Coins className="h-28 w-28 text-zinc-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
