/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";

import {
  MoreVertical,
  Search,
  FileText,
  AlertTriangle,
} from "lucide-react";

import axios from "../config/axiosconfig";

import Modal from "../components/UI/Modal";

import {
  PageIntro,
  StatCard,
  TableHeader,
  DetailItem,
  Pill,
  Toolbar,
  EmptyState,
  Mono,
} from "../components/UI/TableParts";

type Stage = "Pending" | "Accepted" | "Rejected";

interface RfqUser {
  id: number;
  surname: string;
  firstName: string;
  phoneNumber: string;
}

interface DeliveryAddress {
  city: string;
  state: string;
  street: string;
  country: string;
  phoneNumber: string;
  postal_code: string;
}

interface Rfq {
  id: number;
  quote_number: string;
  type: string;
  product_description: string;
  product_quantity: number;
  amount: number;
  currency: string;
  total: number;
  uprn: string;
  status: Stage;

  user_data: RfqUser;
  destinatary_user: RfqUser;

  delivery_code: string;
  delivery_type: string;
  trade_type: string;

  delivery_address: DeliveryAddress;

  arrival_date: string;
  arrival_time: string;

  line_total: number;
  delivery_charge: number;
  transaction_charges: number;
  subtotal: number;

  proof_delivery: number;

  coupon: unknown[];
  exchange_rate: number;

  responseNotificationDue: string | null;
  notificationSent: boolean;
  deletionNotificationSent: boolean;

  invoice: number | null;

  createdAt: string;
  updatedAt: string;
}

interface RfqResponse {
  success: boolean;
  message: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  count: number;
  rfqs: Rfq[];
}

const stages: Stage[] = ["Pending", "Accepted", "Rejected"];

const stageTone: Record<
  Stage,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  Pending: "warning",
  Accepted: "success",
  Rejected: "danger",
};

const naira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date: string | null) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getUserName = (user: RfqUser) => {
  if (!user) return "N/A";

  return `${user.firstName} ${user.surname}`.trim();
};

