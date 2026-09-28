import { useMemo, useState } from "react";

/* ----------------------------- Types ----------------------------- */

export type UserType = "Personal" | "Business" | "NGO" | "Government Org";

export interface UserTypeRate {
  userType: UserType;
  baseRate: number; // %
  minTransaction: number; // number of transactions
  perCountry: number; // % charge rate per country
  perContinentCountries: number; // % across countries per continent
  acrossContinents: number; // % across continents
}

export interface AmountPercent {
  amount: number;
  percent: number;
}

export interface BankCharges {
  perCountry: AmountPercent;
  perContinentCountries: AmountPercent;
  acrossContinents: AmountPercent;
}

export interface ExchangeRateConfig {
  source: string; // feed provider, e.g. "Central bank feed"
  margin: number; // % added on top of the feed rate
}

export interface RateCardData {
  rates: UserTypeRate[];
  bankCharges: BankCharges;
  exchangeRate: ExchangeRateConfig;
}

interface RateCardProps {
  initialData?: RateCardData;
  onSave?: (data: RateCardData) => void | Promise<void>;
}

/* ---------------------------- Defaults --------------------------- */

const CONTINENTS = [
  "Africa",
  "Asia",
  "North America",
  "South America",
  "Antarctica",
  "Australia",
  "Europe",
];

const DEFAULT_DATA: RateCardData = {
  rates: [
    { userType: "Personal", baseRate: 1.5, minTransaction: 0, perCountry: 1.5, perContinentCountries: 3, acrossContinents: 5 },
    { userType: "Business", baseRate: 1.5, minTransaction: 10, perCountry: 4, perContinentCountries: 8, acrossContinents: 10 },
    { userType: "NGO", baseRate: 1.5, minTransaction: 10, perCountry: 3, perContinentCountries: 6, acrossContinents: 6 },
    { userType: "Government Org", baseRate: 1.5, minTransaction: 5, perCountry: 5, perContinentCountries: 10, acrossContinents: 15 },
  ],
  bankCharges: {
    perCountry: { amount: 0, percent: 0 },
    perContinentCountries: { amount: 0, percent: 0 },
    acrossContinents: { amount: 0, percent: 0 },
  },
  exchangeRate: { source: "Live exchange rate feed", margin: 0 },
};

/* --------------------------- Small inputs ------------------------ */

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
  min?: number;
  max?: number;
  label: string;
}

const NumberField = ({
  value,
  onChange,
  suffix,
  prefix,
  step = 0.01,
  min = 0,
  max,
  label,
}: NumberFieldProps) => (
  <div className="flex items-center rounded-md border border-slate-300 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
    {prefix && <span className="pl-2.5 text-sm text-slate-500">{prefix}</span>}
    <input
      type="number"
      aria-label={label}
      value={Number.isNaN(value) ? "" : value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === "" ? NaN : parseFloat(e.target.value))}
      className="w-full min-w-0 bg-transparent px-2.5 py-1.5 text-right text-sm tabular-nums text-slate-900 outline-none"
    />
    {suffix && <span className="pr-2.5 text-sm text-slate-500">{suffix}</span>}
  </div>
);

const AmountPercentField = ({
  value,
  onChange,
  label,
}: {
  value: AmountPercent;
  onChange: (v: AmountPercent) => void;
  label: string;
}) => (
  <div className="flex items-center gap-1.5">
    <NumberField
      label={`${label} amount`}
      prefix="$"
      value={value.amount}
      onChange={(amount) => onChange({ ...value, amount })}
    />
    <span className="text-sm text-slate-400">+</span>
    <NumberField
      label={`${label} percent`}
      suffix="%"
      value={value.percent}
      onChange={(percent) => onChange({ ...value, percent })}
    />
  </div>
);

/* ---------------------------- Component -------------------------- */

