import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth.service";
import { AuthVisual } from "../components/AuthVisual";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE" | "CLIENT">("CLIENT");
  const [status, setStatus] = useState("");

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    try {
      await registerUser({ fullName, email, password, role });
      setStatus("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setStatus((error as Error).message);
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
                <select value={role} onChange={(event) => setRole(event.target.value as "ADMIN" | "EMPLOYEE" | "CLIENT")}>
                  <option value="ADMIN">Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="CLIENT">Client</option>
                </select>
              </label>
              <label className="auth-label">
                Full Name
                <input placeholder="Enter your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
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
                Create Password
                <input
                  type="password"
                  placeholder="Create your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button type="submit" className="auth-submit-btn">
                Create Account
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
