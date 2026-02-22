import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthVisual } from "../components/AuthVisual";
import { LoadingDots } from "../components/LoadingDots";

export const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/portal");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="container auth-two-col">
        <AuthVisual />
        <section className="auth-card auth-card-dark">
          <div className="auth-form-wrap">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="muted muted-light auth-subtitle">Login with your account credentials.</p>

            <form onSubmit={onLogin} className="auth-form">
              <label className="auth-label">
                Email Address
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className="auth-label">
                Password
                <div className="password-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
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

              <div className="auth-inline-link">
                <button type="button" className="text-link-btn">
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? <LoadingDots label="Logging in" size="sm" /> : "Login"}
              </button>
            </form>

            {error ? <p className="error">{error}</p> : null}

            <p className="auth-footnote muted muted-light">
              Don&apos;t have an account? <Link to="/register">SignUp</Link>
            </p>
            <p className="auth-footnote muted muted-light">
              <Link to="/">Back to landing</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
