/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Search, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  "/admin/overview": { title: "Overview", subtitle: "Live liquidity, activity and items that need attention." },
  "/admin/operations": { title: "Operations queue", subtitle: "Security, payment, escrow and verification exceptions." },
  "/admin/users": { title: "Users", subtitle: "Homeowners, tradespeople and agents on PatchPay." },
  "/admin/transactions": { title: "Transactions", subtitle: "Searchable ledger of every PatchPay reference." },
  "/admin/rfqs": { title: "RFQs", subtitle: "Quotation lifecycle from request to completion." },
  "/admin/escrow": { title: "Escrow", subtitle: "Wallets, funding, delivery codes and disputes." },
  "/admin/payments": { title: "Payments", subtitle: "Top-ups, withdrawals and payment verification." },
  "/admin/rate-cards": { title: "Rate cards", subtitle: "Transaction rates and mobile charges." },
  "/admin/promotions": { title: "Promotions", subtitle: "Fee waivers, cashback and referral campaigns." },
  "/admin/reconciliation": { title: "Reconciliation", subtitle: "Ledger vs. provider settlement matching." },
  "/admin/security": { title: "Security", subtitle: "Login inconsistencies and IP/location review." },
  "/admin/notifications": { title: "Notifications", subtitle: "Rules that message users and admins." },
  "/admin/reports": { title: "Reports", subtitle: "Scheduled and on-demand platform exports." },
  "/admin/audit-log": { title: "Audit log", subtitle: "Every admin action, in order." },
  "/admin/settings": { title: "Settings", subtitle: "Admin accounts and permission groups." },
};

// Adjust these two if your router uses different paths.
const LOGIN_PATH = "/";
const PROFILE_PATH = "/admin/settings";

const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const copy =
    Object.entries(pageCopy).find(([path]) => location.pathname.includes(path))?.[1] ??
    { title: "Admin console", subtitle: "" };

  // Close the menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close on outside click or Escape while open
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleViewProfile = () => {
    setMenuOpen(false);
    navigate(PROFILE_PATH);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    // TODO: call your logout endpoint and clear the stored session/token here
    navigate(LOGIN_PATH, { replace: true });
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
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{copy.title}</h1>
          <p className="hidden text-xs text-slate-500 sm:block">{copy.subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
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

        <button
          type="button"
          className="relative rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Profile dropdown */}
        <div ref={menuRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
              FA
            </div>

            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-slate-900">Admin Patchpay</p>
              <p className="text-[11px] text-slate-500">Super Admin</p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition-transform md:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              {/* Shown here so it's visible on small screens where the name is hidden */}
              <div className="px-3 py-2 md:hidden">
                <p className="text-sm font-medium text-slate-900">Admin Patchpay</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="my-1 h-px bg-slate-100 md:hidden" />

              <button
                type="button"
                role="menuitem"
                onClick={handleViewProfile}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              >
                <UserRound size={16} className="text-slate-400" />
                View profile
              </button>

              <div className="my-1 h-px bg-slate-100" />

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