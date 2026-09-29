/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import axios from "../config/axiosconfig";

/* ----------------------------- Types ----------------------------- */

export type Module =
  | "rateCard"
  | "promotions"
  | "users"
  | "transactions"
  | "reports";

export type Level = "none" | "view" | "edit";

export type AdminStatus = "Active" | "Invited" | "Suspended";

export type Role = "Super admin" | "Admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AdminStatus;
  lastActive: string;
  permissions: Record<Module, Level>;
}

export interface SecuritySettings {
  require2FA: boolean;
  sessionMinutes: number;
  maxFailedLogins: number;
  ipAllowlist: string;
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  maxSingleTransaction: number;
  approvalThresholdPercent: number;
  requireApprovalForPromos: boolean;
}

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  at: string;
}

interface SettingsProps {
  currentUser?: AdminUser;
  initialAdmins?: AdminUser[];
  initialSecurity?: SecuritySettings;
  initialPlatform?: PlatformSettings;
  onInviteAdmin?: (admin: AdminUser) => void | Promise<void>;
  onUpdateAdmin?: (admin: AdminUser) => void | Promise<void>;
  onRemoveAdmin?: (id: string) => void | Promise<void>;
  onTransferOwnership?: (toAdminId: string) => void | Promise<void>;
  onSaveSecurity?: (s: SecuritySettings) => void | Promise<void>;
  onSavePlatform?: (p: PlatformSettings) => void | Promise<void>;
}

/* ---------------------------- Constants -------------------------- */

const MODULES: {
  key: Module;
  label: string;
  hint: string;
}[] = [
  {
    key: "rateCard",
    label: "Rate card",
    hint: "Fees, base rates and exchange margins",
  },
  {
    key: "promotions",
    label: "Promotions",
    hint: "Promo codes and discounts",
  },
  {
    key: "users",
    label: "Users",
    hint: "Customer accounts and verification",
  },
  {
    key: "transactions",
    label: "Transactions",
    hint: "Payments, refunds and disputes",
  },
  {
    key: "reports",
    label: "Reports",
    hint: "Revenue and activity exports",
  },
];

const noAccess = (): Record<Module, Level> => ({
  rateCard: "none",
  promotions: "none",
  users: "none",
  transactions: "none",
  reports: "none",
});

const PRESETS: {
  name: string;
  permissions: Record<Module, Level>;
}[] = [
  {
    name: "Support",
    permissions: {
      ...noAccess(),
      users: "edit",
      transactions: "view",
    },
  },
  {
    name: "Finance",
    permissions: {
      ...noAccess(),
      rateCard: "edit",
      transactions: "edit",
      reports: "view",
    },
  },
  {
    name: "Marketing",
    permissions: {
      ...noAccess(),
      promotions: "edit",
      reports: "view",
    },
  },
  {
    name: "View only",
    permissions: {
      rateCard: "view",
      promotions: "view",
      users: "view",
      transactions: "view",
      reports: "view",
    },
  },
];

const now = () => new Date().toLocaleString();

/*
 * Default admin.
 *
 * This is only used while the /admin/auth/me request is loading
 * or if no currentUser prop is provided.
 */
const DEFAULT_ADMIN: AdminUser = {
  id: "",
  name: "Loading...",
  email: "",
  role: "Admin",
  status: "Active",
  lastActive: "Now",
  permissions: {
    rateCard: "edit",
    promotions: "edit",
    users: "edit",
    transactions: "edit",
    reports: "edit",
  },
};

const DEFAULT_ADMINS: AdminUser[] = [];

const DEFAULT_SECURITY: SecuritySettings = {
  require2FA: true,
  sessionMinutes: 30,
  maxFailedLogins: 5,
  ipAllowlist: "",
};

const DEFAULT_PLATFORM: PlatformSettings = {
  maintenanceMode: false,
  maxSingleTransaction: 10000,
  approvalThresholdPercent: 2,
  requireApprovalForPromos: false,
};

/* ---------------------------- Small UI --------------------------- */

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500";

const btnPrimary =
  "rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40";

