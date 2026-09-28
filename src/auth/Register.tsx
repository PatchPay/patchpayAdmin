
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Fonts: add to index.html (or import via @fontsource)
 *
 * <link rel="preconnect" href="https://fonts.googleapis.com" />
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
 * <link
 *   href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap"
 *   rel="stylesheet"
 * />
 */

const display =
  "font-['Familjen_Grotesk',ui-sans-serif,system-ui,sans-serif]";

const body =
  "font-['Instrument_Sans',ui-sans-serif,system-ui,sans-serif]";

type RegisterCredentials = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  registrationSecret: string;
};

const registerAdmin = async (credentials: RegisterCredentials) => {
  /**
   * Replace this URL with your actual API base URL if you already
   * have an Axios/API service configured.
   *
   * Example:
   * const API_URL = import.meta.env.VITE_API_URL;
   */

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const response = await fetch(`${API_URL}/admin/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to register admin");
  }

  return data;
};

const Brand = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-[#33208A]">
      <span
        aria-hidden
        className="absolute inset-0.75 rounded-md border border-dashed border-[#FFC83D]"
      />

      <span
        className={`${display} text-[17px] font-bold text-white`}
      >
        P
      </span>
    </span>

    <span
      className={`${display} text-lg font-semibold tracking-tight`}
    >
      PatchPay
    </span>
  </div>
);

const Register = () => {
  const navigate = useNavigate();

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const roleId = useId();
  const secretId = useId();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [role, setRole] = useState("ADMIN");
  const [registrationSecret, setRegistrationSecret] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!registrationSecret.trim()) {
      setError("The admin registration secret is required.");
      return;
    }

    setLoading(true);

    try {
      await registerAdmin({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
        registrationSecret: registrationSecret.trim(),
      });

      setSuccess(
        "Admin account created successfully. You can now sign in."
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRegistrationSecret("");
      setRole("ADMIN");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create admin account."
      );
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
      {/* Brand panel */}
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
              Build the team behind every transaction.
            </p>

            <p className="mt-5 max-w-[30ch] text-[15px] leading-6 text-white/70">
              Admin access gives your operations team the tools
              they need to monitor users, payments, escrows and
              the transaction trail.
            </p>
          </div>
        </div>
      </aside>

      {/* Registration form */}
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:min-h-0 lg:px-16">
        <Brand className="text-[#25166B] lg:hidden" />

        <div className="mx-auto my-auto w-full max-w-115 py-10">
          <div className="mb-8">
            <h1
              className={`${display} text-[28px] font-semibold tracking-tight`}
            >
              Create admin account
            </h1>

            <p className="mt-2 text-[15px] leading-6 text-[#6B6878]">
              Create an authorized PatchPay admin account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* First + Last name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={firstNameId}
                  className="mb-1.5 block text-sm font-medium"
                >
                  First name
                </label>

                <input
                  id={firstNameId}
                  type="text"
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(e.target.value)
                  }
                  placeholder="John"
                  autoComplete="given-name"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor={lastNameId}
                  className="mb-1.5 block text-sm font-medium"
                >
                  Last name
                </label>

                <input
                  id={lastNameId}
                  type="text"
                  value={lastName}
                  onChange={(e) =>
                    setLastName(e.target.value)
                  }
                  placeholder="Doe"
                  autoComplete="family-name"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="admin@patchpay.com"
                autoComplete="email"
                required
                className={inputClass}
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor={roleId}
                className="mb-1.5 block text-sm font-medium"
              >
                Admin role
              </label>

              <select
                id={roleId}
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                className={inputClass}
              >
                <option value="ADMIN">Admin</option>
                <option value="OPERATIONS">
                  Operations
                </option>
                <option value="SUPPORT">Support</option>
                <option value="SUPER_ADMIN">
                  Super Admin
                </option>
              </select>

              <p className="mt-1.5 text-xs text-[#6B6878]">
                Choose the level of access for this admin.
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor={passwordId}
                className="mb-1.5 block text-sm font-medium"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  className={`${inputClass} pr-16`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-pressed={showPassword}
                  aria-controls={passwordId}
                  className="absolute inset-y-0 right-0 rounded-r-md px-3.5 text-sm font-medium text-[#6B6878] outline-none transition-colors hover:text-[#17151F] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#25166B]/40"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor={confirmPasswordId}
                className="mb-1.5 block text-sm font-medium"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id={confirmPasswordId}
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className={`${inputClass} pr-16`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  aria-pressed={showConfirmPassword}
                  aria-controls={confirmPasswordId}
                  className="absolute inset-y-0 right-0 rounded-r-md px-3.5 text-sm font-medium text-[#6B6878] outline-none transition-colors hover:text-[#17151F] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#25166B]/40"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Registration secret */}
            <div>
              <label
                htmlFor={secretId}
                className="mb-1.5 block text-sm font-medium"
              >
                Registration secret
              </label>

              <div className="relative">
                <input
                  id={secretId}
                  type={showSecret ? "text" : "password"}
                  value={registrationSecret}
                  onChange={(e) =>
                    setRegistrationSecret(e.target.value)
                  }
                  placeholder="Enter admin registration secret"
                  autoComplete="off"
                  required
                  className={`${inputClass} pr-16`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowSecret((prev) => !prev)
                  }
                  aria-pressed={showSecret}
                  aria-controls={secretId}
                  className="absolute inset-y-0 right-0 rounded-r-md px-3.5 text-sm font-medium text-[#6B6878] outline-none transition-colors hover:text-[#17151F] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#25166B]/40"
                >
                  {showSecret ? "Hide" : "Show"}
                </button>
              </div>

              <p className="mt-1.5 text-xs leading-5 text-[#6B6878]">
                This is required to authorize creation of an
                admin account.
              </p>
            </div>

            {/* Messages */}
            <div
              aria-live="polite"
              className="min-h-5"
            >
              {error && (
                <p
                  role="alert"
                  className="text-sm leading-5 text-[#B42318]"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="text-sm leading-5 text-[#18794E]"
                >
                  {success}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md bg-[#25166B] text-[15px] font-semibold text-white outline-none transition-colors hover:bg-[#1D1155] focus-visible:ring-2 focus-visible:ring-[#25166B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F6F9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account…"
                : "Create admin account"}
            </button>
          </form>

          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-[#25166B] underline decoration-[#25166B]/30 underline-offset-4 transition-colors hover:decoration-[#25166B]"
            >
              Already have an account? Sign in
            </button>
          </div>

          <p className="mt-7 text-center text-[13px] leading-5 text-[#6B6878]">
            Admin registrations are protected and recorded as
            part of the PatchPay administrative access process.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;

