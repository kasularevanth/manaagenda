import { NavLink, Navigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessagesPanel } from "../components/MessagesPanel";
import { employeeService } from "../services/employee.service";
import { messagesService } from "../services/messages.service";
import type { User } from "../types/api";
import { formatName } from "../utils/name";
import { useSnackbar } from "../context/SnackbarContext";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dashboardIcon from "../assets/icons/dashboard-square-02.svg";
import projectsIcon from "../assets/icons/cursor-pointer-01.svg";
import messagesIcon from "../assets/icons/search-01.svg";
import assignedProjectsIcon from "../assets/icons/dashboard-square-02.svg";
import adminMessageIcon from "../assets/icons/user-group.svg";
import employeeMessageIcon from "../assets/icons/individualuser.svg";

type MessageRecord = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; fullName: string; role?: string };
  receiver?: { id: string; fullName: string; role?: string };
};

type Props = {
  user: User;
};

export const EmployeePage = ({ user }: Props) => {
  const { section } = useParams<{ section?: string }>();
  const activeSection = section ?? "dashboard";
  const showSnackbar = useSnackbar().showSnackbar;
  const [projects, setProjects] = useState<any[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [status, setStatus] = useState("");

  const loadAll = useCallback(async (silent = false) => {
    try {
      const [projectData, conversationData] = await Promise.all([
        employeeService.getProjects(),
        messagesService.getConversations(),
      ]);
      setProjects(projectData as any[]);
      setMessages((conversationData as MessageRecord[]) ?? []);
      if (!silent) setStatus("");
    } catch (error) {
      if (!silent) setStatus((error as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const pollId = window.setInterval(() => void loadAll(true), 3000);
    return () => window.clearInterval(pollId);
  }, [loadAll]);

  const messageSummary = useMemo(() => {
    const withAdmin = messages.filter(
      (m) =>
        (m.senderId === user.id && m.receiver?.role === "ADMIN") ||
        (m.receiverId === user.id && m.sender?.role === "ADMIN"),
    ).length;
    const withClient = messages.filter(
      (m) =>
        (m.senderId === user.id && m.receiver?.role === "CLIENT") ||
        (m.receiverId === user.id && m.sender?.role === "CLIENT"),
    ).length;
    return {
      total: withAdmin + withClient,
      messagesAdmin: withAdmin,
      messagesClient: withClient,
    };
  }, [messages, user.id]);

  const barChartData = useMemo(
    () => [
      { name: "Assigned Projects", value: projects.length },
      { name: "Messages (Admin)", value: messageSummary.messagesAdmin },
      { name: "Messages (Client)", value: messageSummary.messagesClient },
    ],
    [projects.length, messageSummary.messagesAdmin, messageSummary.messagesClient],
  );

  const lineChartData = useMemo(() => {
    const days = 7;
    const result: { label: string; messages: number; projects: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const label = dayStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const msgCount = messages.filter((m) => {
        const t = new Date(m.createdAt).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      }).length;
      result.push({ label, messages: msgCount, projects: 0 });
    }
    return result;
  }, [messages]);

  const renderDashboard = () => (
    <>
      <section className="card">
        <h3>Employee Dashboard</h3>
        <p className="muted">Overview of your assigned projects and messaging activity.</p>
      </section>
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Total Assigned Projects</p>
            <h3>{projects.length}</h3>
          </div>
          <img src={assignedProjectsIcon} alt="" />
        </article>
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Total Messages</p>
            <h3>{messageSummary.total}</h3>
            <p className="muted summary-inline">
              Admin: {messageSummary.messagesAdmin} | Client: {messageSummary.messagesClient}
            </p>
          </div>
          <img src={dashboardIcon} alt="" />
        </article>
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Messages (Admin)</p>
            <h3>{messageSummary.messagesAdmin}</h3>
          </div>
          <img src={adminMessageIcon} alt="" />
        </article>
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Messages (Client)</p>
            <h3>{messageSummary.messagesClient}</h3>
          </div>
          <img src={employeeMessageIcon} alt="" />
        </article>
      </section>
      <section className="card admin-chart-card">
        <h3>Projects & Messages Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData} barCategoryGap="40%" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={false} />
            <Legend />
            <Bar dataKey="value" fill="#3f6bff" radius={[8, 8, 0, 0]} maxBarSize={56} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="card admin-chart-card">
        <h3>Messages (Last 7 days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="messages" stroke="#3f6bff" strokeWidth={2} name="Messages" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </>
  );

  const renderProjects = () => (
    <section className="card">
      <h3>Assigned Projects</h3>
      {status ? <p className="muted">{status}</p> : null}
      {projects.map((project) => (
        <div key={project.id} className="list-item">
          <p>
            <strong>{project.name}</strong> – {project.description}
          </p>
          <p>Client: {project.clientCompany?.companyName}</p>
          <select
            value={project.status}
            onChange={async (event) => {
              setStatus("");
              try {
                await employeeService.updateProjectStatus(project.id, event.target.value);
                await loadAll();
                showSnackbar("Project status updated.", "success");
              } catch (error) {
                setStatus((error as Error).message);
              }
            }}
          >
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      ))}
      {projects.length === 0 ? <p className="muted">No projects assigned yet.</p> : null}
    </section>
  );

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar card">
        <h2 className="admin-brand">Employee</h2>
        <NavLink
          to="/portal/employee/dashboard"
          className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
        >
          <img src={dashboardIcon} alt="" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/portal/employee/projects"
          className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
        >
          <img src={projectsIcon} alt="" />
          <span>Assigned Projects</span>
        </NavLink>
        <NavLink
          to="/portal/employee/message-admin"
          className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
        >
          <img src={messagesIcon} alt="" />
          <span>Message admin</span>
        </NavLink>
        <NavLink
          to="/portal/employee/message-client"
          className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
        >
          <img src={messagesIcon} alt="" />
          <span>Message client</span>
        </NavLink>
      </aside>
      <section className="admin-main">
        <header className="header-row">
          <h1>
            {activeSection === "dashboard" ? (
              <span className="welcome-title">
                <span className="welcome-prefix">Welcome back, </span>
                <span className="welcome-name">{formatName(user.fullName)}</span>
              </span>
            ) : null}
            {activeSection === "projects" ? "Assigned Projects" : null}
            {activeSection === "message-admin" ? "Message admin" : null}
            {activeSection === "message-client" ? "Message client" : null}
          </h1>
          <button type="button" onClick={() => void loadAll()}>
            Refresh Data
          </button>
        </header>
        {activeSection === "dashboard" ? renderDashboard() : null}
        {activeSection === "projects" ? renderProjects() : null}
        {activeSection === "messaging" ? <Navigate to="/portal/employee/message-admin" replace /> : null}
        {activeSection === "message-admin" ? (
          <MessagesPanel currentUserId={user.id} title="Message admin" receiverRoleFilter="ADMIN" />
        ) : null}
        {activeSection === "message-client" ? (
          <MessagesPanel currentUserId={user.id} title="Message client" receiverRoleFilter="CLIENT" />
        ) : null}
      </section>
    </main>
  );
};
