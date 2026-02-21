import { NavLink, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { adminService } from "../services/admin.service";
import type { User } from "../types/api";
import { MessagesPanel } from "../components/MessagesPanel";
import { formatName } from "../utils/name";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dashboardIcon from "../assets/icons/dashboard-square-02.svg";
import usersIcon from "../assets/icons/user-group.svg";
import companiesIcon from "../assets/icons/building-03.svg";
import servicesIcon from "../assets/icons/compaignapprovalprocess.svg";
import projectsIcon from "../assets/icons/cursor-pointer-01.svg";
import messagesIcon from "../assets/icons/search-01.svg";
import totalUsersIcon from "../assets/icons/user-group.svg";
import clientsIcon from "../assets/icons/building-03.svg";
import employeesIcon from "../assets/icons/individualuser.svg";
import approvedIcon from "../assets/icons/compaignapprovalprocess.svg";
import assignedProjectsIcon from "../assets/icons/dashboard-square-02.svg";

type Props = {
  user: User;
};

export const AdminPage = ({ user }: Props) => {
  const { section } = useParams<{ section?: string }>();
  const activeSection = section ?? "dashboard";
  const [dashboard, setDashboard] = useState<Record<string, number>>({
    totalUsers: 0,
    clients: 0,
    employees: 0,
    approvedRequests: 0,
    assignedProjects: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "EMPLOYEE" as "EMPLOYEE" | "CLIENT",
  });
  const [newCompany, setNewCompany] = useState({ companyName: "", contactUserId: "" });
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "", clientCompanyId: "" });

  const loadAll = async () => {
    const [d, allUsers, allServices, allClients, allProjects, allRequests] = await Promise.all([
      adminService.getDashboard(),
      adminService.getUsers(),
      adminService.getServices(),
      adminService.getClients(),
      adminService.getProjects(),
      adminService.getServiceRequests(),
    ]);
    setDashboard(d as Record<string, number>);
    setUsers(allUsers as any[]);
    setServices(allServices as any[]);
    setCompanies(allClients as any[]);
    setProjects(allProjects as any[]);
    setRequests(allRequests as any[]);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handle = async (action: () => Promise<unknown>) => {
    setStatus("");
    try {
      await action();
      await loadAll();
      setStatus("Updated successfully.");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    await handle(async () => {
      await adminService.createUser(newUser);
      setNewUser({ fullName: "", email: "", password: "", role: "EMPLOYEE" });
    });
  };

  const statCards = [
    { key: "totalUsers", label: "Total Users", value: dashboard.totalUsers ?? 0, icon: totalUsersIcon },
    { key: "clients", label: "Total Clients", value: dashboard.clients ?? 0, icon: clientsIcon },
    { key: "employees", label: "Total Employees", value: dashboard.employees ?? 0, icon: employeesIcon },
    { key: "approvedRequests", label: "Approved Requests", value: dashboard.approvedRequests ?? 0, icon: approvedIcon },
    {
      key: "assignedProjects",
      label: "Projects Assigned",
      value: dashboard.assignedProjects ?? 0,
      icon: assignedProjectsIcon,
    },
  ];

  const usersByRoleChartData = useMemo(
    () => [
      { name: "Employees", count: dashboard.employees ?? 0 },
      { name: "Clients", count: dashboard.clients ?? 0 },
    ],
    [dashboard.clients, dashboard.employees],
  );

  const projectsPerUserChartData = useMemo(() => {
    const assignmentCounts = new Map<string, { name: string; projects: number }>();

    projects.forEach((project) => {
      (project.assignments ?? []).forEach((assignment: any) => {
        const userId = assignment.employeeUserId as string;
        const name = formatName(assignment.employee?.fullName) || userId.slice(0, 8);
        const existing = assignmentCounts.get(userId);
        if (existing) {
          existing.projects += 1;
        } else {
          assignmentCounts.set(userId, { name, projects: 1 });
        }
      });
    });

    return Array.from(assignmentCounts.values())
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 8);
  }, [projects]);

  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const points = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return {
        key,
        label: date.toLocaleString("en-US", { month: "short" }),
        users: 0,
        projects: 0,
      };
    });
    const pointMap = new Map(points.map((item) => [item.key, item]));

    users.forEach((entry) => {
      if (!entry.createdAt) return;
      const created = new Date(entry.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const point = pointMap.get(key);
      if (point) point.users += 1;
    });

    projects.forEach((entry) => {
      if (!entry.createdAt) return;
      const created = new Date(entry.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const point = pointMap.get(key);
      if (point) point.projects += 1;
    });

    return points;
  }, [projects, users]);

  const renderDashboard = () => (
    <>
      <section className="admin-welcome card">
        <h2>Welcome back, {formatName(user.fullName)}</h2>
        <p className="muted">Manage users, projects and services from one place.</p>
      </section>
      <section className="admin-stats-grid">
        {statCards.map((card) => (
          <article key={card.key} className="admin-stat-card">
            <div>
              <p className="admin-stat-label">{card.label}</p>
              <h3>{card.value}</h3>
            </div>
            <img src={card.icon} alt="" />
          </article>
        ))}
      </section>
      <section className="card admin-chart-card">
        <h3>Users Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={usersByRoleChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#000047" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="card admin-chart-card">
        <h3>Projects Assigned To Employees</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={projectsPerUserChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="projects" fill="#3f6bff" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="card admin-chart-card">
        <h3>Users & Projects Trend</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#000047" strokeWidth={2} />
            <Line type="monotone" dataKey="projects" stroke="#3f6bff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </>
  );

  const renderUsers = () => (
    <section className="card">
      <h3>Manage Users</h3>
      <form className="grid-two" onSubmit={createUser}>
        <input
          placeholder="Full name"
          value={newUser.fullName}
          onChange={(event) => setNewUser({ ...newUser, fullName: event.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
          required
        />
        <select
          value={newUser.role}
          onChange={(event) => setNewUser({ ...newUser, role: event.target.value as "EMPLOYEE" | "CLIENT" })}
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="CLIENT">Client</option>
        </select>
        <button type="submit">Create User</button>
      </form>
      {users.map((entry) => (
        <div key={entry.id} className="list-item">
          {formatName(entry.fullName)} ({entry.role}) - {entry.email}
          {entry.role === "EMPLOYEE" ? (
            <button type="button" onClick={() => void handle(() => adminService.removeEmployee(entry.id))}>
              Remove Employee
            </button>
          ) : null}
        </div>
      ))}
    </section>
  );

  const renderCompanies = () => {
    const clientUsers = users.filter((entry) => entry.role === "CLIENT");

    return (
      <section className="card">
        <h3>Client Companies</h3>
        <form
          className="grid-two"
          onSubmit={(event) => {
            event.preventDefault();
            void handle(async () => {
              await adminService.createClientCompany(newCompany);
              setNewCompany({ companyName: "", contactUserId: "" });
            });
          }}
        >
          <input
            placeholder="Company name"
            value={newCompany.companyName}
            onChange={(event) => setNewCompany({ ...newCompany, companyName: event.target.value })}
            required
          />
          <select
            value={newCompany.contactUserId}
            onChange={(event) => setNewCompany({ ...newCompany, contactUserId: event.target.value })}
            required
          >
            <option value="">Select client contact</option>
            {clientUsers.map((client) => (
              <option key={client.id} value={client.id}>
                {formatName(client.fullName)} ({client.email})
              </option>
            ))}
          </select>
          <button type="submit">Create Company</button>
        </form>
        {companies.map((entry) => (
          <p key={entry.id} className="list-item">
            {entry.companyName} | contact: {formatName(entry.contactUser?.fullName)} ({entry.contactUser?.email})
          </p>
        ))}
      </section>
    );
  };

  const renderServices = () => (
    <>
      <section className="card">
        <h3>Services</h3>
        <form
          className="grid-two"
          onSubmit={(event) => {
            event.preventDefault();
            void handle(async () => {
              await adminService.createService(newService);
              setNewService({ name: "", description: "" });
            });
          }}
        >
          <input
            placeholder="Service name"
            value={newService.name}
            onChange={(event) => setNewService({ ...newService, name: event.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={newService.description}
            onChange={(event) => setNewService({ ...newService, description: event.target.value })}
            required
          />
          <button type="submit">Create Service</button>
        </form>
        {services.map((entry) => (
          <p key={entry.id} className="list-item">
            {entry.name} - {entry.description}
          </p>
        ))}
      </section>
      <section className="card">
        <h3>Service Requests</h3>
        {requests.map((entry) => (
          <div key={entry.id} className="list-item">
            <p>
              {entry.clientCompany?.companyName} requested {entry.service?.name} ({entry.status})
            </p>
            {entry.status === "PENDING" ? (
              <button type="button" onClick={() => void handle(() => adminService.approveRequest(entry.id))}>
                Approve & Create Project
              </button>
            ) : null}
          </div>
        ))}
      </section>
    </>
  );

  const renderProjects = () => (
    <section className="card">
      <h3>Projects</h3>
      <form
        className="grid-two"
        onSubmit={(event) => {
          event.preventDefault();
          void handle(async () => {
            await adminService.createProject(newProject);
            setNewProject({ name: "", description: "", clientCompanyId: "" });
          });
        }}
      >
        <input
          placeholder="Project name"
          value={newProject.name}
          onChange={(event) => setNewProject({ ...newProject, name: event.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={newProject.description}
          onChange={(event) => setNewProject({ ...newProject, description: event.target.value })}
          required
        />
        <select
          value={newProject.clientCompanyId}
          onChange={(event) => setNewProject({ ...newProject, clientCompanyId: event.target.value })}
          required
        >
          <option value="">Select client company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.companyName}
            </option>
          ))}
        </select>
        <button type="submit">Create Project</button>
      </form>
      {projects.map((project) => (
        <div key={project.id} className="list-item">
          <p>
            <strong>{project.name}</strong> ({project.status}) - {project.clientCompany?.companyName}
          </p>
          <div className="grid-two">
            <select
              defaultValue={project.status}
              onChange={(event) => void handle(() => adminService.updateProject(project.id, { status: event.target.value }))}
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return;
                void handle(async () => {
                  await adminService.assignEmployee(project.id, event.target.value);
                  event.target.value = "";
                });
              }}
            >
              <option value="">Assign employee</option>
              {users
                .filter((entry) => entry.role === "EMPLOYEE")
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {formatName(employee.fullName)} ({employee.email})
                  </option>
                ))}
            </select>
          </div>
          {(project.assignments ?? []).map((assignment: any) => (
            <button
              key={assignment.employeeUserId}
              type="button"
              className="pill"
              onClick={() => void handle(() => adminService.unassignEmployee(project.id, assignment.employeeUserId))}
            >
              Unassign {formatName(assignment.employee?.fullName)}
            </button>
          ))}
        </div>
      ))}
    </section>
  );

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar card">
        <h2 className="admin-brand">Admin</h2>
        <NavLink to="/portal/admin/dashboard" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={dashboardIcon} alt="" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/portal/admin/users" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={usersIcon} alt="" />
          <span>Manage Users</span>
        </NavLink>
        <NavLink to="/portal/admin/companies" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={companiesIcon} alt="" />
          <span>Client Companies</span>
        </NavLink>
        <NavLink to="/portal/admin/services" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={servicesIcon} alt="" />
          <span>Services</span>
        </NavLink>
        <NavLink to="/portal/admin/projects" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={projectsIcon} alt="" />
          <span>Projects</span>
        </NavLink>
        <NavLink to="/portal/admin/messaging" className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}>
          <img src={messagesIcon} alt="" />
          <span>Messaging</span>
        </NavLink>
      </aside>
      <section className="admin-main">
        <header className="header-row">
          <h1>
            {activeSection === "dashboard" ? "Dashboard" : null}
            {activeSection === "users" ? "Manage Users" : null}
            {activeSection === "companies" ? "Client Companies" : null}
            {activeSection === "services" ? "Services" : null}
            {activeSection === "projects" ? "Projects" : null}
            {activeSection === "messaging" ? "Messaging" : null}
          </h1>
          <button type="button" onClick={() => void loadAll()}>
            Refresh Data
          </button>
        </header>
        {status ? <p className="muted">{status}</p> : null}
        {activeSection === "dashboard" ? renderDashboard() : null}
        {activeSection === "users" ? renderUsers() : null}
        {activeSection === "companies" ? renderCompanies() : null}
        {activeSection === "services" ? renderServices() : null}
        {activeSection === "projects" ? renderProjects() : null}
        {activeSection === "messaging" ? <MessagesPanel currentUserId={user.id} /> : null}
      </section>
    </main>
  );
};