const RFQs = () => {
  const [search, setSearch] = useState("");

  const [stageFilter, setStageFilter] = useState<
    Stage | "All" | "Exceptions"
  >("All");

  const [selected, setSelected] = useState<Rfq | null>(null);

  const [rfqs, setRfqs] = useState<Rfq[]>([]);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("adminToken");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const getAllRfq = async () => {
    try {
      setLoading(true);

      const res = await axios.get<RfqResponse>("/admin/rfqs", authConfig);

      console.log("Admin RFQs:", res.data);

      if (res.data.success) {
        setRfqs(res.data.rfqs);
      }
    } catch (err) {
      console.log("Get all RFQs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllRfq();
  }, []);

  const counts = useMemo(
    () => ({
      active: rfqs.filter((r) => r.status === "Pending").length,

      completed: rfqs.filter((r) => r.status === "Accepted").length,

      exceptions: rfqs.filter((r) => r.status === "Rejected").length,
    }),
    [rfqs]
  );

  const filtered = rfqs.filter((r) => {
    if (stageFilter === "Exceptions" && r.status !== "Rejected") {
      return false;
    }

    if (
      stageFilter !== "All" &&
      stageFilter !== "Exceptions" &&
      r.status !== stageFilter
    ) {
      return false;
    }

    const v = search.toLowerCase().trim();

    if (!v) return true;

    const searchableFields = [
      r.quote_number,
      r.uprn,
      r.product_description,
      getUserName(r.user_data),
      getUserName(r.destinatary_user),
      r.status,
    ];

    return searchableFields.some((field) =>
      field?.toLowerCase().includes(v)
    );
  });

  return (
    <div className="space-y-6">
      <PageIntro
        title="RFQs"
        description="Quotation requests from raise to completion, including expired and disputed exceptions."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active RFQs"
          value={String(counts.active)}
          sub="Pending quotation requests"
        />

        <StatCard
          label="Completed"
          value={String(counts.completed)}
          sub="Accepted RFQs"
          tone="success"
        />

        <StatCard
          label="Exceptions"
          value={String(counts.exceptions)}
          sub="Rejected RFQs"
          tone="danger"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Toolbar count={filtered.length} label="All RFQs">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="RFQ ref, UPRN, product or name"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
        </Toolbar>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-4 py-3">
          {(["All", ...stages, "Exceptions"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setStageFilter(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                stageFilter === opt
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHeader>Reference</TableHeader>
                <TableHeader>Product</TableHeader>
                <TableHeader>Buyer</TableHeader>
                <TableHeader>Seller</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Stage</TableHeader>
                <TableHeader>Updated</TableHeader>
                <th className="w-12" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Loading RFQs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No RFQs found"
                  hint="Try a different search or stage filter."
                />
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        <Mono>{r.quote_number}</Mono>
                      </p>

                      <p className="text-xs text-slate-400">
                        UPRN <Mono>{r.uprn}</Mono>
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {r.product_description}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getUserName(r.user_data)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getUserName(r.destinatary_user)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {naira(r.total)}
                    </td>

                    <td className="px-5 py-4">
                      <Pill tone={stageTone[r.status]}>
                        {r.status}
                      </Pill>

                      {r.status === "Rejected" && (
                        <p className="mt-1 max-w-[16rem] text-xs text-rose-600">
                          RFQ was rejected and requires review.
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(r.updatedAt)}
                    </td>

                    <td className="px-3">
                      <button
                        onClick={() => setSelected(r)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {rfqs.length} RFQs
          </p>
        </div>
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="RFQ details"
        description="Full quotation record."
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <FileText size={20} />
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {selected.quote_number}
                </p>

                <p className="text-xs text-slate-500">
                  UPRN {selected.uprn}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Product"
                value={selected.product_description}
              />

              <DetailItem
                label="Value"
                value={naira(selected.total)}
              />

              <DetailItem
                label="Buyer"
                value={getUserName(selected.user_data)}
              />

              <DetailItem
                label="Seller"
                value={getUserName(selected.destinatary_user)}
              />

              <DetailItem
                label="Buyer phone"
                value={selected.user_data?.phoneNumber || "N/A"}
              />

              <DetailItem
                label="Seller phone"
                value={
                  selected.destinatary_user?.phoneNumber || "N/A"
                }
              />

              <DetailItem
                label="Raised"
                value={formatDateTime(selected.createdAt)}
              />

              <DetailItem
                label="Last updated"
                value={formatDateTime(selected.updatedAt)}
              />

              <DetailItem
                label="Stage"
                value={
                  <Pill tone={stageTone[selected.status]}>
                    {selected.status}
                  </Pill>
                }
              />

              <DetailItem
                label="Invoice"
                value={
                  selected.invoice
                    ? `Invoice #${selected.invoice}`
                    : "No invoice"
                }
              />

              <DetailItem
                label="Delivery type"
                value={selected.delivery_type}
              />

              <DetailItem
                label="Trade type"
                value={selected.trade_type}
              />

              <DetailItem
                label="Delivery code"
                value={selected.delivery_code}
              />

              <DetailItem
                label="Arrival date"
                value={formatDate(selected.arrival_date)}
              />

              <DetailItem
                label="Arrival time"
                value={selected.arrival_time}
              />

              <DetailItem
                label="Subtotal"
                value={naira(selected.subtotal)}
              />

              <DetailItem
                label="Delivery charge"
                value={naira(selected.delivery_charge)}
              />

              <DetailItem
                label="Transaction charges"
                value={naira(selected.transaction_charges)}
              />

              <DetailItem
                label="Exchange rate"
                value={String(selected.exchange_rate)}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                Delivery address
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Street"
                  value={selected.delivery_address?.street || "N/A"}
                />

                <DetailItem
                  label="City"
                  value={selected.delivery_address?.city || "N/A"}
                />

                <DetailItem
                  label="State"
                  value={selected.delivery_address?.state || "N/A"}
                />

                <DetailItem
                  label="Country"
                  value={selected.delivery_address?.country || "N/A"}
                />

                <DetailItem
                  label="Postal code"
                  value={
                    selected.delivery_address?.postal_code || "N/A"
                  }
                />

                <DetailItem
                  label="Phone"
                  value={
                    selected.delivery_address?.phoneNumber || "N/A"
                  }
                />
              </div>
            </div>

            {selected.status === "Rejected" && (
              <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertTriangle
                  size={19}
                  className="shrink-0 text-rose-600"
                />

                <p className="text-sm text-rose-800">
                  This RFQ was rejected and may require operational
                  review.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                Notification status
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Response notification"
                  value={
                    selected.notificationSent
                      ? "Sent"
                      : "Not sent"
                  }
                />

                <DetailItem
                  label="Deletion notification"
                  value={
                    selected.deletionNotificationSent
                      ? "Sent"
                      : "Not sent"
                  }
                />

                <DetailItem
                  label="Response due"
                  value={formatDateTime(
                    selected.responseNotificationDue
                  )}
                />

                <DetailItem
                  label="Proof delivery"
                  value={String(selected.proof_delivery)}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RFQs;