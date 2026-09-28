/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";

import {
  MoreVertical,
  Search,
  ShieldCheck,
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

type EscrowStatus =
  | "CREATED"
  | "PARTIALLY_FUNDED"
  | "FUNDED"
  | "DELIVERED"
  | "RECEIVED"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED"
  | "CANCELLED";

interface EscrowUser {
  id: number;
  firstName: string;
  surname: string;
  email: string;
  phoneNumber: string;
}

interface EscrowTransaction {
  id: number;
  [key: string]: unknown;
}

interface Invoice {
  id: number;
  [key: string]: unknown;
}

interface EscrowWallet {
  id: number;

  creatorId: number;
  recipientId: number;

  amount: number;
  currentBalance: number;
  currency: string;

  status: EscrowStatus;

  escrowUprn: string;

  fundingTransactionId: number | null;
  releaseTransactionId: number | null;
  refundTransactionId: number | null;

  deliveryProofUrl: string | null;
  deliveryProofPublicId: string | null;

  sellerDeliveredAt: string | null;

  buyerReceived: boolean;
  buyerReceivedAt: string | null;

  buyerConfirmationProofUrl: string | null;
  buyerConfirmationProofPublicId: string | null;

  conditions: string;
  expiryDate: string | null;
  description: string;

  metadata: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;

  creator: EscrowUser;
  recipient: EscrowUser;

  escrowTransactions?: EscrowTransaction[];
  invoices?: Invoice[];
}

interface EscrowResponse {
  success: boolean;
  message: string;

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  count: number;

  escrows: EscrowWallet[];
}

const statuses: EscrowStatus[] = [
  "CREATED",
  "PARTIALLY_FUNDED",
  "FUNDED",
  "DELIVERED",
  "RECEIVED",
  "RELEASED",
  "REFUNDED",
  "DISPUTED",
  "CANCELLED",
];

const statusTone: Record<
  EscrowStatus,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  CREATED: "neutral",
  PARTIALLY_FUNDED: "warning",
  FUNDED: "warning",
  DELIVERED: "info",
  RECEIVED: "info",
  RELEASED: "success",
  REFUNDED: "neutral",
  DISPUTED: "danger",
  CANCELLED: "neutral",
};

