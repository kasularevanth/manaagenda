import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./hooks/useAuth";
import { AdminPage } from "./pages/AdminPage";
import { EmployeePage } from "./pages/EmployeePage";
import { ClientPage } from "./pages/ClientPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import dashboardIcon from "./assets/icons/dashboard-square-02.svg";
import userGroupIcon from "./assets/icons/user-group.svg";
import buildingIcon from "./assets/icons/building-03.svg";
import "./App.css";

const PortalPage = () => {
  const { user, signOut, setUser } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <nav className="topbar">
        <div className="topbar-left">
          <strong>{user.fullName}</strong> ({user.role})
        </div>
        <div className="topbar-icons">
          <span className="icon-chip" title="Dashboard">
            <img src={dashboardIcon} alt="Dashboard" />
          </span>
          {user.role === "ADMIN" || user.role === "EMPLOYEE" ? (
            <span className="icon-chip" title="Team">
              <img src={userGroupIcon} alt="Team" />
            </span>
          ) : null}
          {user.role === "CLIENT" ? (
            <span className="icon-chip" title="Client">
              <img src={buildingIcon} alt="Client" />
            </span>
          ) : null}
          <button onClick={() => void signOut()} type="button">
            Logout
          </button>
        </div>
      </nav>
      {user.role === "ADMIN" ? <AdminPage user={user} onUserUpdate={setUser} /> : null}
      {user.role === "EMPLOYEE" ? <EmployeePage user={user} onUserUpdate={setUser} /> : null}
      {user.role === "CLIENT" ? <ClientPage user={user} onUserUpdate={setUser} /> : null}
    </>
  );
};

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <main className="container">Checking session...</main>;
  }
  if (user) return <Navigate to="/portal" replace />;
  return children;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <main className="container">Checking session...</main>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <LandingPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <PortalPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
