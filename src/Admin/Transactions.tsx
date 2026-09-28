/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  MoreVertical,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Wallet,
} from "lucide-react";

import Modal from "../components/UI/Modal";

import {
  PageIntro,
  TableHeader,
  DetailItem,
  Pill,
  Toolbar,
  EmptyState,
  Mono,
} from "../components/UI/TableParts";

import axios from "../config/axiosconfig";

/* =========================================================
   TYPES
========================================================= */

type TxType =
  | "Escrow funding"
  | "Invoice payment"
  | "Deposit"
  | "Withdrawal"
  | "Refund";

type TxStatus =
  | "Completed"
  | "Pending"
  | "Held"
  | "Failed"
  | "Reversed";

interface ApiTransaction {
  id: number;

  type: string;

  amount: string;
  fee: string;
  total: string;
  currency: string;

  status: string;

  senderWallet: number | null;
  senderId: number | null;

  recipientWallet: number | null;
  recipientId: number | null;

  reference: string;

  idempotencyKey: string;

  isUserAccountTransfer: boolean;

  staticUserUprn: string | null;

  description: string;

  externalReference: string;

  verificationStatus: string;

  verificationId: string | null;

  paymentMethod: string;

  paymentGateway: string;

  nameOnPaymentMethod: string | null;

  failureReason: string | null;

  metadata: Record<string, any>;

  createdAt: string;

  updatedAt: string;
}

interface Transaction {
  id: string;

  ppRef: string;

  type: TxType;

  amount: number;

  fee: number;

  total: number;

  currency: string;

  status: TxStatus;

  senderId: number | null;

  recipientId: number | null;

  senderWallet: number | null;

  recipientWallet: number | null;

  description: string;

  externalReference: string;

  idempotencyKey: string;

  paymentMethod: string;

  paymentGateway: string;

  verificationStatus: string;

  verificationId: string | null;

  nameOnPaymentMethod: string | null;

  failureReason: string | null;

  isUserAccountTransfer: boolean;

  staticUserUprn: string | null;

  metadata: Record<string, any>;

  date: string;

  updatedAt: string;
}

type StatusFilter = "All" | TxStatus;

/* =========================================================
   STATUS / TYPE CONFIG
========================================================= */

const statusTone: Record<
  TxStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  Completed: "success",
  Pending: "warning",
  Held: "warning",
  Failed: "danger",
  Reversed: "neutral",
};

const typeIcon: Record<TxType, ReactElement> = {
  "Escrow funding": (
    <ShieldCheck
      size={16}
      className="text-teal-600"
    />
  ),

  "Invoice payment": (
    <Receipt
      size={16}
      className="text-blue-600"
    />
  ),

  Deposit: (
    <ArrowDownLeft
      size={16}
      className="text-emerald-600"
    />
  ),

  Withdrawal: (
    <ArrowUpRight
      size={16}
      className="text-amber-600"
    />
  ),

  Refund: (
    <RotateCcw
      size={16}
      className="text-slate-500"
    />
  ),
};

const filterOptions: StatusFilter[] = [
  "All",
  "Completed",
  "Pending",
  "Held",
  "Failed",
  "Reversed",
];

/* =========================================================
   HELPERS
========================================================= */

const formatNaira = (
  amount: number,
  currency = "NGN"
) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: string) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const normalizeType = (
  type: string
): TxType => {
  switch (String(type).toLowerCase()) {
    case "escrow_funding":
      return "Escrow funding";

    case "invoice_payment":
      return "Invoice payment";

    case "deposit":
      return "Deposit";

    case "withdrawal":
      return "Withdrawal";

    case "refund":
      return "Refund";

    default:
      return "Deposit";
  }
};

const normalizeStatus = (
  status: string
): TxStatus => {
  switch (String(status).toLowerCase()) {
    case "success":
    case "completed":
      return "Completed";

    case "pending":
      return "Pending";

    case "held":
    case "funded":
      return "Held";

    case "failed":
    case "failure":
      return "Failed";

    case "reversed":
    case "cancelled":
    case "canceled":
      return "Reversed";

    default:
      return "Pending";
  }
};

