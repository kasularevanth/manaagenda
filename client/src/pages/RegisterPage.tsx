import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth.service";
import { AuthVisual } from "../components/AuthVisual";
import { useAuth } from "../hooks/useAuth";
import { LoadingDots } from "../components/LoadingDots";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"" | "ADMIN" | "EMPLOYEE" | "CLIENT">("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    if (!role) {
      setStatus("Please select a user type.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("Password and confirm password must match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerUser({ fullName, email, password, role });
      await signIn(email, password);
      setStatus("Account created successfully. Redirecting to portal...");
      setTimeout(() => navigate("/portal"), 500);
    } catch (error) {
      setStatus((error as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="container auth-two-col">
        <AuthVisual />
        <section className="auth-card auth-card-dark">
          <div className="auth-form-wrap">
            <h1 className="auth-title">Create an account</h1>
            <p className="muted muted-light auth-subtitle">Fill your details and choose your user type.</p>

            <form onSubmit={onRegister} className="auth-form">
              <label className="auth-label">
                Type of user
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as "" | "ADMIN" | "EMPLOYEE" | "CLIENT")}
                  required
                >
                  <option value="">Select type</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="CLIENT">Client</option>
                </select>
              </label>
              <label className="auth-label">
                Full Name
                <input
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
              <label className="auth-label">
                Email Address
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="auth-label">
                Create Password
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Zm10 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M3 4.5 20 21M9.9 9.4A3.5 3.5 0 0 1 14.6 14M6.7 7.9C4.1 9.8 2.5 12 2.5 12S6.3 18 12 18a9.9 9.9 0 0 0 4.1-.8M16.8 16.1C19.6 14.2 21.5 12 21.5 12S17.7 6 12 6c-1 0-2 .1-2.9.4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
              <label className="auth-label">
                Confirm Password
                <div className="password-input-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Zm10 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M3 4.5 20 21M9.9 9.4A3.5 3.5 0 0 1 14.6 14M6.7 7.9C4.1 9.8 2.5 12 2.5 12S6.3 18 12 18a9.9 9.9 0 0 0 4.1-.8M16.8 16.1C19.6 14.2 21.5 12 21.5 12S17.7 6 12 6c-1 0-2 .1-2.9.4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? <LoadingDots label="Creating account" size="sm" /> : "Create Account"}
              </button>
            </form>

            {status ? <p className="muted muted-light">{status}</p> : null}
            <p className="auth-footnote muted muted-light">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
