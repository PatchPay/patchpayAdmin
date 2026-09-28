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
import { NavLink } from "react-router-dom";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    group: "Monitor",
    items: [
      { label: "Overview", path: "/admin/overview", icon: LayoutDashboard },
      { label: "Operations queue", path: "/admin/operations", icon: FileClock,  },
    ],
  },
  {
    group: "Marketplace",
    items: [
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Transactions", path: "/admin/transactions", icon: Receipt },
      { label: "RFQs", path: "/admin/rfqs", icon: ShoppingCart },
      { label: "Escrow", path: "/admin/escrow", icon: Scale },
      { label: "Payments", path: "/admin/payments", icon: Wallet },
    ],
  },
  {
    group: "Commercial",
    items: [
      { label: "Rate cards", path: "/admin/rate-cards", icon: Percent },
      { label: "Promotions", path: "/admin/promotions", icon: CircleDollarSign },
      { label: "Reconciliation", path: "/admin/reconciliation", icon: BarChart3 },
    ],
  },
  {
    group: "Platform",
    items: [
      { label: "Security", path: "/admin/security", icon: ShieldCheck },
      { label: "Notifications", path: "/admin/notifications", icon: Bell },
      { label: "Reports", path: "/admin/reports", icon: FileBarChart },
      { label: "Audit log", path: "/admin/audit-log", icon: FileText },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

const AdminSidebar = ({ open, onClose }: AdminSidebarProps) => {
  return (
    <>
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
              <span className="text-sm font-bold text-slate-950">P</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">PatchPay</p>
              <p className="text-[11px] text-slate-500">Admin console</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((section) => (
            <div key={section.group} className="mb-5">
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
                        group flex items-center justify-between rounded-lg px-3 py-2
                        text-sm transition-colors
                        ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }
                        `
                      }
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon size={17} strokeWidth={1.75} className="shrink-0" />
                        <span>{item.label}</span>
                      </span>
                      {/* {"badge" in item && item.badge ? (
                        <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
                          {item.badge}
                        </span>
                      ) : null} */}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Signed-in admin */}
        <div className="border-t border-slate-800/80 p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
              FA
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Femi Alabi</p>
              <p className="truncate text-[11px] text-slate-500">Escrow operations lead</p>
            </div>

            <button
              type="button"
              title="Sign out"
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