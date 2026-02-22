import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./hooks/useAuth";
import { AdminPage } from "./pages/AdminPage";
import { EmployeePage } from "./pages/EmployeePage";
import { ClientPage } from "./pages/ClientPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import viewProfileIcon from "./assets/icons/view profile.svg";
import logoutIcon from "./assets/icons/logout.svg";
import profileAvatarDefault from "./assets/icons/profile-avatar-default.png";
import { ProfilePage } from "./pages/ProfilePage";
import { formatName } from "./utils/name";
import { SnackbarProvider } from "./context/SnackbarContext";
import "./App.css";

const Topbar = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  if (!user) return null;

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <strong>{formatName(user.fullName)}</strong> ({user.role})
      </div>
      <div className="topbar-menu" ref={menuRef}>
        <Link className="topbar-link" to="/portal">
          Portal
        </Link>
        <button
          className={`avatar-btn ${open ? "active" : ""}`}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Open profile menu"
        >
          <img src={profileAvatarDefault} alt="Profile avatar" className="avatar-image" />
        </button>
        {open ? (
          <div className="profile-dropdown">
            <div className="profile-dropdown-header">
              <p className="profile-dropdown-name">{formatName(user.fullName)}</p>
              <p className="profile-dropdown-email">{user.email}</p>
            </div>
            <Link className="profile-dropdown-item" to="/profile" onClick={() => setOpen(false)}>
              <img src={viewProfileIcon} alt="" />
              <span>View Profile</span>
            </Link>
            <button
              className="profile-dropdown-item profile-logout-item"
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              <img src={logoutIcon} alt="" />
              <span>Logout</span>
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

const PortalPage = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") {
    return <Navigate to="/portal/admin/dashboard" replace />;
  }

  if (user.role === "CLIENT") {
    return <Navigate to="/portal/client/dashboard" replace />;
  }

  if (user.role === "EMPLOYEE") {
    return <Navigate to="/portal/employee/dashboard" replace />;
  }

  return null;
};

const AdminRoutePage = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/portal" replace />;
  return (
    <>
      <Topbar />
      <AdminPage user={user} />
    </>
  );
};

const ClientRoutePage = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "CLIENT") return <Navigate to="/portal" replace />;
  return (
    <>
      <Topbar />
      <ClientPage user={user} />
    </>
  );
};

const EmployeeRoutePage = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "EMPLOYEE") return <Navigate to="/portal" replace />;
  return (
    <>
      <Topbar />
      <EmployeePage user={user} />
    </>
  );
};

const ProfileRoutePage = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <Topbar />
      <ProfilePage />
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
    <SnackbarProvider>
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
      <Route
        path="/portal/admin/:section"
        element={
          <ProtectedRoute>
            <AdminRoutePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/client/:section"
        element={
          <ProtectedRoute>
            <ClientRoutePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/employee/:section"
        element={
          <ProtectedRoute>
            <EmployeeRoutePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileRoutePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SnackbarProvider>
  );
};

export default App;
