import { ArrowLeftRight, ArrowUpRight, ClockAlert, ShieldCheck, Wallet } from "lucide-react";

// Replace with live data from your API layer.
const stats = {
  platformBalance: 184_620_500,
  volume30d: 96_480_000,
  volumeChangePct: 8.1,
  escrowHeld: 41_230_000,
  escrowWallets: 62,
  pendingVerification: 14,
};

const volumeTrend = [58, 62, 55, 70, 68, 74, 71, 80, 76, 85, 82, 90, 88, 96];

const queueSnapshot = [
  { id: "Q-3391", title: "Login from new device + new location", category: "Security review", priority: "high" as const },
  { id: "Q-3390", title: "Top-up settled but wallet not credited", category: "Payment exception", priority: "critical" as const },
  { id: "Q-3388", title: "Delivery code entered but work incomplete", category: "Escrow dispute", priority: "high" as const },
  { id: "Q-3385", title: "ID document unreadable on resubmission", category: "Verification issue", priority: "medium" as const },
  { id: "Q-3382", title: "Withdrawal reversed by receiving bank", category: "Payment exception", priority: "medium" as const },
];

const recentTransactions = [
  { ref: "PP-441298", job: "Boiler service — Lekki", date: "21 Sep", amount: 145_000, status: "settled" as const },
  { ref: "PP-441281", job: "Kitchen fitting — Ikeja", date: "21 Sep", amount: 612_000, status: "held" as const },
  { ref: "PP-441267", job: "Roofing repair — Yaba", date: "20 Sep", amount: 288_500, status: "settled" as const },
  { ref: "PP-441250", job: "Bathroom refit — Enugu", date: "20 Sep", amount: 390_000, status: "pending" as const },
  { ref: "PP-441233", job: "Fence installation — Abuja", date: "19 Sep", amount: 176_000, status: "reversed" as const },
];

const priorityDot: Record<string, string> = {
  critical: "bg-rose-600",
  high: "bg-amber-600",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

const statusStyle: Record<string, string> = {
  settled: "bg-emerald-50 text-emerald-700",
  held: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  reversed: "bg-rose-50 text-rose-700",
};

function naira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}
function nairaCompact(n: number) {
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1_000) return "₦" + (n / 1_000).toFixed(0) + "k";
  return naira(n);
}

function Sparkline({ data }: { data: number[] }) {
  const w = 560;
  const h = 180;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 24) - 8;
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      <path d={areaPath} fill="url(#volFill)" />
      <path d={linePath} fill="none" stroke="#d97706" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={4} fill="#d97706" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Wallet;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
          <Icon size={16} strokeWidth={1.75} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {trend && (
          <span className={trend.positive ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
        <span className="text-slate-400">{sub}</span>
      </div>
    </div>
  );
}

const Overview = () => {





  
  return (
    <div className="space-y-4">
      {/* Stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Platform balance"
          value={naira(stats.platformBalance)}
          sub="Across all settlement accounts"
          icon={Wallet}
        />
        <StatCard
          label="Transaction volume (30d)"
          value={nairaCompact(stats.volume30d)}
          sub="vs. prior 30 days"
          icon={ArrowLeftRight}
          trend={{ value: `${stats.volumeChangePct}%`, positive: true }}
        />
        <StatCard
          label="Escrow currently held"
          value={nairaCompact(stats.escrowHeld)}
          sub={`${stats.escrowWallets} wallets funded`}
          icon={ShieldCheck}
        />
        <StatCard
          label="Pending verification"
          value={String(stats.pendingVerification)}
          sub="Payments + identity checks"
          icon={ClockAlert}
          trend={{ value: "5 new today", positive: false }}
        />
      </div>

      {/* Chart + queue */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Transaction volume — last 14 days</h2>
            <span className="text-xs text-slate-400">Daily total, ₦</span>
          </div>
          <Sparkline data={volumeTrend} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Operations queue</h2>
            <a href="/admin/operations" className="text-xs font-medium text-amber-700 hover:underline">
              View all
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {queueSnapshot.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot[item.priority]}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent transactions</h2>
          <a href="/admin/transactions" className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline">
            View ledger <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTransactions.map((t) => (
            <div key={t.ref} className="grid grid-cols-2 items-center gap-3 py-2.5 text-sm first:pt-0 last:pb-0 sm:grid-cols-5">
              <span className="font-mono text-xs text-slate-500">{t.ref}</span>
              <span className="truncate text-slate-700">{t.job}</span>
              <span className="hidden text-slate-400 sm:block">{t.date}</span>
              <span className="text-right font-medium text-slate-900 sm:text-left">{naira(t.amount)}</span>
              <span className="justify-self-end">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[t.status]}`}>
                  {t.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;