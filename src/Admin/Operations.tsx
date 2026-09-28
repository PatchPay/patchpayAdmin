import { useMemo, useState, type ReactElement } from "react";
import { AlertTriangle, Clock3, ShieldAlert, WalletCards, Scale, FileCheck } from "lucide-react";

import Modal from "../components/UI/Modal";
import { PageIntro, StatCard, TableHeader, DetailItem, Pill, Toolbar, EmptyState, Mono } from "../components/UI/TableParts";
import { people, ref, daysAgo, int, pick } from "../lib/mockdata";

type Category = "Security review" | "Payment exception" | "Escrow dispute" | "Verification issue";
type Priority = "Critical" | "High" | "Medium" | "Low";

interface Operation {
  id: string;
  ref: string;
  category: Category;
  title: string;
  detail: string;
  user: string;
  priority: Priority;
  assignee: string | null;
  slaHours: number;
  opened: string;
}

const assignees = ["Ada Chen", "Femi Alabi", "Grace Obi", null, null];

const catalogue: { category: Category; title: string; detail: string; priority: Priority }[] = [
  { category: "Security review", title: "Login from new device + new location", detail: "Account flagged after a login from an unrecognised device far from the usual IP location.", priority: "High" },
  { category: "Security review", title: "Five failed logins before success", detail: "Possible credential stuffing attempt; account was briefly locked automatically.", priority: "Critical" },
  { category: "Payment exception", title: "Top-up settled but wallet not credited", detail: "Provider confirms the debit; PatchPay ledger shows no matching credit entry yet.", priority: "Critical" },
  { category: "Payment exception", title: "Withdrawal reversed by receiving bank", detail: "Bank returned funds citing invalid account details; wallet balance needs reconciling.", priority: "Medium" },
  { category: "Escrow dispute", title: "Delivery code entered but work incomplete", detail: "Homeowner disputes release after the tradesperson reportedly obtained the code early.", priority: "High" },
  { category: "Escrow dispute", title: "Scope disagreement holding release", detail: "Tradesperson claims extra work was agreed verbally; homeowner disputes this.", priority: "Medium" },
  { category: "Verification issue", title: "ID document unreadable on resubmission", detail: "Second upload of proof-of-address still fails automated document checks.", priority: "Medium" },
  { category: "Verification issue", title: "Trade certification expired", detail: "Gas Safe certificate on file expired 14 days ago; jobs are still being accepted.", priority: "High" },
];

const operations: Operation[] = Array.from({ length: 16 }).map((_, i) => {
  const base = catalogue[i % catalogue.length];
  return {
    id: `OP-${String(i + 1).padStart(3, "0")}`,
    ref: ref(base.category === "Security review" ? "SEC" : base.category === "Payment exception" ? "PAY" : base.category === "Escrow dispute" ? "ESC" : "VER"),
    ...base,
    user: pick(people).name,
    assignee: pick(assignees),
    slaHours: base.priority === "Critical" ? 2 : base.priority === "High" ? 24 : base.priority === "Medium" ? 48 : 72,
    opened: daysAgo(int(0, 4), true),
  };
});

const categoryIcon: Record<Category, ReactElement> = {
  "Security review": <ShieldAlert size={18} className="text-rose-500" />,
  "Payment exception": <WalletCards size={18} className="text-amber-500" />,
  "Escrow dispute": <Scale size={18} className="text-teal-600" />,
  "Verification issue": <FileCheck size={18} className="text-sky-500" />,
};

const priorityTone: Record<Priority, "danger" | "warning" | "neutral"> = {
  Critical: "danger",
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

type CategoryFilter = "All" | Category;

const Operations = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [selected, setSelected] = useState<Operation | null>(null);

  const counts = useMemo(
    () => ({
      total: operations.length,
      critical: operations.filter((o) => o.priority === "Critical").length,
      unassigned: operations.filter((o) => !o.assignee).length,
      disputes: operations.filter((o) => o.category === "Escrow dispute").length,
    }),
    []
  );

  const filtered = operations.filter((o) => {
    if (categoryFilter !== "All" && o.category !== categoryFilter) return false;
    const v = search.toLowerCase();
    if (!v) return true;
    return [o.id, o.ref, o.title, o.user].some((f) => f.toLowerCase().includes(v));
  });

  return (
    <div className="space-y-6">
      <PageIntro title="Operations queue" description="Everything waiting on a human decision, across security, payments, escrow and verification." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open items" value={String(counts.total)} sub="Across all categories" />
        <StatCard label="Critical" value={String(counts.critical)} sub="2-hour SLA" tone="danger" />
        <StatCard label="Unassigned" value={String(counts.unassigned)} sub="Waiting for an owner" tone="warning" />
        <StatCard label="Escrow disputes" value={String(counts.disputes)} sub="Held pending review" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Toolbar count={filtered.length} label="Queue">
          <div className="relative w-full sm:max-w-xs">
            <Clock3 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, title or user"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
        </Toolbar>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-4 py-3">
          {(["All", "Security review", "Payment exception", "Escrow dispute", "Verification issue"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setCategoryFilter(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === opt ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-240">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHeader>Reference</TableHeader>
                <TableHeader>Issue</TableHeader>
                <TableHeader>User</TableHeader>
                <TableHeader>Priority</TableHeader>
                <TableHeader>Assignee</TableHeader>
                <TableHeader>Opened</TableHeader>
                <TableHeader>SLA</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && <EmptyState title="Queue is clear" hint="Nothing matches this filter right now." />}
              {filtered.map((o) => (
                <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer hover:bg-slate-50/70">
                  <td className="px-5 py-4"><Mono>{o.ref}</Mono></td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5">{categoryIcon[o.category]}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{o.title}</p>
                        <p className="text-xs text-slate-400">{o.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{o.user}</td>
                  <td className="px-5 py-4"><Pill tone={priorityTone[o.priority]}>{o.priority}</Pill></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{o.assignee ?? <span className="text-slate-400">Unassigned</span>}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{o.opened}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{o.slaHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {operations.length} items</p>
        </div>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Operation details" description="Review and act on this queue item." size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Reference</p>
              <p className="mt-1 font-semibold text-slate-900"><Mono>{selected.ref}</Mono></p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Category" value={selected.category} />
              <DetailItem label="User" value={selected.user} />
              <DetailItem label="Priority" value={<Pill tone={priorityTone[selected.priority]}>{selected.priority}</Pill>} />
              <DetailItem label="Assignee" value={selected.assignee ?? "Unassigned"} />
              <DetailItem label="Opened" value={selected.opened} />
              <DetailItem label="SLA" value={`${selected.slaHours} hours`} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Description</p>
              <p className="mt-1 text-sm text-slate-700">{selected.detail}</p>
            </div>

            {selected.priority === "Critical" && (
              <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertTriangle size={19} className="shrink-0 text-rose-600" />
                <p className="text-sm text-rose-800">Critical priority — this breaches SLA in under {selected.slaHours} hours from being opened.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              {!selected.assignee && <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Assign to me</button>}
              <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Mark resolved</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Operations;