const getTransactionUser = (
  transaction: ApiTransaction
) => {
  if (transaction.senderId !== null) {
    return `User #${transaction.senderId}`;
  }

  if (transaction.recipientId !== null) {
    return `User #${transaction.recipientId}`;
  }

  return "System";
};

/* =========================================================
   COMPONENT
========================================================= */

const Transactions = () => {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [openMenu, setOpenMenu] =
    useState<string | null>(null);

  const [selected, setSelected] =
    useState<Transaction | null>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     GET ALL TRANSACTIONS
  ========================================================= */

  const getAllTransactions =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const token =
          localStorage.getItem(
            "adminToken"
          );

        if (!token) {
          setError(
            "Admin authentication token not found."
          );

          return;
        }

        const response =
          await axios.get(
            "/admin/transactions/all",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        console.log(
          "Transactions API response:",
          response.data
        );

        const apiTransactions: ApiTransaction[] =
          response.data?.transactions ?? [];

        if (!Array.isArray(apiTransactions)) {
          throw new Error(
            "Invalid transaction response from server."
          );
        }

        const mappedTransactions: Transaction[] =
          apiTransactions.map(
            (transaction) => ({
              id: String(
                transaction.id
              ),

              ppRef:
                transaction.reference ||
                "N/A",

              type: normalizeType(
                transaction.type
              ),

              amount: Number(
                transaction.amount || 0
              ),

              fee: Number(
                transaction.fee || 0
              ),

              total: Number(
                transaction.total || 0
              ),

              currency:
                transaction.currency ||
                "NGN",

              status: normalizeStatus(
                transaction.status
              ),

              senderId:
                transaction.senderId,

              recipientId:
                transaction.recipientId,

              senderWallet:
                transaction.senderWallet,

              recipientWallet:
                transaction.recipientWallet,

              description:
                transaction.description ||
                "No description",

              externalReference:
                transaction.externalReference ||
                "N/A",

              idempotencyKey:
                transaction.idempotencyKey ||
                "N/A",

              paymentMethod:
                transaction.paymentMethod ||
                "N/A",

              paymentGateway:
                transaction.paymentGateway ||
                "N/A",

              verificationStatus:
                transaction.verificationStatus ||
                "N/A",

              verificationId:
                transaction.verificationId,

              nameOnPaymentMethod:
                transaction.nameOnPaymentMethod,

              failureReason:
                transaction.failureReason,

              isUserAccountTransfer:
                Boolean(
                  transaction.isUserAccountTransfer
                ),

              staticUserUprn:
                transaction.staticUserUprn,

              metadata:
                transaction.metadata || {},

              date:
                transaction.createdAt,

              updatedAt:
                transaction.updatedAt,
            })
          );

        setTransactions(
          mappedTransactions
        );
      } catch (err: any) {
        console.error(
          "Failed to load transactions:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load transactions."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    getAllTransactions();
  }, [getAllTransactions]);

  /* =========================================================
     SEARCH + FILTER
  ========================================================= */

  const filtered = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return transactions.filter(
      (transaction) => {
        if (
          statusFilter !== "All" &&
          transaction.status !==
            statusFilter
        ) {
          return false;
        }

        if (!searchValue) {
          return true;
        }

        return [
          transaction.ppRef,

          transaction.type,

          transaction.description,

          transaction.externalReference,

          transaction.paymentGateway,

          transaction.paymentMethod,

          transaction.status,

          transaction.currency,

          transaction.senderId !== null
            ? `user ${transaction.senderId}`
            : "",

          transaction.recipientId !== null
            ? `user ${transaction.recipientId}`
            : "",

          transaction.id,
        ].some((field) =>
          String(field)
            .toLowerCase()
            .includes(searchValue)
        );
      }
    );
  }, [
    transactions,
    search,
    statusFilter,
  ]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE INTRO
      ===================================================== */}

      <PageIntro
        title="Transactions"
        description="Search and manage the complete PatchPay transaction ledger."
      />

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <Toolbar
          count={filtered.length}
          label="Transaction ledger"
        >
          <div className="flex w-full gap-2 sm:max-w-xl">

            {/* SEARCH */}

            <div className="relative w-full">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search reference, description, user..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={
                getAllTransactions
              }
              disabled={loading}
              title="Refresh transactions"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

          </div>
        </Toolbar>

        {/* ===================================================
            STATUS FILTER
        =================================================== */}

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-4 py-3">

          {filterOptions.map(
            (option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    option
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === option
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option}
              </button>
            )
          )}

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-275">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50">

                <TableHeader>
                  Reference
                </TableHeader>

                <TableHeader>
                  User
                </TableHeader>

                <TableHeader>
                  Description
                </TableHeader>

                <TableHeader>
                  Type
                </TableHeader>

                <TableHeader>
                  Amount
                </TableHeader>

                <TableHeader>
                  Status
                </TableHeader>

                <TableHeader>
                  Date
                </TableHeader>

                <th className="w-12" />

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading ? (
                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >

                    <div className="flex flex-col items-center justify-center gap-3">

                      <RefreshCw
                        size={22}
                        className="animate-spin text-slate-400"
                      />

                      <p className="text-sm text-slate-500">
                        Loading transactions...
                      </p>

                    </div>

                  </td>

                </tr>
              ) : filtered.length ===
                0 ? (

                /* ===============================================
                   EMPTY
                =============================================== */

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-16"
                  >

                    <EmptyState
                      title="No transactions found"
                      hint={
                        transactions.length ===
                        0
                          ? "There are no transactions available yet."
                          : "Try clearing your search or changing the status filter."
                      }
                    />

                  </td>

                </tr>
              ) : (

                /* ===============================================
                   DATA
                =============================================== */

                filtered.map(
                  (transaction) => (

                    <tr
                      key={
                        transaction.id
                      }
                      className="hover:bg-slate-50/70"
                    >

                      {/* REFERENCE */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-semibold text-slate-900">

                          <Mono>
                            {
                              transaction.ppRef
                            }
                          </Mono>

                        </p>

                        <p className="mt-1 text-xs text-slate-400">

                          ID #
                          {
                            transaction.id
                          }

                        </p>

                      </td>

                      {/* USER */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-medium text-slate-900">

                          {getTransactionUser(
                            {
                              id:
                                Number(
                                  transaction.id
                                ),

                              type: transaction.type,

                              amount:
                                String(
                                  transaction.amount
                                ),

                              fee:
                                String(
                                  transaction.fee
                                ),

                              total:
                                String(
                                  transaction.total
                                ),

                              currency:
                                transaction.currency,

                              status:
                                transaction.status,

                              senderWallet:
                                transaction.senderWallet,

                              senderId:
                                transaction.senderId,

                              recipientWallet:
                                transaction.recipientWallet,

                              recipientId:
                                transaction.recipientId,

                              reference:
                                transaction.ppRef,

                              idempotencyKey:
                                transaction.idempotencyKey,

                              isUserAccountTransfer:
                                transaction.isUserAccountTransfer,

                              staticUserUprn:
                                transaction.staticUserUprn,

                              description:
                                transaction.description,

                              externalReference:
                                transaction.externalReference,

                              verificationStatus:
                                transaction.verificationStatus,

                              verificationId:
                                transaction.verificationId,

                              paymentMethod:
                                transaction.paymentMethod,

                              paymentGateway:
                                transaction.paymentGateway,

                              nameOnPaymentMethod:
                                transaction.nameOnPaymentMethod,

                              failureReason:
                                transaction.failureReason,

                              metadata:
                                transaction.metadata,

                              createdAt:
                                transaction.date,

                              updatedAt:
                                transaction.updatedAt,
                            }
                          )}

                        </p>

                        <p className="mt-1 text-xs text-slate-400">

                          Sender #
                          {
                            transaction.senderId ??
                            "—"
                          }

                          {" · "}

                          Recipient #
                          {
                            transaction.recipientId ??
                            "—"
                          }

                        </p>

                      </td>

                      {/* DESCRIPTION */}

                      <td className="max-w-xs px-5 py-4">

                        <p
                          className="truncate text-sm text-slate-600"
                          title={
                            transaction.description
                          }
                        >
                          {
                            transaction.description
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            transaction.paymentGateway
                          }
                        </p>

                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                          {
                            typeIcon[
                              transaction.type
                            ]
                          }

                          {
                            transaction.type
                          }

                        </div>

                      </td>

                      {/* AMOUNT */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-semibold text-slate-900">

                          {formatNaira(
                            transaction.amount,
                            transaction.currency
                          )}

                        </p>

                        <p className="mt-1 text-xs text-slate-400">

                          Fee{" "}
                          {formatNaira(
                            transaction.fee,
                            transaction.currency
                          )}

                        </p>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <Pill
                          tone={
                            statusTone[
                              transaction.status
                            ]
                          }
                        >
                          {
                            transaction.status
                          }
                        </Pill>

                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-sm text-slate-500">

                        {formatDate(
                          transaction.date
                        )}

                      </td>

                      {/* ACTION */}

                      <td className="relative px-3">

                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu ===
                                transaction.id
                                ? null
                                : transaction.id
                            )
                          }
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >

                          <MoreVertical
                            size={18}
                          />

                        </button>

                        {openMenu ===
                          transaction.id && (
                          <div className="absolute right-4 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">

                            <button
                              type="button"
                              onClick={() => {
                                setSelected(
                                  transaction
                                );

                                setOpenMenu(
                                  null
                                );
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >

                              <Eye
                                size={16}
                                className="text-slate-400"
                              />

                              View transaction

                            </button>

                          </div>
                        )}

                      </td>

                    </tr>

                  )
                )
              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">

          <p className="text-xs text-slate-500">

            Showing{" "}
            {filtered.length}{" "}
            of{" "}
            {transactions.length}{" "}
            transactions

          </p>

          {statusFilter !==
            "All" && (

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "All"
                )
              }
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Clear filter
            </button>

          )}

        </div>

      </div>

      {/* =====================================================
          TRANSACTION DETAILS MODAL
      ===================================================== */}

      <Modal
        isOpen={!!selected}
        onClose={() =>
          setSelected(null)
        }
        title="Transaction details"
        description="Full record for this PatchPay transaction."
        size="lg"
      >

        {selected && (

          <div className="space-y-6">

            {/* HEADER */}

            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">

              <div className="rounded-xl bg-teal-50 p-3 text-teal-600">

                {typeIcon[
                  selected.type
                ]}

              </div>

              <div>

                <p className="font-semibold text-slate-900">

                  {
                    selected.ppRef
                  }

                </p>

                <p className="text-xs text-slate-500">

                  Transaction #
                  {
                    selected.id
                  }

                </p>

              </div>

              <div className="ml-auto">

                <Pill
                  tone={
                    statusTone[
                      selected.status
                    ]
                  }
                >
                  {
                    selected.status
                  }
                </Pill>

              </div>

            </div>

            {/* TRANSACTION INFORMATION */}

            <div className="grid gap-5 sm:grid-cols-2">

              <DetailItem
                label="Transaction ID"
                value={
                  selected.id
                }
              />

              <DetailItem
                label="Reference"
                value={
                  selected.ppRef
                }
              />

              <DetailItem
                label="Transaction type"
                value={
                  selected.type
                }
              />

              <DetailItem
                label="Status"
                value={
                  <Pill
                    tone={
                      statusTone[
                        selected.status
                      ]
                    }
                  >
                    {
                      selected.status
                    }
                  </Pill>
                }
              />

              <DetailItem
                label="Amount"
                value={formatNaira(
                  selected.amount,
                  selected.currency
                )}
              />

              <DetailItem
                label="Fee"
                value={formatNaira(
                  selected.fee,
                  selected.currency
                )}
              />

              <DetailItem
                label="Total"
                value={formatNaira(
                  selected.total,
                  selected.currency
                )}
              />

              <DetailItem
                label="Currency"
                value={
                  selected.currency
                }
              />

              <DetailItem
                label="Sender"
                value={
                  selected.senderId !==
                  null
                    ? `User #${selected.senderId}`
                    : "—"
                }
              />

              <DetailItem
                label="Recipient"
                value={
                  selected.recipientId !==
                  null
                    ? `User #${selected.recipientId}`
                    : "—"
                }
              />

              <DetailItem
                label="Sender wallet"
                value={
                  selected.senderWallet !==
                  null
                    ? `Wallet #${selected.senderWallet}`
                    : "—"
                }
              />

              <DetailItem
                label="Recipient wallet"
                value={
                  selected.recipientWallet !==
                  null
                    ? `Wallet #${selected.recipientWallet}`
                    : "—"
                }
              />

              <DetailItem
                label="Payment method"
                value={
                  selected.paymentMethod
                }
              />

              <DetailItem
                label="Payment gateway"
                value={
                  selected.paymentGateway
                }
              />

              <DetailItem
                label="Verification"
                value={
                  selected.verificationStatus
                }
              />

              <DetailItem
                label="User account transfer"
                value={
                  selected.isUserAccountTransfer
                    ? "Yes"
                    : "No"
                }
              />

              <DetailItem
                label="External reference"
                value={
                  selected.externalReference
                }
              />

              <DetailItem
                label="Date"
                value={formatDate(
                  selected.date
                )}
              />

              <DetailItem
                label="Last updated"
                value={formatDate(
                  selected.updatedAt
                )}
              />

            </div>

            {/* DESCRIPTION */}

            <div className="rounded-xl border border-slate-200 p-4">

              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="text-sm text-slate-700">
                {
                  selected.description
                }
              </p>

            </div>

            {/* FAILURE REASON */}

            {selected.failureReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-500">
                  Failure reason
                </p>

                <p className="text-sm text-red-700">
                  {
                    selected.failureReason
                  }
                </p>

              </div>
            )}

            {/* METADATA */}

            {Object.keys(
              selected.metadata || {}
            ).length > 0 && (

              <div className="rounded-xl border border-slate-200 p-4">

                <div className="mb-3 flex items-center gap-2">

                  <Wallet
                    size={16}
                    className="text-slate-400"
                  />

                  <p className="text-sm font-semibold text-slate-900">
                    Transaction metadata
                  </p>

                </div>

                <div className="space-y-2">

                  {Object.entries(
                    selected.metadata
                  ).map(
                    ([key, value]) => (

                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-0"
                      >

                        <span className="text-xs text-slate-500">
                          {key}
                        </span>

                        <span className="text-right text-xs font-medium text-slate-700">
                          {typeof value ===
                          "object"
                            ? JSON.stringify(
                                value
                              )
                            : String(
                                value
                              )}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {/* IDEMPOTENCY KEY */}

            <div className="rounded-xl bg-slate-50 p-4">

              <div className="flex items-center gap-2">

                <CreditCard
                  size={16}
                  className="text-slate-400"
                />

                <p className="text-xs font-medium text-slate-500">
                  Idempotency key
                </p>

              </div>

              <p className="mt-2 break-all font-mono text-xs text-slate-600">
                {
                  selected.idempotencyKey
                }
              </p>

            </div>

          </div>

        )}

      </Modal>

    </div>
  );
};

export default Transactions;