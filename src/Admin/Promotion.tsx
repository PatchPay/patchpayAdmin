import { useMemo, useState } from "react";

/* ----------------------------- Types ----------------------------- */

export type Persona = "Personal" | "Business" | "NGO" | "Government Org";
export type DiscountType = "percent" | "fixed" | "fee_waiver";

export interface Promo {
  id: string;
  code: string;
  name: string;
  personas: Persona[];
  discountType: DiscountType;
  discountValue: number; // % or amount, unused for fee_waiver
  minTransaction: number; // minimum transaction amount to qualify
  usageLimit: number; // total redemptions allowed, 0 = unlimited
  perUserLimit: number; // redemptions per user, 0 = unlimited
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  paused: boolean;
  stoppedAt?: string | null; // yyyy-mm-dd. Set when stopped; stopped promos are archived, never deleted
  redeemed: number;
}

interface PromotionProps {
  initialPromos?: Promo[];
  onCreate?: (promo: Promo) => void | Promise<void>;
  /** Called for pause/resume, stop and restore. A stopped promo arrives with `stoppedAt` set. */
  onUpdate?: (promo: Promo) => void | Promise<void>;
}

/* ---------------------------- Constants -------------------------- */

const PERSONAS: Persona[] = ["Personal", "Business", "NGO", "Government Org"];

const PERSONA_PREFIX: Record<Persona, string> = {
  Personal: "PER",
  Business: "BIZ",
  NGO: "NGO",
  "Government Org": "GOV",
};

const DISCOUNT_LABEL: Record<DiscountType, string> = {
  percent: "Percentage off fee",
  fixed: "Fixed amount off fee",
  fee_waiver: "Waive the fee",
};

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

/** yyyy-mm-dd -> dd/mm/yyyy (string split, so no timezone shifts) */
const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "—";
};

const generateCode = (personas: Persona[]): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I
  const rand = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const tag = personas.length === 1 ? PERSONA_PREFIX[personas[0]] : "ALL";
  return `PATCH-${tag}-${rand}`;
};

const describeDiscount = (type: DiscountType, value: number): string => {
  if (type === "percent") return `${value}% off fees`;
  if (type === "fixed") return `$${value} off fees`;
  return "No transaction fee";
};

/** One line only: the per-user cap if set, else the total cap, else "Unlimited". */
const describeLimit = (usageLimit: number, perUserLimit: number): string => {
  if (perUserLimit > 0) return `${perUserLimit} per user`;
  if (usageLimit > 0) return `${usageLimit} uses in total`;
  return "Unlimited";
};

type Status = "Active" | "Scheduled" | "Expired" | "Paused" | "Used up" | "Stopped";

const getStatus = (p: Promo): Status => {
  if (p.stoppedAt) return "Stopped";
  if (p.paused) return "Paused";
  if (p.usageLimit > 0 && p.redeemed >= p.usageLimit) return "Used up";
  const t = today();
  if (t < p.startDate) return "Scheduled";
  if (t > p.endDate) return "Expired";
  return "Active";
};

const STATUS_STYLE: Record<Status, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  Paused: "bg-amber-50 text-amber-700 ring-amber-200",
  Expired: "bg-slate-100 text-slate-600 ring-slate-200",
  "Used up": "bg-slate-100 text-slate-600 ring-slate-200",
  Stopped: "bg-rose-50 text-rose-700 ring-rose-200",
};

/* --------------------------- Seed data --------------------------- */

const SEED: Promo[] = [
  {
    id: "1",
    code: "PATCH-BIZ-K7X2Q",
    name: "Business onboarding",
    personas: ["Business"],
    discountType: "percent",
    discountValue: 25,
    minTransaction: 100,
    usageLimit: 200,
    perUserLimit: 1,
    startDate: inDays(-10),
    endDate: inDays(20),
    paused: false,
    redeemed: 64,
  },
  {
    id: "2",
    code: "PATCH-NGO-M4HT9",
    name: "NGO fee holiday",
    personas: ["NGO"],
    discountType: "fee_waiver",
    discountValue: 0,
    minTransaction: 0,
    usageLimit: 0,
    perUserLimit: 3,
    startDate: inDays(5),
    endDate: inDays(35),
    paused: false,
    redeemed: 0,
  },
  {
    id: "3",
    code: "PATCH-PER-R8WD4",
    name: "Personal launch offer",
    personas: ["Personal"],
    discountType: "fixed",
    discountValue: 5,
    minTransaction: 50,
    usageLimit: 500,
    perUserLimit: 1,
    startDate: inDays(-30),
    endDate: inDays(30),
    paused: false,
    stoppedAt: inDays(-3),
    redeemed: 18,
  },
];

