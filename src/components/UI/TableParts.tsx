import type { ReactNode } from "react";

/**
 * Shared building blocks for the data-heavy admin pages (Users, Transactions,
 * RFQs, Escrow, Operations queue, etc). Pulling these out stops every page
 * from redefining its own TableHeader/Detail/StatCard, which is what made
 * the previous pages feel like five disconnected generations rather than
 * one product.
 */

export function PageIntro({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneText = {
    default: "text-slate-900",
    warning: "text-amber-700",
    danger: "text-rose-700",
    success: "text-emerald-700",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${toneText}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function TableHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3 text-left text-xs font-medium text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

export function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "amber" | "teal";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
  neutral: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-700",
  teal: "bg-teal-50 text-teal-700",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${toneClasses[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

export function Toolbar({
  count,
  label,
  children,
}: {
  count: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{count.toLocaleString()} records</p>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <tr>
      <td colSpan={12} className="px-5 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      </td>
    </tr>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[12.5px] text-slate-500">{children}</span>;
}