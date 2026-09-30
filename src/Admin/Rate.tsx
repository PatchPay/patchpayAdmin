/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../config/axiosconfig";

/* ----------------------------- Types ----------------------------- */

export interface RateConfig {
  rate_national_squad: number; // %
  rate_national_stripe: number; // %
  rate_international_squad: number; // %
  rate_international_stripe: number; // %
}

type RateKey = keyof RateConfig;

type ApiRate = { id: number } & Record<RateKey, number | string>;

interface RateCardProps {
  onSave?: (data: RateConfig) => void | Promise<void>;
}

/* ---------------------------- Constants -------------------------- */

const RATE_KEYS: RateKey[] = [
  "rate_national_squad",
  "rate_national_stripe",
  "rate_international_squad",
  "rate_international_stripe",
];

const EMPTY: RateConfig = {
  rate_national_squad: 0,
  rate_national_stripe: 0,
  rate_international_squad: 0,
  rate_international_stripe: 0,
};

const ROUTES: {
  id: string;
  title: string;
  description: string;
  accent: string;
  fields: { key: RateKey; provider: string }[];
}[] = [
  {
    id: "national",
    title: "National",
    description: "Payments made within the same country",
    accent: "bg-emerald-500",
    fields: [
      { key: "rate_national_squad", provider: "Squad" },
      { key: "rate_national_stripe", provider: "Stripe" },
    ],
  },
  {
    id: "international",
    title: "International",
    description: "Payments that cross a border",
    accent: "bg-indigo-500",
    fields: [
      { key: "rate_international_squad", provider: "Squad" },
      { key: "rate_international_stripe", provider: "Stripe" },
    ],
  },
];

/* ----------------------------- Helpers --------------------------- */

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
});

const getErrorMessage = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || "Something went wrong";
};

const toConfig = (r: Partial<Record<RateKey, unknown>>): RateConfig => {
  const out = { ...EMPTY };
  for (const k of RATE_KEYS) {
    const n = Number(r[k]);
    out[k] = Number.isFinite(n) ? n : 0;
  }
  return out;
};

const isValidRate = (n: number) => !Number.isNaN(n) && n >= 0 && n <= 100;

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* --------------------------- Rate field -------------------------- */

interface RateFieldProps {
  id: RateKey;
  provider: string;
  value: number;
  savedValue: number;
  lowest: boolean;
  onChange: (v: number) => void;
}