const naira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string | null) => {
  if (!date) return "N/A";

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

const getUserName = (user?: EscrowUser) => {
  if (!user) return "N/A";

  return `${user.firstName} ${user.surname}`.trim();
};

const formatStatus = (status: EscrowStatus) => {
  switch (status) {
    case "PARTIALLY_FUNDED":
      return "Partially funded";

    case "FUNDED":
      return "Funded";

    case "DELIVERED":
      return "Delivered";

    case "RECEIVED":
      return "Received";

    case "RELEASED":
      return "Released";

    case "REFUNDED":
      return "Refunded";

    case "DISPUTED":
      return "Disputed";

    case "CANCELLED":
      return "Cancelled";

    case "CREATED":
      return "Created";

    default:
      return status;
  }
};

const Escrow = () => {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    EscrowStatus | "All"
  >("All");

  const [selected, setSelected] = useState<EscrowWallet | null>(null);

  const [escrows, setEscrows] = useState<EscrowWallet[]>([]);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("adminToken");

  const getEscrow = async () => {
    try {
      setLoading(true);

      const res = await axios.get<EscrowResponse>("/admin/escrows", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Admin escrows:", res.data);

      if (res.data.success) {
        setEscrows(res.data.escrows);
      }
    } catch (err) {
      console.log("Get escrows error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEscrow();
  }, []);

  const totals = useMemo(() => {
    const held = escrows
      .filter(
        (e) =>
          e.status === "FUNDED" ||
          e.status === "PARTIALLY_FUNDED" ||
          e.status === "DELIVERED" ||
          e.status === "RECEIVED"
      )
      .reduce((sum, e) => sum + e.currentBalance, 0);

    const disputed = escrows.filter(
      (e) => e.status === "DISPUTED"
    ).length;

    const released = escrows.filter(
      (e) => e.status === "RELEASED"
    ).length;

    return {
      held,
      disputed,
      released,
    };
  }, [escrows]);

  const filtered = escrows.filter((e) => {
    if (
      statusFilter !== "All" &&
      e.status !== statusFilter
    ) {
      return false;
    }

    const v = search.toLowerCase().trim();

    if (!v) return true;

    return [
      e.escrowUprn,
      e.description,
      e.creator?.firstName,
      e.creator?.surname,
      e.recipient?.firstName,
      e.recipient?.surname,
      e.creator?.email,
      e.recipient?.email,
      e.status,
    ]
      .filter(Boolean)
      .some((field) =>
        String(field).toLowerCase().includes(v)
      );
  });

  return (
    <div className="space-y-6">
      <PageIntro
        title="Escrow"
        description="Wallets, funding, releases, delivery codes and open disputes."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Wallets"
          value={String(escrows.length)}
          sub="Escrow wallets"
        />

        <StatCard
          label="Currently held"
          value={naira(totals.held)}
          sub="Funds currently in escrow"
        />

        <StatCard
          label="Released"
          value={String(totals.released)}
          sub="Funds fully released"
          tone="success"
        />

        <StatCard
          label="Disputed"
          value={String(totals.disputed)}
          sub="Needs operational review"
          tone="danger"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Toolbar
          count={filtered.length}
          label="Escrow wallets"
        >
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escrow ref, UPRN, job or name"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
        </Toolbar>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-4 py-3">
          {(["All", ...statuses] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === opt
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt === "All"
                ? "All"
                : formatStatus(opt)}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-245">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <TableHeader>Escrow</TableHeader>

                <TableHeader>Description</TableHeader>

                <TableHeader>Buyer</TableHeader>

                <TableHeader>Seller</TableHeader>

                <TableHeader>Funded / Balance</TableHeader>

                <TableHeader>Status</TableHeader>

                <TableHeader>Opened</TableHeader>

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
                    Loading escrow wallets...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No escrow wallets found"
                  hint="Try a different search or status filter."
                />
              ) : (
                filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        <Mono>{e.escrowUprn}</Mono>
                      </p>

                      <p className="text-xs text-slate-400">
                        ID {e.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {e.description}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getUserName(e.creator)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getUserName(e.recipient)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {naira(e.amount)}
                      </p>

                      <p className="text-xs text-slate-400">
                        {naira(e.currentBalance)} balance
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <Pill tone={statusTone[e.status]}>
                        {formatStatus(e.status)}
                      </Pill>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(e.createdAt)}
                    </td>

                    <td className="px-3">
                      <button
                        onClick={() => setSelected(e)}
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
            Showing {filtered.length} of {escrows.length} wallets
          </p>
        </div>
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Escrow details"
        description="Full wallet lifecycle information."
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {selected.escrowUprn}
                </p>

                <p className="text-xs text-slate-500">
                  Escrow ID {selected.id}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Description"
                value={selected.description}
              />

              <DetailItem
                label="Status"
                value={
                  <Pill tone={statusTone[selected.status]}>
                    {formatStatus(selected.status)}
                  </Pill>
                }
              />

              <DetailItem
                label="Buyer"
                value={getUserName(selected.creator)}
              />

              <DetailItem
                label="Seller"
                value={getUserName(selected.recipient)}
              />

              <DetailItem
                label="Buyer email"
                value={selected.creator?.email || "N/A"}
              />

              <DetailItem
                label="Seller email"
                value={selected.recipient?.email || "N/A"}
              />

              <DetailItem
                label="Buyer phone"
                value={
                  selected.creator?.phoneNumber || "N/A"
                }
              />

              <DetailItem
                label="Seller phone"
                value={
                  selected.recipient?.phoneNumber || "N/A"
                }
              />

              <DetailItem
                label="Amount"
                value={naira(selected.amount)}
              />

              <DetailItem
                label="Current balance"
                value={naira(selected.currentBalance)}
              />

              <DetailItem
                label="Currency"
                value={selected.currency}
              />

              <DetailItem
                label="Opened"
                value={formatDateTime(selected.createdAt)}
              />

              <DetailItem
                label="Last updated"
                value={formatDateTime(selected.updatedAt)}
              />

              <DetailItem
                label="Expiry date"
                value={formatDateTime(selected.expiryDate)}
              />

              <DetailItem
                label="Buyer received"
                value={
                  selected.buyerReceived
                    ? "Yes"
                    : "No"
                }
              />

              <DetailItem
                label="Buyer received at"
                value={formatDateTime(
                  selected.buyerReceivedAt
                )}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                Escrow conditions
              </p>

              <p className="text-sm leading-6 text-slate-600">
                {selected.conditions || "No conditions provided."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                Transaction references
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Funding transaction"
                  value={
                    selected.fundingTransactionId
                      ? String(
                          selected.fundingTransactionId
                        )
                      : "N/A"
                  }
                />

                <DetailItem
                  label="Release transaction"
                  value={
                    selected.releaseTransactionId
                      ? String(
                          selected.releaseTransactionId
                        )
                      : "N/A"
                  }
                />

                <DetailItem
                  label="Refund transaction"
                  value={
                    selected.refundTransactionId
                      ? String(
                          selected.refundTransactionId
                        )
                      : "N/A"
                  }
                />

                <DetailItem
                  label="Invoices"
                  value={String(
                    selected.invoices?.length || 0
                  )}
                />

                <DetailItem
                  label="Escrow transactions"
                  value={String(
                    selected.escrowTransactions?.length || 0
                  )}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                Delivery
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Seller delivered"
                  value={formatDateTime(
                    selected.sellerDeliveredAt
                  )}
                />

                <DetailItem
                  label="Buyer received"
                  value={
                    selected.buyerReceived
                      ? "Confirmed"
                      : "Not confirmed"
                  }
                />

                <DetailItem
                  label="Buyer confirmation"
                  value={formatDateTime(
                    selected.buyerReceivedAt
                  )}
                />

                <DetailItem
                  label="Delivery proof"
                  value={
                    selected.deliveryProofUrl
                      ? "Available"
                      : "Not uploaded"
                  }
                />
              </div>
            </div>

            {selected.deliveryProofUrl && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Seller delivery proof
                </p>

                <a
                  href={selected.deliveryProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  View delivery proof
                </a>
              </div>
            )}

            {selected.buyerConfirmationProofUrl && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Buyer confirmation proof
                </p>

                <a
                  href={selected.buyerConfirmationProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  View buyer confirmation proof
                </a>
              </div>
            )}

            {selected.status === "DISPUTED" && (
              <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertTriangle
                  size={19}
                  className="shrink-0 text-rose-600"
                />

                <p className="text-sm text-rose-800">
                  This escrow has an open dispute. Funds should
                  remain held until Escrow Operations resolves
                  the dispute.
                </p>
              </div>
            )}

            {(selected.status === "FUNDED" ||
              selected.status === "PARTIALLY_FUNDED" ||
              selected.status === "DELIVERED" ||
              selected.status === "RECEIVED") && (
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    console.log(
                      "Flag escrow for review:",
                      selected.id
                    );
                  }}
                >
                  Flag for review
                </button>

                <button
                  className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  onClick={() => {
                    console.log(
                      "Release remaining funds:",
                      selected.id
                    );
                  }}
                >
                  Release remaining funds
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Escrow;