import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthVisual } from "../components/AuthVisual";

export const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await signIn(email, password);
      navigate("/portal");
    } catch (err) {
      setError((err as Error).message);
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
                <input
                  type="password"
                  placeholder="Create your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <div className="auth-inline-link">
                <button type="button" className="text-link-btn">
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-submit-btn">
                Login
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
