import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth.service";
import { AuthVisual } from "../components/AuthVisual";
import { useAuth } from "../hooks/useAuth";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"" | "ADMIN" | "EMPLOYEE" | "CLIENT">("");
  const [status, setStatus] = useState("");

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
    try {
      await registerUser({ fullName, email, password, role });
      await signIn(email, password);
      setStatus("Account created successfully. Redirecting to portal...");
      setTimeout(() => navigate("/portal"), 500);
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
                <input
                  type="password"
                  placeholder="Create your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <label className="auth-label">
                Confirm Password
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
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