/* ---------------------------- Form state ------------------------- */

interface FormState {
  name: string;
  code: string;
  personas: Persona[];
  discountType: DiscountType;
  discountValue: number;
  minTransaction: number;
  usageLimit: number;
  perUserLimit: number;
  startDate: string;
  endDate: string;
}

const emptyForm = (): FormState => ({
  name: "",
  code: "",
  personas: [],
  discountType: "percent",
  discountValue: 10,
  minTransaction: 0,
  usageLimit: 0,
  perUserLimit: 1,
  startDate: today(),
  endDate: inDays(30),
});

/* ---------------------------- Small UI --------------------------- */

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);

/* ---------------------------- Component -------------------------- */

const Promotion = ({ initialPromos = SEED, onCreate, onUpdate }: PromotionProps) => {
  const [promos, setPromos] = useState<Promo[]>(initialPromos);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"all" | "stopped">("all");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const togglePersona = (p: Persona) =>
    set(
      "personas",
      form.personas.includes(p)
        ? form.personas.filter((x) => x !== p)
        : [...form.personas, p]
    );

  const currentPromos = useMemo(() => promos.filter((p) => !p.stoppedAt), [promos]);
  const stoppedPromos = useMemo(() => promos.filter((p) => p.stoppedAt), [promos]);
  const visible = view === "all" ? currentPromos : stoppedPromos;

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!form.name.trim()) e.push("Give the promotion a name.");
    if (form.personas.length === 0) e.push("Pick at least one customer type.");
    if (!form.code.trim()) e.push("Generate or enter a promo code.");
    const clash = promos.find((p) => p.code === form.code.trim().toUpperCase());
    if (clash)
      e.push(
        clash.stoppedAt
          ? "That code belongs to a stopped promotion."
          : "That code is already in use."
      );
    if (form.discountType === "percent" && (form.discountValue <= 0 || form.discountValue > 100))
      e.push("Percentage must be between 1 and 100.");
    if (form.discountType === "fixed" && form.discountValue <= 0)
      e.push("Enter a discount amount above 0.");
    if (form.endDate < form.startDate) e.push("End date must be after the start date.");
    return e;
  }, [form, promos]);

  const handleCreate = async () => {
    if (errors.length) return;
    setSaving(true);
    const promo: Promo = {
      id: crypto.randomUUID(),
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      paused: false,
      stoppedAt: null,
      redeemed: 0,
    };
    try {
      await onCreate?.(promo);
      setPromos((prev) => [promo, ...prev]);
      setForm(emptyForm());
    } finally {
      setSaving(false);
    }
  };

  const replace = (next: Promo) =>
    setPromos((prev) => prev.map((p) => (p.id === next.id ? next : p)));

  const togglePause = async (promo: Promo) => {
    const next = { ...promo, paused: !promo.paused };
    await onUpdate?.(next);
    replace(next);
  };

  /** Stop = archive. The promo can no longer be redeemed but stays on record. */
  const stop = async (promo: Promo) => {
    const next: Promo = { ...promo, stoppedAt: today() };
    await onUpdate?.(next);
    replace(next);
  };

  /** Restore brings a stopped promo back as Paused, so an admin resumes it on purpose. */
  const restore = async (promo: Promo) => {
    const next: Promo = { ...promo, stoppedAt: null, paused: true };
    await onUpdate?.(next);
    replace(next);
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const tabs = [
    { key: "all" as const, label: "All promotions", count: currentPromos.length },
    { key: "stopped" as const, label: "Stopped", count: stoppedPromos.length },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Promotions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a promo code for a customer type. Users enter it at checkout to
          get the discount.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ------------------------- Create form ------------------------ */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">New promotion</h3>
          </header>

          <div className="space-y-6 p-6">
            <Field label="Promotion name" hint="Only admins see this.">
              <input
                className={inputCls}
                value={form.name}
                placeholder="e.g. Business onboarding"
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>

            {/* Persona targeting */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Who is this for?
              </legend>
              <div className="flex flex-wrap gap-2">
                {PERSONAS.map((p) => {
                  const on = form.personas.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePersona(p)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                        on
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Discount */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discount type">
                <select
                  className={inputCls}
                  value={form.discountType}
                  onChange={(e) => set("discountType", e.target.value as DiscountType)}
                >
                  {(Object.keys(DISCOUNT_LABEL) as DiscountType[]).map((t) => (
                    <option key={t} value={t}>
                      {DISCOUNT_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Field>

              {form.discountType !== "fee_waiver" && (
                <Field label={form.discountType === "percent" ? "Discount (%)" : "Discount amount ($)"}>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.discountValue}
                    onChange={(e) => set("discountValue", parseFloat(e.target.value) || 0)}
                  />
                </Field>
              )}
            </div>

            {/* Code */}
            <Field label="Promo code" hint="Generate a code or type your own.">
              <div className="flex gap-2">
                <input
                  className={`${inputCls} font-mono uppercase tracking-wide`}
                  value={form.code}
                  placeholder="PATCH-BIZ-K7X2Q"
                  onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                />
                <button
                  type="button"
                  onClick={() => set("code", generateCode(form.personas))}
                  className="shrink-0 rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Generate
                </button>
              </div>
            </Field>

            {/* Rules */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Min. transaction ($)">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.minTransaction}
                  onChange={(e) => set("minTransaction", parseFloat(e.target.value) || 0)}
                />
              </Field>
              <Field label="Total uses" hint="0 means unlimited.">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.usageLimit}
                  onChange={(e) => set("usageLimit", parseInt(e.target.value) || 0)}
                />
              </Field>
              <Field label="Uses per user" hint="0 means unlimited.">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.perUserLimit}
                  onChange={(e) => set("perUserLimit", parseInt(e.target.value) || 0)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts">
                <input
                  type="date"
                  className={inputCls}
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </Field>
              <Field label="Ends">
                <input
                  type="date"
                  className={inputCls}
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
            <ul className="text-sm text-red-600">
              {errors.slice(0, 2).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setForm(emptyForm())}
                className="rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={errors.length > 0 || saving}
                className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Creating..." : "Create promotion"}
              </button>
            </div>
          </footer>
        </section>

        {/* ------------------------- User preview ----------------------- */}
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <h3 className="text-sm font-medium text-slate-500">What the user sees</h3>
          <div className="mt-4 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 p-4">
            <p className="text-2xl font-semibold text-indigo-700">
              {describeDiscount(form.discountType, form.discountValue)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {form.minTransaction > 0
                ? `On transactions of $${form.minTransaction} or more.`
                : "On any transaction."}
            </p>
            <div className="mt-4 rounded-md bg-white px-3 py-2 text-center font-mono text-sm tracking-wide text-slate-900 ring-1 ring-indigo-200">
              {form.code || "YOUR-CODE"}
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">For</dt>
              <dd className="text-right text-slate-900">
                {form.personas.length ? form.personas.join(", ") : "None"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Valid</dt>
              <dd className="text-slate-900">
                {formatDate(form.startDate)} to {formatDate(form.endDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Limit</dt>
              <dd className="text-slate-900">
                {describeLimit(form.usageLimit, form.perUserLimit)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* --------------------------- Promo list -------------------------- */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap gap-1 border-b border-slate-200 px-4 py-3 sm:px-6">
          {tabs.map(({ key, label, count }) => {
            const active = view === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setView(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}{" "}
                <span className={active ? "text-indigo-400" : "text-slate-400"}>({count})</span>
              </button>
            );
          })}
        </header>

        {view === "stopped" && (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-xs text-slate-500">
            Stopped promotions can no longer be redeemed. They are kept on record and
            can be restored; a restored promotion comes back paused.
          </p>
        )}

        {visible.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            {view === "all"
              ? "No promotions yet. Create one above to get started."
              : "No stopped promotions. Anything you stop will be kept here."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-205 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3">Promotion</th>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Customer type</th>
                  <th className="px-3 py-3">Discount</th>
                  <th className="px-3 py-3">Used</th>
                  <th className="px-3 py-3">{view === "all" ? "Status" : "Stopped on"}</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((p) => {
                  const status = getStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(p.startDate)} to {formatDate(p.endDate)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => copy(p.code)}
                          title="Copy code"
                          className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-800 hover:bg-slate-200"
                        >
                          {copied === p.code ? "Copied" : p.code}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{p.personas.join(", ")}</td>
                      <td className="px-3 py-3 text-slate-700">
                        {describeDiscount(p.discountType, p.discountValue)}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-700">
                        {p.redeemed}
                        {p.usageLimit > 0 ? ` / ${p.usageLimit}` : ""}
                      </td>
                      <td className="px-3 py-3">
                        {view === "all" ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}
                          >
                            {status}
                          </span>
                        ) : (
                          <span className="text-slate-700">
                            {p.stoppedAt ? formatDate(p.stoppedAt) : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          {view === "all" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => togglePause(p)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                              >
                                {p.paused ? "Resume" : "Pause"}
                              </button>
                              <button
                                type="button"
                                onClick={() => stop(p)}
                                className="text-sm font-medium text-red-600 hover:text-red-800"
                              >
                                Stop
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => restore(p)}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Promotion;