/* eslint-disable @typescript-eslint/no-explicit-any */
import { useId, useState, type FormEvent } from "react";
import axios from '../config/axiosconfig'
import {toast} from 'react-hot-toast'
import { useNavigate } from "react-router-dom";



const display = "font-['Familjen_Grotesk',ui-sans-serif,system-ui,sans-serif]";
const body = "font-['Instrument_Sans',ui-sans-serif,system-ui,sans-serif]";





const Brand = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-[#33208A]">
      <span
        aria-hidden
        className="absolute inset-0.75 rounded-md border border-dashed border-[#FFC83D]"
      />
      <span className={`${display} text-[17px] font-bold text-white`}>P</span>
    </span>
    <span className={`${display} text-lg font-semibold tracking-tight`}>
      PatchPay
    </span>
  </div>
);

const Login = () => {
  const emailId = useId();
  const passwordId = useId();

  const navigate = useNavigate()

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await axios.post("/admin/auth/login", { email, password });
      toast.success(res.data?.message || "Login successful");
      localStorage.setItem("adminToken", res.data?.token);
      navigate("/admin/overview");
      
    } catch(err: any) {
      toast.error(err.res?.data?.message || "An error occurred while logging in.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-md border border-[#D9D6E0] bg-white px-3.5 text-[15px] text-[#17151F] " +
    "placeholder:text-[#9A97A6] outline-none transition-colors motion-reduce:transition-none " +
    "hover:border-[#B9B4C6] focus:border-[#25166B] focus:ring-[3px] focus:ring-[#25166B]/15";

  return (
    <div
      className={`${body} min-h-screen bg-[#F7F6F9] text-[#17151F] antialiased lg:grid lg:grid-cols-[5fr_6fr]`}
    >
      {/* Brand panel (desktop only) */}
      <aside className="hidden flex-col bg-[#25166B] p-12 text-white lg:flex xl:p-16">
        <Brand />

        <div className="my-auto">
          <div className="relative max-w-md rotate-[-1.5deg] rounded-[28px] bg-[#33208A] p-9 xl:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-2.5 rounded-[20px] border-2 border-dashed border-[#FFC83D]"
            />
            <p
              className={`${display} text-[34px] font-semibold leading-[1.1] tracking-tight xl:text-[40px]`}
            >
              Every hold, release and refund leaves a record.
            </p>
            <p className="mt-5 max-w-[30ch] text-[15px] leading-6 text-white/70">
              Money in escrow stays traceable from funding to payout. What you
              do here is part of that trail.
            </p>
          </div>
        </div>
      </aside>

      {/* Form */}
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:min-h-0 lg:px-16">
        <Brand className="text-[#25166B] lg:hidden" />

        <div className="mx-auto my-auto w-full max-w-88 py-12">
          <h1 className={`${display} text-[28px] font-semibold tracking-tight`}>
            Sign in
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-[#6B6878]">
            Use your PatchPay admin account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor={emailId}
                className="mb-1.5 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@patchpay.com"
                autoComplete="email"
                required
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor={passwordId} className="text-sm font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // TODO: route to the password reset flow
                    console.log("Forgot password");
                  }}
                  className="rounded text-sm text-[#25166B] underline decoration-[#25166B]/30 underline-offset-4 outline-none transition-colors hover:decoration-[#25166B] focus-visible:ring-2 focus-visible:ring-[#25166B]/40 motion-reduce:transition-none"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={`${inputClass} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-controls={passwordId}
                  className="absolute inset-y-0 right-0 rounded-r-md px-3.5 text-sm font-medium text-[#6B6878] outline-none transition-colors hover:text-[#17151F] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#25166B]/40 motion-reduce:transition-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div aria-live="polite">
              {error && (
                <p role="alert" className="text-sm leading-5 text-[#B42318]">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md bg-[#25166B] text-[15px] font-semibold text-white outline-none transition-colors hover:bg-[#1D1155] focus-visible:ring-2 focus-visible:ring-[#25166B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F6F9] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-[13px] leading-5 text-[#6B6878]">
            Sign-ins to this portal are recorded in the audit log.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;