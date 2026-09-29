/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart3,
  Bell,
  CircleDollarSign,
  FileBarChart,
  FileClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Percent,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

const navigation = [
  {
    group: "Monitor",
    items: [
      {
        label: "Overview",
        path: "/admin/overview",
        icon: LayoutDashboard,
      },
      {
        label: "Operations queue",
        path: "/admin/operations",
        icon: FileClock,
      },
    ],
  },
  {
    group: "Marketplace",
    items: [
      {
        label: "Users",
        path: "/admin/users",
        icon: Users,
      },
      {
        label: "Transactions",
        path: "/admin/transactions",
        icon: Receipt,
      },
      {
        label: "RFQs",
        path: "/admin/rfqs",
        icon: ShoppingCart,
      },
      {
        label: "Escrow",
        path: "/admin/escrow",
        icon: Scale,
      },
      {
        label: "Payments",
        path: "/admin/payments",
        icon: Wallet,
      },
    ],
  },
  {
    group: "Commercial",
    items: [
      {
        label: "Rate cards",
        path: "/admin/rate-cards",
        icon: Percent,
      },
      {
        label: "Promotions",
        path: "/admin/promotions",
        icon: CircleDollarSign,
      },
      {
        label: "Reconciliation",
        path: "/admin/reconciliation",
        icon: BarChart3,
      },
    ],
  },
  {
    group: "Platform",
    items: [
      {
        label: "Security",
        path: "/admin/security",
        icon: ShieldCheck,
      },
      {
        label: "Notifications",
        path: "/admin/notifications",
        icon: Bell,
      },
      {
        label: "Reports",
        path: "/admin/reports",
        icon: FileBarChart,
      },
      {
        label: "Audit log",
        path: "/admin/audit-log",
        icon: FileText,
      },
      {
        label: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

const AdminSidebar = ({
  open,
  onClose,
}: AdminSidebarProps) => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const getAdminMe = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setAdmin(null);
        return;
      }

      const response = await axios.get("/admin/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success || !response.data?.admin) {
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
        error?.response?.data || error?.message || error
      );

      setAdmin(null);

      // If token is invalid/expired, remove it
      if (error?.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/", { replace: true });
      }
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    getAdminMe();
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");

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
      console.error("Admin logout error:", error);
    } finally {
      // JWT is stateless, so remove it from the browser
      localStorage.removeItem("adminToken");

      navigate("/", {
        replace: true,
      });
    }
  };

  const getAdminName = () => {
    if (!admin) {
      return "Admin";
    }

    return `${admin.firstName} ${admin.lastName}`.trim() || "Admin";
  };

  const getAdminInitials = () => {
    if (!admin) {
      return "A";
    }

    const firstInitial = admin.firstName?.charAt(0) || "";
    const lastInitial = admin.lastName?.charAt(0) || "";

    return `${firstInitial}${lastInitial}`.toUpperCase() || "A";
  };

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

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-slate-800/80 bg-slate-950
          transition-transform duration-300
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <span className="text-sm font-bold text-slate-950">
                P
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                PatchPay
              </p>

              <p className="text-[11px] text-slate-500">
                Admin console
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((section) => (
            <div
              key={section.group}
              className="mb-5"
            >
              <p className="mb-1.5 px-3 text-[11px] font-medium text-slate-500">
                {section.group}
              </p>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/admin/overview"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `
                        group flex items-center justify-between rounded-lg
                        px-3 py-2 text-sm transition-colors
                        ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }
                        `
                      }
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          size={17}
                          strokeWidth={1.75}
                          className="shrink-0"
                        />

                        <span>{item.label}</span>
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Authenticated Admin */}
        <div className="border-t border-slate-800/80 p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
              {loadingAdmin
                ? "..."
                : getAdminInitials()}
            </div>

            {/* Admin information */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {loadingAdmin
                  ? "Loading..."
                  : getAdminName()}
              </p>

              <p className="truncate text-[11px] text-slate-500">
                {loadingAdmin
                  ? "Loading account..."
                  : getAdminRole()}
              </p>
            </div>

            {/* Logout */}
            <button
              type="button"
              title="Sign out"
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-rose-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;