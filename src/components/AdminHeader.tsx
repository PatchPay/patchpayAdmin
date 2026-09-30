/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import axios from "../config/axiosconfig";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

const pageCopy: Record<
  string,
  {
    title: string;
    subtitle: string;
  }
> = {
  "/admin/overview": {
    title: "Overview",
    subtitle:
      "Live liquidity, activity and items that need attention.",
  },

  "/admin/operations": {
    title: "Operations queue",
    subtitle:
      "Security, payment, escrow and verification exceptions.",
  },

  "/admin/users": {
    title: "Users",
    subtitle:
      "Homeowners, tradespeople and agents on PatchPay.",
  },

  "/admin/transactions": {
    title: "Transactions",
    subtitle:
      "Searchable ledger of every PatchPay reference.",
  },

  "/admin/rfqs": {
    title: "RFQs",
    subtitle:
      "Quotation lifecycle from request to completion.",
  },

  "/admin/escrow": {
    title: "Escrow",
    subtitle:
      "Wallets, funding, delivery codes and disputes.",
  },

  "/admin/payments": {
    title: "Payments",
    subtitle:
      "Top-ups, withdrawals and payment verification.",
  },

  "/admin/rate-cards": {
    title: "Rate cards",
    subtitle:
      "Transaction rates and mobile charges.",
  },

  "/admin/promotions": {
    title: "Promotions",
    subtitle:
      "Fee waivers, cashback and referral campaigns.",
  },

  "/admin/reconciliation": {
    title: "Reconciliation",
    subtitle:
      "Ledger vs. provider settlement matching.",
  },

  "/admin/security": {
    title: "Security",
    subtitle:
      "Login inconsistencies and IP/location review.",
  },

  "/admin/notifications": {
    title: "Notifications",
    subtitle:
      "Rules that message users and admins.",
  },

  "/admin/reports": {
    title: "Reports",
    subtitle:
      "Scheduled and on-demand platform exports.",
  },

  "/admin/audit-log": {
    title: "Audit log",
    subtitle:
      "Every admin action, in order.",
  },

  "/admin/settings": {
    title: "Settings",
    subtitle:
      "Admin accounts and permission groups.",
  },
};

const LOGIN_PATH = "/";
const PROFILE_PATH = "/admin/settings";

const AdminHeader = ({
  onMenuClick,
}: AdminHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(
    null
  );
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef =
    useRef<HTMLButtonElement>(null);

  const copy =
    Object.entries(pageCopy).find(
      ([path]) =>
        location.pathname.includes(path)
    )?.[1] ?? {
      title: "Admin console",
      subtitle: "",
    };

  /**
   * Get authenticated admin
   */
  const getAdminMe = async () => {
    try {
      setLoadingAdmin(true);

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        setAdmin(null);
        return;
      }

      const response = await axios.get(
        "/admin/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Admin info response:",
        response.data
      );

      if (
        !response.data?.success ||
        !response.data?.admin
      ) {
        setAdmin(null);
        return;
      }

      const adminData = response.data.admin;

      setAdmin({
        id: String(adminData.id),
        firstName: adminData.firstName ?? "",
        lastName: adminData.lastName ?? "",
        email: adminData.email ?? "",
        role: adminData.role ?? "ADMIN",
        status: adminData.status ?? "ACTIVE",
      });
    } catch (error: any) {
      console.error(
        "Failed to get admin information:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setAdmin(null);

      if (error?.response?.status === 401) {
        localStorage.removeItem("adminToken");

        navigate(LOGIN_PATH, {
          replace: true,
        });
      }
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    getAdminMe();
  }, []);

  /**
   * Close profile menu whenever route changes
   */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  /**
   * Close profile menu when clicking outside
   */
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (
      event: MouseEvent
    ) => {
      if (
        !menuRef.current?.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  /**
   * Admin full name
   */
  const getAdminName = () => {
    if (!admin) {
      return "Admin";
    }

    const fullName =
      `${admin.firstName} ${admin.lastName}`.trim();

    return fullName || "Admin";
  };

  /**
   * Admin initials
   */
  const getAdminInitials = () => {
    if (!admin) {
      return "A";
    }

    const firstInitial =
      admin.firstName?.charAt(0) || "";

    const lastInitial =
      admin.lastName?.charAt(0) || "";

    const initials =
      `${firstInitial}${lastInitial}`.toUpperCase();

    return initials || "A";
  };

  /**
   * Admin role
   */
  const getAdminRole = () => {
    if (!admin?.role) {
      return "Admin";
    }

    switch (admin.role) {
      case "SUPER_ADMIN":
      case "SUPER ADMIN":
        return "Super Admin";

      case "OPERATIONS":
        return "Operations";

      case "SUPPORT":
        return "Support";

      case "ADMIN":
      default:
        return "Admin";
    }
  };

  /**
   * View profile
   */
  const handleViewProfile = () => {
    setMenuOpen(false);

    navigate(PROFILE_PATH);
  };

  /**
   * Logout
   */
  const handleLogout = async () => {
    setMenuOpen(false);

    const token =
      localStorage.getItem("adminToken");

    try {
      if (token) {
        await axios.post(
          "/admin/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(
        "Admin logout error:",
        error
      );
    } finally {
      localStorage.removeItem("adminToken");

      navigate(LOGIN_PATH, {
        replace: true,
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
            {copy.title}
          </h1>

          <p className="hidden text-xs text-slate-500 sm:block">
            {copy.subtitle}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            placeholder="Search PatchPay ref, UPRN or user"
            className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Profile */}
        <div
          ref={menuRef}
          className="relative"
        >
          <button
            ref={triggerRef}
            type="button"
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-100"
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
              {loadingAdmin
                ? "..."
                : getAdminInitials()}
            </div>

            {/* Admin details */}
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-slate-900">
                {loadingAdmin
                  ? "Loading..."
                  : getAdminName()}
              </p>

              <p className="text-[11px] text-slate-500">
                {loadingAdmin
                  ? "Loading..."
                  : getAdminRole()}
              </p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition-transform md:block ${
                menuOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              {/* Mobile profile information */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                    {getAdminInitials()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {getAdminName()}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {getAdminRole()}
                    </p>

                    <p className="truncate text-[11px] text-slate-400">
                      {admin?.email || ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-1 h-px bg-slate-100" />

              {/* View profile */}
              <button
                type="button"
                role="menuitem"
                onClick={handleViewProfile}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              >
                <UserRound
                  size={16}
                  className="text-slate-400"
                />

                View profile
              </button>

              <div className="my-1 h-px bg-slate-100" />

              {/* Logout */}
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 focus:bg-rose-50 focus:outline-none"
              >
                <LogOut size={16} />

                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;