const RateCard = ({ initialData = DEFAULT_DATA, onSave }: RateCardProps) => {
  const [saved, setSaved] = useState<RateCardData>(initialData);
  const [data, setData] = useState<RateCardData>(initialData);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(saved),
    [data, saved]
  );

  const hasInvalid = useMemo(() => {
    const nums: number[] = [
      ...data.rates.flatMap((r) => [
        r.baseRate,
        r.minTransaction,
        r.perCountry,
        r.perContinentCountries,
        r.acrossContinents,
      ]),
      ...Object.values(data.bankCharges).flatMap((b) => [b.amount, b.percent]),
      data.exchangeRate.margin,
    ];
    return nums.some((n) => Number.isNaN(n) || n < 0);
  }, [data]);

  const updateRate = (index: number, patch: Partial<UserTypeRate>) =>
    setData((prev) => ({
      ...prev,
      rates: prev.rates.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));

  const updateBank = (key: keyof BankCharges, value: AmountPercent) =>
    setData((prev) => ({
      ...prev,
      bankCharges: { ...prev.bankCharges, [key]: value },
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(data);
      setSaved(data);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setData(saved);

  const th = "px-3 py-3 text-left text-xs font-semibold text-slate-600 align-bottom";
  const td = "px-3 py-2 align-middle";

  return (
    <section className="mx-auto w-full max-w-6xl rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Transaction rate card
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Set what each customer type pays. Changes apply to new transactions
            after you save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-sm text-amber-600">Unsaved changes</span>
          )}
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || hasInvalid || saving}
            className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save rates"}
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-215 border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={`${th} w-44`}>Customer type</th>
              <th className={`${th} w-32`}>Base rate</th>
              <th className={`${th} w-36`}>Min. transactions</th>
              <th className={th}>Charge rate per country</th>
              <th className={th}>Rate across countries per continent</th>
              <th className={th}>
                Rate across continents
                <span className="mt-1 block text-[11px] font-normal leading-snug text-slate-500">
                  {CONTINENTS.join(", ")}
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.rates.map((row, i) => (
              <tr key={row.userType} className="hover:bg-slate-50/60">
                <th scope="row" className={`${td} text-left font-medium text-slate-900`}>
                  {row.userType}
                </th>
                <td className={td}>
                  <NumberField
                    label={`${row.userType} base rate`}
                    suffix="%"
                    value={row.baseRate}
                    onChange={(v) => updateRate(i, { baseRate: v })}
                  />
                </td>
                <td className={td}>
                  <NumberField
                    label={`${row.userType} minimum transactions`}
                    step={1}
                    value={row.minTransaction}
                    onChange={(v) => updateRate(i, { minTransaction: v })}
                  />
                </td>
                <td className={td}>
                  <NumberField
                    label={`${row.userType} charge rate per country`}
                    suffix="%"
                    value={row.perCountry}
                    onChange={(v) => updateRate(i, { perCountry: v })}
                  />
                </td>
                <td className={td}>
                  <NumberField
                    label={`${row.userType} rate across countries per continent`}
                    suffix="%"
                    value={row.perContinentCountries}
                    onChange={(v) => updateRate(i, { perContinentCountries: v })}
                  />
                </td>
                <td className={td}>
                  <NumberField
                    label={`${row.userType} rate across continents`}
                    suffix="%"
                    value={row.acrossContinents}
                    onChange={(v) => updateRate(i, { acrossContinents: v })}
                  />
                </td>
              </tr>
            ))}

            {/* Bank charges: amount + % */}
            <tr className="border-t-2 border-slate-200 bg-slate-50/50">
              <th scope="row" className={`${td} text-left font-medium text-slate-900`}>
                Bank charges
                <span className="block text-xs font-normal text-slate-500">
                  Charged by the bank (amount + %)
                </span>
              </th>
              <td className={td} />
              <td className={td} />
              <td className={td}>
                <AmountPercentField
                  label="Bank charge per country"
                  value={data.bankCharges.perCountry}
                  onChange={(v) => updateBank("perCountry", v)}
                />
              </td>
              <td className={td}>
                <AmountPercentField
                  label="Bank charge across countries per continent"
                  value={data.bankCharges.perContinentCountries}
                  onChange={(v) => updateBank("perContinentCountries", v)}
                />
              </td>
              <td className={td}>
                <AmountPercentField
                  label="Bank charge across continents"
                  value={data.bankCharges.acrossContinents}
                  onChange={(v) => updateBank("acrossContinents", v)}
                />
              </td>
            </tr>

            {/* Exchange rate */}
            <tr className="bg-slate-50/50">
              <th scope="row" className={`${td} text-left font-medium text-slate-900`}>
                Exchange rate
                <span className="block text-xs font-normal text-slate-500">
                  Pulled from a live feed
                </span>
              </th>
              <td className={td} colSpan={2}>
                <input
                  type="text"
                  aria-label="Exchange rate feed source"
                  value={data.exchangeRate.source}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      exchangeRate: { ...p.exchangeRate, source: e.target.value },
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </td>
              <td className={td} colSpan={3}>
                <div className="flex items-center gap-3">
                  <div className="w-36">
                    <NumberField
                      label="Exchange rate margin"
                      suffix="%"
                      value={data.exchangeRate.margin}
                      onChange={(v) =>
                        setData((p) => ({
                          ...p,
                          exchangeRate: { ...p.exchangeRate, margin: v },
                        }))
                      }
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    Margin added on top of the feed rate
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {hasInvalid && (
        <p className="border-t border-slate-200 px-6 py-3 text-sm text-red-600">
          Every field needs a number of 0 or more before you can save.
        </p>
      )}
    </section>
  );
};

export default RateCard;