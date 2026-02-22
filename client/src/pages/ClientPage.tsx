import { NavLink, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { MessagesPanel } from "../components/MessagesPanel";
import { clientService } from "../services/client.service";
import type { User } from "../types/api";
import { formatName } from "../utils/name";
import { messagesService } from "../services/messages.service";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dashboardIcon from "../assets/icons/dashboard-square-02.svg";
import projectsIcon from "../assets/icons/cursor-pointer-01.svg";
import requestIcon from "../assets/icons/compaignapprovalprocess.svg";
import adminMessageIcon from "../assets/icons/user-group.svg";
import employeeMessageIcon from "../assets/icons/individualuser.svg";

type Props = {
  user: User;
};

export const ClientPage = ({ user }: Props) => {
  const { section } = useParams<{ section?: string }>();
  const activeSection = section ?? "dashboard";
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const loadAll = useCallback(async (silent = false) => {
    try {
      const [projectData, requestData, conversationData] = await Promise.all([
        clientService.getProjects(),
        clientService.getServiceRequests(),
        messagesService.getConversations(),
      ]);
      setProjects(projectData as any[]);
      setRequests(requestData as any[]);
      setMessages(conversationData as any[]);
      if (!silent) {
        setStatus("");
      }
    } catch (error) {
      if (!silent) {
        setStatus((error as Error).message);
      }
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const pollId = window.setInterval(() => {
      // Keep client data fresh so admin approvals appear without manual refresh.
      void loadAll(true);
    }, 3000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [loadAll]);

  const onRequestService = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await clientService.createServiceRequest({
        projectName,
        projectDescription,
        notes: notes.trim() || undefined,
      });
      setProjectName("");
      setProjectDescription("");
      setNotes("");
      await loadAll();
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const serviceSummary = useMemo(() => {
    const approved = requests.filter((entry) => entry.status === "APPROVED").length;
    const pending = requests.filter((entry) => entry.status === "PENDING").length;
    const rejected = requests.filter((entry) => entry.status === "REJECTED").length;
    return {
      total: requests.length,
      approved,
      pending,
      rejected,
    };
  }, [requests]);

  const messageSummary = useMemo(() => {
    const sent = messages.filter((item) => item.senderId === user.id);
    const sentToAdmin = sent.filter((item) => item.receiver?.role === "ADMIN").length;
    const sentToEmployee = sent.filter((item) => item.receiver?.role === "EMPLOYEE").length;
    return {
      totalMessages: sentToAdmin + sentToEmployee,
      sentToAdmin,
      sentToEmployee,
    };
  }, [messages, user.id]);

  const serviceChartData = [
    { name: "Approved", value: serviceSummary.approved },
    { name: "Pending", value: serviceSummary.pending },
    { name: "Rejected", value: serviceSummary.rejected },
  ];

  const messageChartData = [
    { name: "Admin", value: messageSummary.sentToAdmin },
    { name: "Employees", value: messageSummary.sentToEmployee },
  ];

  const renderDashboard = () => (
    <>
      <section className="card">
        <h3>Client Dashboard</h3>
        <p className="muted">Track service requests and communication activity quickly.</p>
      </section>
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Total Services Requested</p>
            <h3>{serviceSummary.total}</h3>
            <p className="muted summary-inline">
              <span className="summary-approved">Appr: {serviceSummary.approved}</span> |{" "}
              <span className="summary-pending">Pend: {serviceSummary.pending}</span> |{" "}
              <span className="summary-rejected">Rej: {serviceSummary.rejected}</span>
            </p>
          </div>
          <img src={requestIcon} alt="" />
        </article>
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Total Messages</p>
            <h3>{messageSummary.totalMessages}</h3>
          </div>
          <img src={dashboardIcon} alt="" />
        </article>
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Message Sent To Admin</p>
            <h3>{messageSummary.sentToAdmin}</h3>
          </div>
          <img src={adminMessageIcon} alt="" />
        </article>
        <article className="admin-stat-card">
          <div>
            <p className="admin-stat-label">Message Sent To Employee</p>
            <h3>{messageSummary.sentToEmployee}</h3>
          </div>
          <img src={employeeMessageIcon} alt="" />
        </article>
      </section>
      <section className="card admin-chart-card">
        <h3>Service Request Status</h3>
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={serviceChartData} barCategoryGap="45%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={false} />
            <Bar dataKey="value" fill="#000047" radius={[8, 8, 0, 0]} maxBarSize={68} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="card admin-chart-card">
        <h3>Messages Split</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Tooltip />
            <Pie data={messageChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              <Cell fill="#000047" />
              <Cell fill="#3f6bff" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </section>
    </>
  );

  const renderProjects = () => (
    <section className="card">
      <h3>View Projects</h3>
      {projects.map((project) => (
        <div className="list-item" key={project.id}>
          <p>
            <strong>{project.name}</strong> ({project.status})
          </p>
          <p>{project.description}</p>
          <p>
            Assigned employees:{" "}
            {(project.assignments ?? []).map((assignment: any) => formatName(assignment.employee?.fullName)).join(", ") || "None"}
          </p>
        </div>
      ))}
    </section>
  );

  const renderRequestService = () => (
    <section className="card">
      <h3>Request New Service</h3>
      <form className="stack request-service-form" onSubmit={onRequestService}>
        <label className="request-field">
          <span className="request-label">
            Project Name <span className="required-mark">*</span>
          </span>
          <input className="request-input" value={projectName} onChange={(event) => setProjectName(event.target.value)} required />
        </label>
        <label className="request-field">
          <span className="request-label">
            Project Description <span className="required-mark">*</span>
          </span>
          <textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} rows={3} required />
        </label>
        <label className="request-field">
          <span className="request-label">Additional Notes</span>
          <input className="request-input" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button type="submit" className="request-submit-btn">
          Submit Request
        </button>
      </form>
      {requests.map((entry) => (
        <p key={entry.id} className="list-item">
          {entry.service?.name} - {entry.status}
        </p>
      ))}
    </section>
  );

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar card">
        <h2 className="admin-brand">Client</h2>
        <NavLink to="/portal/client/dashboard" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={dashboardIcon} alt="" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/portal/client/view-projects" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={projectsIcon} alt="" />
          <span>View Projects</span>
        </NavLink>
        <NavLink
          to="/portal/client/request-service"
          className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
        >
          <img src={requestIcon} alt="" />
          <span>Request New Service</span>
        </NavLink>
        <NavLink to="/portal/client/message-admin" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={adminMessageIcon} alt="" />
          <span>Message Admin</span>
        </NavLink>
        <NavLink
          to="/portal/client/message-employees"
          className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
        >
          <img src={employeeMessageIcon} alt="" />
          <span>Message Assigned Employees</span>
        </NavLink>
      </aside>
      <section className="admin-main">
        <header className="header-row">
          <h1>
            {activeSection === "dashboard" ? (
              <span className="welcome-title">
                <span className="welcome-prefix">Welcome Back, </span>
                <span className="welcome-name">{formatName(user.fullName)}</span>
              </span>
            ) : null}
            {activeSection === "view-projects" ? "View Projects" : null}
            {activeSection === "request-service" ? "Request New Service" : null}
            {activeSection === "message-admin" ? "Message Admin" : null}
            {activeSection === "message-employees" ? "Message Assigned Employees" : null}
          </h1>
          <button type="button" onClick={() => void loadAll()}>
            Refresh Data
          </button>
        </header>
        {status ? <p className="muted">{status}</p> : null}
        {activeSection === "dashboard" ? renderDashboard() : null}
        {activeSection === "view-projects" ? renderProjects() : null}
        {activeSection === "request-service" ? renderRequestService() : null}
        {activeSection === "message-admin" ? (
          <MessagesPanel currentUserId={user.id} title="Message Admin" receiverRoleFilter="ADMIN" />
        ) : null}
        {activeSection === "message-employees" ? (
          <MessagesPanel currentUserId={user.id} title="Message Assigned Employees" receiverRoleFilter="EMPLOYEE" />
        ) : null}
      </section>
    </main>
  );
};