const RateField = ({ id, provider, value, savedValue, lowest, onChange }: RateFieldProps) => {
  const invalid = !isValidRate(value);
  const changed = !invalid && value !== savedValue;

  const tone = invalid
    ? "border-red-300 bg-red-50/50 focus-within:ring-red-200"
    : changed
    ? "border-amber-300 bg-amber-50/50 focus-within:ring-amber-200"
    : "border-slate-200 bg-white focus-within:border-indigo-400 focus-within:ring-indigo-100";

  return (
    <div className={`rounded-xl border p-4 transition focus-within:ring-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {provider}
        </label>
        {lowest && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            Lower fee
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.01}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? NaN : parseFloat(e.target.value))}
          className="w-full min-w-0 bg-transparent text-3xl font-semibold tabular-nums text-slate-900 outline-none"
        />
        <span className="text-lg font-medium text-slate-400">%</span>
      </div>

      <p
        className={`mt-2 h-4 text-xs ${
          invalid ? "text-red-600" : changed ? "text-amber-700" : "text-slate-400"
        }`}
      >
        {invalid ? "Enter a rate between 0 and 100" : changed ? `Was ${savedValue}%` : "Current rate"}
      </p>
    </div>
  );
};

/* ---------------------------- Component -------------------------- */

const RateCard = ({ onSave }: RateCardProps) => {
  const [recordId, setRecordId] = useState<number | null>(null);
  const [saved, setSaved] = useState<RateConfig>(EMPTY);
  const [data, setData] = useState<RateConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewAmount, setPreviewAmount] = useState("100000");

  /* GET /admin/rates */
  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ success: boolean; rates: ApiRate[] }>(
        "/admin/rates",
        authConfig()
      );
      const first = res.data.rates?.[0];
      if (first) {
        const cfg = toConfig(first);
        setRecordId(first.id);
        setSaved(cfg);
        setData(cfg);
      } else {
        setRecordId(null);
        setSaved(EMPTY);
        setData(EMPTY);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const changedKeys = useMemo(
    () => RATE_KEYS.filter((k) => data[k] !== saved[k]),
    [data, saved]
  );
  const isDirty = changedKeys.length > 0;
  const hasInvalid = RATE_KEYS.some((k) => !isValidRate(data[k]));
  const isNew = recordId === null;

  const setField = (key: RateKey, value: number) => {
    setSuccess(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  /* POST /admin/rates (first time) or PATCH /admin/rates/:id (changed fields only) */
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const snapshot = data;
    try {
      let res;
      if (recordId === null) {
        res = await axios.post("/admin/rates", snapshot, authConfig());
      } else {
        const patch = Object.fromEntries(changedKeys.map((k) => [k, snapshot[k]]));
        res = await axios.patch(`/admin/rates/${recordId}`, patch, authConfig());
      }

      const rate: ApiRate | undefined = res.data?.rate;
      const cfg = rate ? toConfig(rate) : snapshot;
      if (rate?.id) setRecordId(rate.id);
      setSaved(cfg);
      setData(cfg);
      setSuccess(true);
      await onSave?.(cfg);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* DELETE /admin/rates/:id (hard delete) */
  const handleDelete = async () => {
    if (recordId === null) return;
    setDeleting(true);
    setError(null);
    try {
      await axios.delete(`/admin/rates/${recordId}`, authConfig());
      setRecordId(null);
      setSaved(EMPTY);
      setData(EMPTY);
      setConfirmDelete(false);
      setSuccess(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setData(saved);
  };

  const amount = parseFloat(previewAmount);
  const amountOk = Number.isFinite(amount) && amount >= 0;

  /* ----------------------------- Loading ----------------------------- */

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-5xl animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="h-52 rounded-xl bg-slate-100" />
          <div className="h-52 rounded-xl bg-slate-100" />
        </div>
      </section>
    );
  }

  /* ------------------------------ Render ----------------------------- */

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Transaction rates</h2>
            {isDirty ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                {changedKeys.length} unsaved {changedKeys.length === 1 ? "change" : "changes"}
              </span>
            ) : success ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Saved
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            The percentage charged per payment, by route and payment provider.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || hasInvalid || saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : isNew ? "Create rates" : "Save changes"}
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchRates}
            className="shrink-0 font-medium underline hover:no-underline"
          >
            Reload
          </button>
        </div>
      )}

      {isNew && !error && (
        <div className="border-b border-indigo-100 bg-indigo-50 px-6 py-3 text-sm text-indigo-700">
          No rates have been configured yet. Set the four rates below and choose Create rates.
        </div>
      )}

      {/* Rate panels */}
      <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
        {ROUTES.map((route) => {
          const [a, b] = route.fields;
          const both = isValidRate(data[a.key]) && isValidRate(data[b.key]);
          const lowestKey =
            both && data[a.key] !== data[b.key]
              ? data[a.key] < data[b.key]
                ? a.key
                : b.key
              : null;

          return (
            <div key={route.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${route.accent}`} />
                <h3 className="text-sm font-semibold text-slate-900">{route.title}</h3>
                <span className="text-sm text-slate-400">{route.description}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {route.fields.map((f) => (
                  <RateField
                    key={f.key}
                    id={f.key}
                    provider={f.provider}
                    value={data[f.key]}
                    savedValue={saved[f.key]}
                    lowest={lowestKey === f.key}
                    onChange={(v) => setField(f.key, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fee preview */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Fee preview</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              See what a payment would cost with the rates above, including unsaved edits.
            </p>
          </div>
          <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
            <span className="text-sm text-slate-400">Amount</span>
            <input
              aria-label="Preview amount"
              type="number"
              min={0}
              value={previewAmount}
              onChange={(e) => setPreviewAmount(e.target.value)}
              className="w-36 bg-transparent py-2 pl-2 text-right text-sm tabular-nums text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROUTES.flatMap((route) =>
            route.fields.map((f) => {
              const rate = data[f.key];
              const ok = amountOk && isValidRate(rate);
              return (
                <div
                  key={f.key}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-xs text-slate-500">
                    {route.title} · {f.provider}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                    {ok ? money((amount * rate) / 100) : "—"}
                  </p>
                  <p className="text-xs tabular-nums text-slate-400">
                    {isValidRate(rate) ? `${rate}% of ${amountOk ? money(amount) : "—"}` : "Invalid rate"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Danger zone */}
      {!isNew && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p className="text-sm text-slate-500">
            Deleting removes the saved rates permanently. You can create them again afterwards.
          </p>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete rates
            </button>
          )}
        </footer>
      )}
    </section>
  );
};

export default RateCard;