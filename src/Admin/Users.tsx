/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import {
  MoreVertical,
  Search,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

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
} from "../components/UI/TableParts";

type UserStatus = "Active" | "Inactive" | "Suspended";

type User = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  surname: string | null;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  accountType: string | null;
  statusClient: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserStats = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
};

type StatusFilter = "All" | UserStatus;

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [selected, setSelected] = useState<User | null>(null);

  const [modal, setModal] = useState<
    "view" | "suspend" | "reinstate" | "delete" | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("adminToken");

  /**
   * Common authorization headers
   */
  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  /**
   * Fetch users
   */
  const getUsers = async () => {
    try {
      const res = await axios.get("/admin/users", authConfig);

      if (res.data?.success) {
        setUsers(res.data.users || []);
      } else {
        toast.error(res.data?.message || "Failed to fetch users");
      }
    } catch (error: any) {
      console.error("Get users error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch users"
      );
    }
  };

  /**
   * Fetch user statistics
   */
  const getUserStats = async () => {
    try {
      const res = await axios.get(
        "/admin/users/stats",
        authConfig
      );

      if (res.data?.success) {
        setStats(
          res.data.stats || {
            total: 0,
            active: 0,
            inactive: 0,
            suspended: 0,
          }
        );
      } else {
        toast.error(
          res.data?.message ||
            "Failed to fetch user statistics"
        );
      }
    } catch (error: any) {
      console.error("Get user stats error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch user statistics"
      );
    }
  };

  /**
   * Load users + statistics
   */
  const loadUsers = async () => {
    setLoading(true);

    try {
      await Promise.all([
        getUsers(),
        getUserStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Search + status filtering
   */
  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (
        statusFilter !== "All" &&
        user.statusClient !== statusFilter
      ) {
        return false;
      }

      const searchValue = search.toLowerCase().trim();

      if (!searchValue) {
        return true;
      }

      const fullName = [
        user.firstName,
        user.lastName,
        user.surname,
      ]
        .filter(Boolean)
        .join(" ");

      return [
        fullName,
        user.email,
        user.phoneNumber,
        user.country,
        user.accountType,
        String(user.id),
      ].some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [users, search, statusFilter]);

  /**
   * Format user name
   */
  const getUserName = (user: User) => {
    const name = [
      user.firstName,
      user.lastName,
      user.surname,
    ]
      .filter(Boolean)
      .join(" ");

    return name || "Unnamed user";
  };

  /**
   * Get user initials
   */
  const getInitials = (user: User) => {
    const name = getUserName(user);

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  /**
   * Format dates
   */
  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Open modal
   */
  const openModal = (
    type:
      | "view"
      | "suspend"
      | "reinstate"
      | "delete",
    user: User
  ) => {
    setSelected(user);
    setModal(type);
    setOpenMenu(null);
  };

  /**
   * Close modal
   */
  const close = () => {
    if (actionLoading) return;

    setModal(null);
    setSelected(null);
  };

  /**
   * Suspend user
   */
  const suspendUser = async () => {
    if (!selected) return;

    setActionLoading(true);

    try {
      const res = await axios.patch(
        `/admin/users/${selected.id}/suspend`,
        {},
        authConfig
      );

      if (res.data?.success) {
        toast.success(
          res.data.message || "User suspended successfully"
        );

        close();

        await loadUsers();
      } else {
        toast.error(
          res.data?.message || "Failed to suspend user"
        );
      }
    } catch (error: any) {
      console.error("Suspend user error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to suspend user"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Reinstate user
   */
  const reinstateUser = async () => {
    if (!selected) return;

    setActionLoading(true);

    try {
      const res = await axios.patch(
        `/admin/users/${selected.id}/reinstate`,
        {},
        authConfig
      );

      if (res.data?.success) {
        toast.success(
          res.data.message ||
            "User reinstated successfully"
        );

        close();

        await loadUsers();
      } else {
        toast.error(
          res.data?.message ||
            "Failed to reinstate user"
        );
      }
    } catch (error: any) {
      console.error("Reinstate user error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to reinstate user"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Delete user
   */
  const deleteUser = async () => {
    if (!selected) return;

    setActionLoading(true);

    try {
      const res = await axios.delete(
        `/admin/users/${selected.id}`,
        authConfig
      );

      if (res.data?.success) {
        toast.success(
          res.data.message ||
            "User deleted successfully"
        );

        close();

        await loadUsers();
      } else {
        toast.error(
          res.data?.message ||
            "Failed to delete user"
        );
      }
    } catch (error: any) {
      console.error("Delete user error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to delete user"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Get single user
   */
  const getUserById = async (userId: number) => {
    try {
      const res = await axios.get(
        `/admin/users/${userId}`,
        authConfig
      );

      if (res.data?.success) {
        setSelected(res.data.user);
      } else {
        toast.error(
          res.data?.message ||
            "Failed to fetch user"
        );
      }
    } catch (error: any) {
      console.error("Get user error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch user"
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        title="Users"
        description="Homeowners, tradespeople and agents registered on PatchPay."
      />

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() =>
            setStatusFilter(
              statusFilter === "Active"
                ? "All"
                : "Active"
            )
          }
          className="text-left"
          disabled={loading}
        >
          <StatCard
            label="Active"
            value={String(stats.active)}
            sub="Currently active users"
            tone="success"
          />
        </button>

        <button
          onClick={() =>
            setStatusFilter(
              statusFilter === "Inactive"
                ? "All"
                : "Inactive"
            )
          }
          className="text-left"
          disabled={loading}
        >
          <StatCard
            label="Inactive"
            value={String(stats.inactive)}
            sub="Currently inactive users"
          />
        </button>

        <button
          onClick={() =>
            setStatusFilter(
              statusFilter === "Suspended"
                ? "All"
                : "Suspended"
            )
          }
          className="text-left"
          disabled={loading}
        >
          <StatCard
            label="Suspended"
            value={String(stats.suspended)}
            sub="Access currently restricted"
            tone="danger"
          />
        </button>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Toolbar count={filtered.length} label="All users">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, email, phone or country"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>
        </Toolbar>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-100 items-center justify-center">
              <LoaderCircle
                size={32}
                className="animate-spin text-[#25166B]"
              />
            </div>
          ) : (
            <table className="w-full min-w-220">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <TableHeader>User</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Verification</TableHeader>
                  <TableHeader>Joined</TableHeader>
                  <TableHeader>Updated</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <th className="w-12" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <EmptyState
                    title="No users found"
                    hint="Try a different search term or filter."
                  />
                )}

                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                          {getInitials(user)}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {getUserName(user)}
                          </p>

                          <p className="text-xs text-slate-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.accountType || "—"}
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.country || "—"}
                    </td>

                    {/* Verification */}
                    <td className="px-5 py-4">
                      {user.emailVerified ? (
                        <Pill tone="success">
                          Verified
                        </Pill>
                      ) : (
                        <Pill tone="warning">
                          Unverified
                        </Pill>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Updated */}
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(user.updatedAt)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Pill
                        tone={
                          user.statusClient ===
                          "Active"
                            ? "success"
                            : user.statusClient ===
                              "Suspended"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {user.statusClient}
                      </Pill>
                    </td>

                    {/* Actions */}
                    <td className="relative px-3 py-4">
                      <button
                        onClick={() =>
                          setOpenMenu(
                            openMenu === user.id
                              ? null
                              : user.id
                          )
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Actions for ${getUserName(
                          user
                        )}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === user.id && (
                        <div className="absolute right-4 top-12 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          <button
                            onClick={() => {
                              openModal("view", user);
                              getUserById(user.id);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye
                              size={16}
                              className="text-slate-400"
                            />
                            View account
                          </button>

                          {user.statusClient !==
                          "Suspended" ? (
                            <button
                              onClick={() =>
                                openModal(
                                  "suspend",
                                  user
                                )
                              }
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-amber-700 hover:bg-amber-50"
                            >
                              <UserX size={16} />
                              Suspend user
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                openModal(
                                  "reinstate",
                                  user
                                )
                              }
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                            >
                              <UserCheck size={16} />
                              Reinstate user
                            </button>
                          )}

                          <button
                            onClick={() =>
                              openModal(
                                "delete",
                                user
                              )
                            }
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                            Delete account
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing {filtered.length} of{" "}
              {users.length} users
            </p>
          </div>
        )}
      </div>

      {/* View User */}
      <Modal
        isOpen={modal === "view"}
        onClose={close}
        title="User account"
        description="Account details and standing."
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700">
                {getInitials(selected)}
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  {getUserName(selected)}
                </h3>

                <p className="text-sm text-slate-500">
                  #{selected.id} ·{" "}
                  {selected.accountType || "User"}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Email"
                value={selected.email}
              />

              <DetailItem
                label="Phone number"
                value={selected.phoneNumber || "—"}
              />

              <DetailItem
                label="Country"
                value={selected.country || "—"}
              />

              <DetailItem
                label="Account type"
                value={
                  selected.accountType || "—"
                }
              />

              <DetailItem
                label="Joined"
                value={formatDate(
                  selected.createdAt
                )}
              />

              <DetailItem
                label="Last updated"
                value={formatDate(
                  selected.updatedAt
                )}
              />

              <DetailItem
                label="Email verification"
                value={
                  selected.emailVerified ? (
                    <Pill tone="success">
                      Verified
                    </Pill>
                  ) : (
                    <Pill tone="warning">
                      Unverified
                    </Pill>
                  )
                }
              />

              <DetailItem
                label="Status"
                value={
                  <Pill
                    tone={
                      selected.statusClient ===
                      "Active"
                        ? "success"
                        : selected.statusClient ===
                          "Suspended"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {selected.statusClient}
                  </Pill>
                }
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Suspend */}
      <Modal
        isOpen={modal === "suspend"}
        onClose={close}
        title="Suspend user"
        description="This restricts the user's access to PatchPay immediately."
        size="sm"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle
                size={20}
                className="shrink-0 text-amber-600"
              />

              <p className="text-sm leading-5 text-amber-800">
                Suspending{" "}
                <strong>
                  {getUserName(selected)}
                </strong>{" "}
                will restrict their PatchPay access.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={close}
                disabled={actionLoading}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={suspendUser}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                Suspend user
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reinstate */}
      <Modal
        isOpen={modal === "reinstate"}
        onClose={close}
        title="Reinstate user"
        description="This restores full platform access."
        size="sm"
      >
        {selected && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Reinstate{" "}
              <strong>
                {getUserName(selected)}
              </strong>
              ? Their account status will be changed
              back to Active.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={close}
                disabled={actionLoading}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={reinstateUser}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                Reinstate user
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal
        isOpen={modal === "delete"}
        onClose={close}
        title="Delete account"
        description="This cannot be undone."
        size="sm"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <Trash2
                size={20}
                className="shrink-0 text-rose-600"
              />

              <p className="text-sm leading-5 text-rose-800">
                You're about to permanently delete{" "}
                <strong>
                  {getUserName(selected)}
                </strong>
                's account.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={close}
                disabled={actionLoading}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={deleteUser}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                Delete account
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;