const btnGhost =
  "rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

const Card = ({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <header className="border-b border-slate-200 px-6 py-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>

      {description && (
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      )}
    </header>

    <div className="p-6">{children}</div>

    {footer && (
      <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
        {footer}
      </footer>
    )}
  </section>
);

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
    <span className="mb-1 block text-sm font-medium text-slate-700">
      {label}
    </span>

    {children}

    {hint && (
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    )}
  </label>
);

const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-start justify-between gap-6 py-3">
    <div>
      <p className="text-sm font-medium text-slate-900">{label}</p>

      {description && (
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      )}
    </div>

    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  </div>
);

const STATUS_STYLE: Record<AdminStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Invited: "bg-sky-50 text-sky-700 ring-sky-200",
  Suspended: "bg-amber-50 text-amber-700 ring-amber-200",
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ---------------------------- Component -------------------------- */

type Tab =
  | "profile"
  | "admins"
  | "security"
  | "platform"
  | "audit";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "My profile" },
  { key: "admins", label: "Admins & permissions" },
  { key: "security", label: "Security" },
  { key: "platform", label: "Platform controls" },
  { key: "audit", label: "Audit log" },
];

const Settings = ({
  currentUser,
  initialAdmins = DEFAULT_ADMINS,
  initialSecurity = DEFAULT_SECURITY,
  initialPlatform = DEFAULT_PLATFORM,
  onInviteAdmin,
  onUpdateAdmin,
  onRemoveAdmin,
  onTransferOwnership,
  onSaveSecurity,
  onSavePlatform,
}: SettingsProps) => {
  const [tab, setTab] = useState<Tab>("profile");

  /*
   * Current authenticated admin returned from:
   *
   * GET /admin/auth/me
   */
  const [adminInfo, setAdminInfo] = useState<AdminUser>(
    currentUser ?? DEFAULT_ADMIN
  );

  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);

  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const [adminError, setAdminError] = useState("");

  /* ------------------------- Authentication ------------------------- */

  const getAdminMe = async () => {
    try {
      setLoadingAdmin(true);
      setAdminError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        setAdminError("Admin authentication token was not found.");
        return;
      }

      const authConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await axios.get("/admin/auth/me", authConfig);

      console.log("Admin info response:", res.data);

      if (!res.data?.success || !res.data?.admin) {
        setAdminError(
          res.data?.message || "Unable to retrieve admin information."
        );
        return;
      }

      const admin = res.data.admin;

      /*
       * Backend response:
       *
       * {
       *   id: 1,
       *   firstName: "Patch",
       *   lastName: "Pay",
       *   email: "admin@patchpay.com",
       *   role: "ADMIN",
       *   status: "ACTIVE"
       * }
       */

      const formattedAdmin: AdminUser = {
        id: String(admin.id),

        name: `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim(),

        email: admin.email ?? "",

        /*
         * Your backend currently returns ADMIN.
         *
         * If your backend later returns SUPER_ADMIN,
         * this will automatically map to Super admin.
         */
        role:
          admin.role === "SUPER_ADMIN" || admin.role === "SUPER ADMIN"
            ? "Super admin"
            : "Admin",

        /*
         * Backend:
         * ACTIVE
         * SUSPENDED
         * INVITED
         */
        status:
          admin.status === "SUSPENDED"
            ? "Suspended"
            : admin.status === "INVITED"
              ? "Invited"
              : "Active",

        lastActive: "Now",

        /*
         * Permissions are not included in your /me response,
         * so these remain full permissions for the authenticated
         * admin until the backend sends actual permissions.
         */
        permissions: {
          rateCard: "edit",
          promotions: "edit",
          users: "edit",
          transactions: "edit",
          reports: "edit",
        },
      };

      setAdminInfo(formattedAdmin);

      /*
       * Add/update the authenticated admin in the team list.
       */
      setAdmins((prev) => {
        const exists = prev.some(
          (adminItem) => adminItem.id === formattedAdmin.id
        );

        if (exists) {
          return prev.map((adminItem) =>
            adminItem.id === formattedAdmin.id
              ? {
                  ...adminItem,
                  ...formattedAdmin,
                }
              : adminItem
          );
        }

        return [formattedAdmin, ...prev];
      });

      /*
       * Update the profile name when API data arrives.
       */
      setName(formattedAdmin.name);
    } catch (err: any) {
      console.error(
        "Failed to get admin information:",
        err?.response?.data || err?.message || err
      );

      setAdminError(
        err?.response?.data?.message ||
          "Failed to load admin information."
      );
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    getAdminMe();
  }, []);

  /* ---------------------------- Audit ---------------------------- */

  const log = (action: string) =>
    setAudit((a) => [
      {
        id: crypto.randomUUID(),
        actor: adminInfo.name,
        action,
        at: now(),
      },
      ...a,
    ]);

  /* ---------------------------- Profile -------------------------- */

  const [name, setName] = useState(
    currentUser?.name ?? ""
  );

  const profileDirty =
    name.trim() !== adminInfo.name && name.trim() !== "";

  /* ---------------------------- Admins --------------------------- */

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [inviteName, setInviteName] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");

  const [inviteUsers, setInviteUsers] = useState<string>("Support");

  const [transferConfirm, setTransferConfirm] = useState("");

  const selected =
    admins.find((a) => a.id === selectedId) ?? null;

  const emailTaken = admins.some(
    (a) =>
      a.email.toLowerCase() ===
      inviteEmail.trim().toLowerCase()
  );

  const inviteValid =
    inviteName.trim() !== "" &&
    /\S+@\S+\.\S+/.test(inviteEmail) &&
    !emailTaken;

  const patchAdmin = async (
    id: string,
    patch: Partial<AdminUser>,
    logMsg: string
  ) => {
    const target = admins.find((a) => a.id === id);

    if (!target) return;

    const next = {
      ...target,
      ...patch,
    };

    await onUpdateAdmin?.(next);

    setAdmins((prev) =>
      prev.map((a) => (a.id === id ? next : a))
    );

    log(logMsg);
  };

  const invite = async () => {
    if (!inviteValid) return;

    const preset =
      PRESETS.find((p) => p.name === inviteUsers) ??
      PRESETS[3];

    const admin: AdminUser = {
      id: crypto.randomUUID(),

      name: inviteName.trim(),

      email: inviteEmail.trim(),

      role: "Admin",

      status: "Invited",

      lastActive: "Never",

      permissions: {
        ...preset.permissions,
      },
    };

    await onInviteAdmin?.(admin);

    setAdmins((prev) => [...prev, admin]);

    setSelectedId(admin.id);

    log(
      `Invited ${admin.email} as Admin (${preset.name})`
    );

    setInviteName("");

    setInviteEmail("");
  };

  const removeAdmin = async (a: AdminUser) => {
    await onRemoveAdmin?.(a.id);

    setAdmins((prev) =>
      prev.filter((x) => x.id !== a.id)
    );

    setSelectedId(null);

    log(`Removed admin ${a.email}`);
  };

  const transfer = async (a: AdminUser) => {
    await onTransferOwnership?.(a.id);

    setAdmins((prev) =>
      prev.map((x) =>
        x.id === a.id
          ? {
              ...x,
              role: "Super admin",
            }
          : x.id === adminInfo.id
            ? {
                ...x,
                role: "Admin",
              }
            : x
      )
    );

    setAdminInfo((prev) => ({
      ...prev,
      role:
        prev.id === adminInfo.id
          ? "Admin"
          : prev.role,
    }));

    log(
      `Transferred super admin ownership to ${a.email}`
    );

    setTransferConfirm("");
  };

  /* ---------------------- Security & platform ------------------- */

  const [savedSecurity, setSavedSecurity] =
    useState(initialSecurity);

  const [security, setSecurity] =
    useState(initialSecurity);

  const securityDirty = useMemo(
    () =>
      JSON.stringify(security) !==
      JSON.stringify(savedSecurity),
    [security, savedSecurity]
  );

  const [savedPlatform, setSavedPlatform] =
    useState(initialPlatform);

  const [platform, setPlatform] =
    useState(initialPlatform);

  const platformDirty = useMemo(
    () =>
      JSON.stringify(platform) !==
      JSON.stringify(savedPlatform),
    [platform, savedPlatform]
  );

  const saveSecurity = async () => {
    await onSaveSecurity?.(security);

    setSavedSecurity(security);

    log("Updated security policy");
  };

  const savePlatform = async () => {
    await onSavePlatform?.(platform);

    setSavedPlatform(platform);

    log(
      platform.maintenanceMode !==
        savedPlatform.maintenanceMode
        ? `Turned maintenance mode ${
            platform.maintenanceMode ? "on" : "off"
          }`
        : "Updated platform controls"
    );
  };

  /* ---------------------------- UI ------------------------------- */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Settings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          You are signed in as a super admin. Only super
          admins can see this page.
        </p>
      </div>

      {/* Loading / Error */}

      {loadingAdmin && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Loading admin information...
        </div>
      )}

      {adminError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {adminError}
        </div>
      )}

      {/* Tabs */}

      <nav
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === t.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ------------------------- Profile ------------------------- */}

      {tab === "profile" && (
        <Card
          title="My profile"
          description="Your details as they appear to other admins."
          footer={
            <button
              className={btnPrimary}
              disabled={!profileDirty}
              onClick={() => {
                const updatedName = name.trim();

                setAdminInfo((prev) => ({
                  ...prev,
                  name: updatedName,
                }));

                setAdmins((prev) =>
                  prev.map((a) =>
                    a.id === adminInfo.id
                      ? {
                          ...a,
                          name: updatedName,
                        }
                      : a
                  )
                );

                log("Updated own profile name");
              }}
            >
              Save profile
            </button>
          }
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
              {initials(
                name || adminInfo.name || "Admin"
              )}
            </div>

            <div>
              <p className="font-medium text-slate-900">
                {adminInfo.name || "Admin"}
              </p>

              <span className="mt-1 inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                {adminInfo.role}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className={inputCls}
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </Field>

            <Field
              label="Email"
              hint="Contact another super admin to change this."
            >
              <input
                className={inputCls}
                value={adminInfo.email}
                disabled
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Admin ID">
              <input
                className={inputCls}
                value={adminInfo.id}
                disabled
              />
            </Field>

            <Field label="Status">
              <input
                className={inputCls}
                value={adminInfo.status}
                disabled
              />
            </Field>
          </div>
        </Card>
      )}

      {/* --------------------- Admins & permissions ---------------------- */}

      {tab === "admins" && (
        <div className="space-y-6">
          <Card
            title="Invite an admin"
            description="They get an email link to set up their account."
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end">
              <Field label="Full name">
                <input
                  className={inputCls}
                  value={inviteName}
                  onChange={(e) =>
                    setInviteName(e.target.value)
                  }
                />
              </Field>

              <Field
                label="Email"
                hint={
                  emailTaken
                    ? "This email is already an admin."
                    : undefined
                }
              >
                <input
                  type="email"
                  className={inputCls}
                  value={inviteEmail}
                  onChange={(e) =>
                    setInviteEmail(e.target.value)
                  }
                />
              </Field>

              <Field label="Starting access">
                <select
                  className={inputCls}
                  value={inviteUsers}
                  onChange={(e) =>
                    setInviteUsers(e.target.value)
                  }
                >
                  {PRESETS.map((p) => (
                    <option key={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              <button
                className={btnPrimary}
                disabled={!inviteValid}
                onClick={invite}
              >
                Send invite
              </button>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            {/* Admin list */}

            <section className="h-fit rounded-xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Team{" "}
                  <span className="font-normal text-slate-500">
                    ({admins.length})
                  </span>
                </h3>
              </header>

              <ul className="divide-y divide-slate-100">
                {admins.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedId(a.id)
                      }
                      disabled={a.id === adminInfo.id}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left ${
                        a.id === selectedId
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                      } disabled:cursor-default disabled:hover:bg-transparent`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                        {initials(a.name)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {a.name}

                          {a.id === adminInfo.id && (
                            <span className="font-normal text-slate-500">
                              {" "}
                              (you)
                            </span>
                          )}
                        </span>

                        <span className="block truncate text-xs text-slate-500">
                          {a.email}
                        </span>
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          STATUS_STYLE[a.status]
                        }`}
                      >
                        {a.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {admins.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No admins found.
                </div>
              )}
            </section>

            {/* Permission editor */}

            {selected ? (
              <div className="space-y-6">
                <Card
                  title={`Permissions for ${selected.name}`}
                  description={`${selected.email}, last active ${selected.lastActive}`}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">
                      Apply a preset:
                    </span>

                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() =>
                          patchAdmin(
                            selected.id,
                            {
                              permissions: {
                                ...p.permissions,
                              },
                            },
                            `Set ${selected.email} to ${p.name} preset`
                          )
                        }
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>

                  <ul className="divide-y divide-slate-100">
                    {MODULES.map((m) => (
                      <li
                        key={m.key}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {m.label}
                          </p>

                          <p className="text-xs text-slate-500">
                            {m.hint}
                          </p>
                        </div>

                        <div
                          className="inline-flex overflow-hidden rounded-md border border-slate-300"
                          role="radiogroup"
                          aria-label={`${m.label} access`}
                        >
                          {(
                            ["none", "view", "edit"] as Level[]
                          ).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              role="radio"
                              aria-checked={
                                selected.permissions[
                                  m.key
                                ] === lvl
                              }
                              onClick={() =>
                                patchAdmin(
                                  selected.id,
                                  {
                                    permissions: {
                                      ...selected.permissions,
                                      [m.key]: lvl,
                                    },
                                  },
                                  `Set ${selected.email} ${m.label} access to ${lvl}`
                                )
                              }
                              className={`px-3 py-1.5 text-xs font-medium capitalize ${
                                selected.permissions[
                                  m.key
                                ] === lvl
                                  ? "bg-indigo-600 text-white"
                                  : "bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {lvl === "none"
                                ? "No access"
                                : lvl}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 text-xs text-slate-500">
                    Settings, admin management and audit
                    logs are never available to regular
                    admins.
                  </p>
                </Card>

                <Card title="Account access">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={btnGhost}
                      onClick={() =>
                        patchAdmin(
                          selected.id,
                          {
                            status:
                              selected.status ===
                              "Suspended"
                                ? "Active"
                                : "Suspended",
                          },
                          `${
                            selected.status ===
                            "Suspended"
                              ? "Reinstated"
                              : "Suspended"
                          } ${selected.email}`
                        )
                      }
                    >
                      {selected.status === "Suspended"
                        ? "Reinstate admin"
                        : "Suspend admin"}
                    </button>

                    <button
                      className="rounded-md border border-red-300 px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      onClick={() =>
                        removeAdmin(selected)
                      }
                    >
                      Remove admin
                    </button>
                  </div>

                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50/50 p-4">
                    <p className="text-sm font-medium text-red-800">
                      Transfer super admin ownership
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      {selected.name} becomes the super
                      admin and you become a regular admin.
                      You can't undo this yourself.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        className={`${inputCls} max-w-xs`}
                        placeholder={`Type ${selected.email} to confirm`}
                        value={transferConfirm}
                        onChange={(e) =>
                          setTransferConfirm(
                            e.target.value
                          )
                        }
                      />

                      <button
                        className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={
                          transferConfirm !==
                            selected.email ||
                          selected.status !== "Active"
                        }
                        onClick={() =>
                          transfer(selected)
                        }
                      >
                        Transfer ownership
                      </button>
                    </div>

                    {selected.status !== "Active" && (
                      <p className="mt-2 text-xs text-red-700">
                        Ownership can only go to an active
                        admin.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="flex h-fit items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
                Pick an admin from the team list to edit
                their permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------- Security ------------------------- */}

      {tab === "security" && (
        <Card
          title="Security policy"
          description="Applies to every admin account."
          footer={
            <>
              <button
                className={btnGhost}
                disabled={!securityDirty}
                onClick={() =>
                  setSecurity(savedSecurity)
                }
              >
                Discard
              </button>

              <button
                className={btnPrimary}
                disabled={!securityDirty}
                onClick={saveSecurity}
              >
                Save policy
              </button>
            </>
          }
        >
          <div className="divide-y divide-slate-100">
            <Toggle
              label="Require two-factor authentication"
              description="Admins without 2FA are asked to set it up at next sign in."
              checked={security.require2FA}
              onChange={(v) =>
                setSecurity((s) => ({
                  ...s,
                  require2FA: v,
                }))
              }
            />

            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <Field label="Sign out after inactivity">
                <select
                  className={inputCls}
                  value={security.sessionMinutes}
                  onChange={(e) =>
                    setSecurity((s) => ({
                      ...s,
                      sessionMinutes: Number(
                        e.target.value
                      ),
                    }))
                  }
                >
                  {[15, 30, 60, 120].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lock account after failed logins">
                <input
                  type="number"
                  min={3}
                  max={10}
                  className={inputCls}
                  value={security.maxFailedLogins}
                  onChange={(e) =>
                    setSecurity((s) => ({
                      ...s,
                      maxFailedLogins:
                        Number(e.target.value) || 5,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="pt-4">
              <Field
                label="Allowed IP addresses"
                hint="One IP or range per line. Leave empty to allow any address."
              >
                <textarea
                  rows={4}
                  className={`${inputCls} font-mono`}
                  placeholder={
                    "102.89.0.0/16\n41.58.10.4"
                  }
                  value={security.ipAllowlist}
                  onChange={(e) =>
                    setSecurity((s) => ({
                      ...s,
                      ipAllowlist: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* ---------------------- Platform controls ----------------------- */}

      {tab === "platform" && (
        <Card
          title="Platform controls"
          description="Changes here affect every customer, so they are limited to super admins."
          footer={
            <>
              <button
                className={btnGhost}
                disabled={!platformDirty}
                onClick={() =>
                  setPlatform(savedPlatform)
                }
              >
                Discard
              </button>

              <button
                className={btnPrimary}
                disabled={!platformDirty}
                onClick={savePlatform}
              >
                Save controls
              </button>
            </>
          }
        >
          <div className="divide-y divide-slate-100">
            <Toggle
              label="Maintenance mode"
              description="Pauses new transactions and shows customers a maintenance notice."
              checked={platform.maintenanceMode}
              onChange={(v) =>
                setPlatform((p) => ({
                  ...p,
                  maintenanceMode: v,
                }))
              }
            />

            <Toggle
              label="Require approval for new promotions"
              description="Promo codes made by admins stay pending until you approve them."
              checked={
                platform.requireApprovalForPromos
              }
              onChange={(v) =>
                setPlatform((p) => ({
                  ...p,
                  requireApprovalForPromos: v,
                }))
              }
            />

            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <Field
                label="Largest single transaction ($)"
                hint="Anything above this is held for review."
              >
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={
                    platform.maxSingleTransaction
                  }
                  onChange={(e) =>
                    setPlatform((p) => ({
                      ...p,
                      maxSingleTransaction:
                        Number(e.target.value) || 0,
                    }))
                  }
                />
              </Field>

              <Field
                label="Rate change needing your approval (%)"
                hint="If an admin moves any rate on the rate card by more than this, it waits for you."
              >
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className={inputCls}
                  value={
                    platform.approvalThresholdPercent
                  }
                  onChange={(e) =>
                    setPlatform((p) => ({
                      ...p,
                      approvalThresholdPercent:
                        Number(e.target.value) || 0,
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* --------------------------- Audit log ---------------------------- */}

      {tab === "audit" && (
        <Card
          title="Audit log"
          description="Every change made from this page, newest first."
        >
          {audit.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nothing yet. Changes to admins, security and
              platform controls show up here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {audit.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                >
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">
                      {e.actor}
                    </span>{" "}
                    {e.action}
                  </p>

                  <time className="text-xs text-slate-500">
                    {e.at}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
};

export default Settings;