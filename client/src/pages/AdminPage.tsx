import { NavLink, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import deleteUsersIcon from "../assets/icons/delete users.svg";

type Props = {
  user: User;
};

export const AdminPage = ({ user }: Props) => {
  const { section } = useParams<{ section?: string }>();
  const activeSection = section ?? "dashboard";
  const [usersRangeDays, setUsersRangeDays] = useState<7 | 30>(7);
  const [projectsRangeDays, setProjectsRangeDays] = useState<7 | 30>(7);
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
  const [userRoleFilter, setUserRoleFilter] = useState<"ALL" | "EMPLOYEE" | "CLIENT">("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyContactFilter, setCompanyContactFilter] = useState("ALL");
  const [companySort, setCompanySort] = useState<"NEWEST" | "OLDEST" | "A_Z">("NEWEST");
  const [showCreateUserPassword, setShowCreateUserPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: "success" | "warning" }>({
    visible: false,
    message: "",
    type: "success",
  });

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "EMPLOYEE" as "EMPLOYEE" | "CLIENT",
  });
  const [newCompany, setNewCompany] = useState({ companyName: "", contactUserId: "" });
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "", clientCompanyId: "" });
  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState({ name: "", description: "", status: "PLANNING", clientCompanyId: "" });

  const loadAll = useCallback(async (silent = false) => {
    try {
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
    if (activeSection !== "services") return;

    const pollId = window.setInterval(() => {
      // Keep service requests fresh so new client submissions appear immediately.
      void loadAll(true);
    }, 3000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [activeSection, loadAll]);

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

  const showSnackbar = (message: string, type: "success" | "warning") => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, visible: false }));
    }, 2600);
  };

  const displayedUsers = useMemo(
    () => users.filter((entry) => userRoleFilter === "ALL" || entry.role === userRoleFilter),
    [userRoleFilter, users],
  );

  const selectedEmployeeIds = useMemo(
    () =>
      selectedUserIds.filter((id) => {
        const userEntry = users.find((entry) => entry.id === id);
        return userEntry?.role === "EMPLOYEE";
      }),
    [selectedUserIds, users],
  );

  const companyContactOptions = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((entry) => {
      if (entry.contactUser?.id) {
        map.set(entry.contactUser.id, formatName(entry.contactUser.fullName));
      }
    });
    return Array.from(map.entries());
  }, [companies]);

  const displayedCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();
    const next = companies.filter((entry) => {
      const matchSearch =
        !query ||
        entry.companyName?.toLowerCase().includes(query) ||
        entry.contactUser?.fullName?.toLowerCase().includes(query) ||
        entry.contactUser?.email?.toLowerCase().includes(query);
      const matchContact = companyContactFilter === "ALL" || entry.contactUser?.id === companyContactFilter;
      return matchSearch && matchContact;
    });

    if (companySort === "A_Z") {
      next.sort((a, b) => (a.companyName ?? "").localeCompare(b.companyName ?? ""));
    } else if (companySort === "OLDEST") {
      next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return next;
  }, [companies, companyContactFilter, companySearch, companySort]);

  const readRequestNote = (notes: string | undefined, key: string) => {
    if (!notes) return "";
    const line = notes
      .split("\n")
      .map((item) => item.trim())
      .find((item) => item.toLowerCase().startsWith(`${key.toLowerCase()}:`));
    return line ? line.slice(key.length + 1).trim() : "";
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

  const getRangeStart = (days: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1));
    return date;
  };

  const filteredUsers = useMemo(() => {
    const rangeStart = getRangeStart(usersRangeDays);
    return users.filter((entry) => entry.createdAt && new Date(entry.createdAt) >= rangeStart);
  }, [users, usersRangeDays]);

  const filteredProjects = useMemo(() => {
    const rangeStart = getRangeStart(projectsRangeDays);
    return projects.filter((entry) => entry.createdAt && new Date(entry.createdAt) >= rangeStart);
  }, [projects, projectsRangeDays]);

  const usersByRoleChartData = useMemo(() => {
    const employeesCount = filteredUsers.filter((entry) => entry.role === "EMPLOYEE").length;
    const clientsCount = filteredUsers.filter((entry) => entry.role === "CLIENT").length;
    return [
      { name: "Employees", count: employeesCount },
      { name: "Clients", count: clientsCount },
    ];
  }, [filteredUsers]);

  const projectsPerUserChartData = useMemo(() => {
    const assignmentCounts = new Map<string, { name: string; projects: number }>();

    filteredProjects.forEach((project) => {
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
  }, [filteredProjects]);

  const trendData = useMemo(() => {
    const trendDays = 30;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const points = Array.from({ length: trendDays }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (trendDays - 1 - index));
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      return {
        key,
        label: date.toLocaleString("en-US", { month: "short", day: "numeric" }),
        users: 0,
        projects: 0,
      };
    });
    const pointMap = new Map(points.map((item) => [item.key, item]));

    users.forEach((entry) => {
      if (!entry.createdAt) return;
      const created = new Date(entry.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`;
      const point = pointMap.get(key);
      if (point) point.users += 1;
    });

    projects.forEach((entry) => {
      if (!entry.createdAt) return;
      const created = new Date(entry.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`;
      const point = pointMap.get(key);
      if (point) point.projects += 1;
    });

    return points;
  }, [projects, users]);

  const renderDashboard = () => (
    <>
      <section className="admin-welcome card">
        <h2 className="welcome-title">
          <span className="welcome-prefix">Welcome Back, </span>
          <span className="welcome-name">{formatName(user.fullName)}</span>
        </h2>
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
        <div className="admin-chart-header">
          <h3>Users Distribution</h3>
          <select
            value={String(usersRangeDays)}
            onChange={(event) => setUsersRangeDays(Number(event.target.value) as 7 | 30)}
            aria-label="Select users distribution time range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={usersByRoleChartData} barCategoryGap="55%" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" padding={{ left: 45, right: 45 }} />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={false} />
            <Legend />
            <Bar dataKey="count" fill="#000047" radius={[8, 8, 0, 0]} maxBarSize={54} minPointSize={4} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="card admin-chart-card">
        <div className="admin-chart-header">
          <h3>Projects Assigned To Employees</h3>
          <select
            value={String(projectsRangeDays)}
            onChange={(event) => setProjectsRangeDays(Number(event.target.value) as 7 | 30)}
            aria-label="Select projects chart time range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={projectsPerUserChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={false} />
            <Legend />
            <Bar dataKey="projects" fill="#3f6bff" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="card admin-chart-card">
        <h3>Users & Projects Trend (30 days)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData}>
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
    <>
      <section className="card">
        <h3>Create User</h3>
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
          <div className="password-input-wrap">
            <input
              type={showCreateUserPassword ? "text" : "password"}
              placeholder="Password"
              value={newUser.password}
              onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCreateUserPassword((prev) => !prev)}
              aria-label={showCreateUserPassword ? "Hide password" : "Show password"}
            >
              {showCreateUserPassword ? (
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
          <select
            value={newUser.role}
            onChange={(event) => setNewUser({ ...newUser, role: event.target.value as "EMPLOYEE" | "CLIENT" })}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="CLIENT">Client</option>
          </select>
          <button type="submit">Create User</button>
        </form>
      </section>

      <section className="card">
        <div className="header-row">
          <h3>Manage Users</h3>
          <div className="header-actions">
            <select
              value={userRoleFilter}
              onChange={(event) => {
                setUserRoleFilter(event.target.value as "ALL" | "EMPLOYEE" | "CLIENT");
                setSelectedUserIds([]);
              }}
              aria-label="Select users role filter"
            >
              <option value="ALL">All Users</option>
              <option value="EMPLOYEE">Employees</option>
              <option value="CLIENT">Clients</option>
            </select>
            <button
              type="button"
              className="delete-user-btn"
              onClick={() =>
                void (async () => {
                  if (selectedUserIds.length === 0) {
                    showSnackbar("Please select users before deleting.", "warning");
                    return;
                  }
                  if (selectedEmployeeIds.length !== selectedUserIds.length) {
                    showSnackbar("Client users cannot be deleted here. Select employee users only.", "warning");
                    return;
                  }
                  await handle(async () => {
                    await Promise.all(selectedEmployeeIds.map((id) => adminService.removeEmployee(id)));
                    setSelectedUserIds([]);
                  });
                  showSnackbar("Selected employee users deleted successfully.", "success");
                })()
              }
              disabled={selectedUserIds.length === 0}
              aria-label="Delete selected users"
            >
              <img src={deleteUsersIcon} alt="" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all users"
                    checked={displayedUsers.length > 0 && displayedUsers.every((entry) => selectedUserIds.includes(entry.id))}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedUserIds(displayedUsers.map((entry) => entry.id));
                      } else {
                        setSelectedUserIds([]);
                      }
                    }}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(entry.id)}
                      onChange={(event) => {
                        setSelectedUserIds((prev) =>
                          event.target.checked ? [...prev, entry.id] : prev.filter((id) => id !== entry.id),
                        );
                      }}
                      aria-label={`Select ${entry.fullName}`}
                    />
                  </td>
                  <td>{formatName(entry.fullName)}</td>
                  <td>{entry.email}</td>
                  <td>{entry.role}</td>
                  <td>
                    {entry.role === "EMPLOYEE" ? (
                      <button
                        type="button"
                        className="delete-user-btn icon-only"
                        onClick={() => void handle(() => adminService.removeEmployee(entry.id))}
                        aria-label={`Delete ${entry.fullName}`}
                      >
                        <img src={deleteUsersIcon} alt="" />
                      </button>
                    ) : (
                      <span className="muted">Not allowed</span>
                    )}
                  </td>
                </tr>
              ))}
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderCompanies = () => {
    const clientUsers = users.filter((entry) => entry.role === "CLIENT");

    return (
      <>
        <section className="card">
          <h3>Create Company</h3>
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
        </section>

        <section className="card">
          <div className="header-row companies-toolbar">
            <h4>Companies List</h4>
            <div className="header-actions">
              <input
                placeholder="Search company or contact"
                value={companySearch}
                onChange={(event) => setCompanySearch(event.target.value)}
              />
              <select value={companyContactFilter} onChange={(event) => setCompanyContactFilter(event.target.value)}>
                <option value="ALL">All Clients</option>
                {companyContactOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={companySort}
                onChange={(event) => setCompanySort(event.target.value as "NEWEST" | "OLDEST" | "A_Z")}
              >
                <option value="NEWEST">Newest</option>
                <option value="OLDEST">Oldest</option>
                <option value="A_Z">Name A-Z</option>
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Client Name</th>
                  <th>Client Email</th>
                  <th>Created On</th>
                </tr>
              </thead>
              <tbody>
                {displayedCompanies.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.companyName}</td>
                    <td>{formatName(entry.contactUser?.fullName)}</td>
                    <td>{entry.contactUser?.email ?? "-"}</td>
                    <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
                {displayedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No companies found for current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </>
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
              <strong>Company:</strong> {entry.clientCompany?.companyName} | <strong>Status:</strong> {entry.status}
            </p>
            <p>
              <strong>Service Type:</strong> {entry.service?.name}
            </p>
            <p>
              <strong>Project Name:</strong> {readRequestNote(entry.notes, "Project Name") || "-"}
            </p>
            <p>
              <strong>Project Description:</strong> {readRequestNote(entry.notes, "Project Description") || "-"}
            </p>
            <p>
              <strong>Additional Notes:</strong> {readRequestNote(entry.notes, "Client Notes") || "-"}
            </p>
            <p>
              <strong>Requested On:</strong>{" "}
              {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "-"}
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

  const employees = useMemo(
    () => users.filter((entry: any) => entry.role === "EMPLOYEE"),
    [users],
  );

  const handleAssignEmployee = async () => {
    if (!assignProjectId || !assignEmployeeId) return;
    const employee = employees.find((e: any) => e.id === assignEmployeeId);
    const employeeName = employee ? formatName(employee.fullName) : "employee";
    setStatus("");
    try {
      await adminService.assignEmployee(assignProjectId, assignEmployeeId);
      await loadAll();
      setAssignEmployeeId("");
      showSnackbar(`Successfully assigned to ${employeeName}.`, "success");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const openEditProject = (project: any) => {
    setEditingProjectId(project.id);
    setEditProject({
      name: project.name,
      description: project.description,
      status: project.status ?? "PLANNING",
      clientCompanyId: project.clientCompanyId ?? "",
    });
  };

  const saveEditProject = async () => {
    if (!editingProjectId) return;
    setStatus("");
    try {
      await adminService.updateProject(editingProjectId, {
        name: editProject.name,
        description: editProject.description,
        status: editProject.status,
        clientCompanyId: editProject.clientCompanyId || undefined,
      });
      await loadAll();
      setEditingProjectId(null);
      setSelectedProjectIds((prev) => prev.filter((id) => id !== editingProjectId));
      showSnackbar("Project updated. Changes reflected everywhere.", "success");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const deleteSelectedProjects = async () => {
    if (selectedProjectIds.length === 0) return;
    const count = selectedProjectIds.length;
    setStatus("");
    try {
      for (const id of selectedProjectIds) {
        await adminService.deleteProject(id);
      }
      await loadAll();
      setSelectedProjectIds([]);
      setEditingProjectId(null);
      showSnackbar(count === 1 ? "Project deleted." : `${count} projects deleted.`, "success");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const renderProjects = () => (
    <>
      <section className="card">
        <h3>Create project</h3>
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
      </section>

      <section className="card">
        <h3>Assign employees to projects</h3>
        <div className="assign-employees-row">
          <select
            value={assignProjectId}
            onChange={(event) => setAssignProjectId(event.target.value)}
            aria-label="Select project"
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.status}) – {project.clientCompany?.companyName}
              </option>
            ))}
          </select>
          <select
            value={assignEmployeeId}
            onChange={(event) => setAssignEmployeeId(event.target.value)}
            aria-label="Select employee"
          >
            <option value="">Select employee</option>
            {employees.map((employee: any) => (
              <option key={employee.id} value={employee.id}>
                {formatName(employee.fullName)} ({employee.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleAssignEmployee()}
            disabled={!assignProjectId || !assignEmployeeId}
          >
            Assign
          </button>
        </div>
        {status ? <p className="muted">{status}</p> : null}
      </section>

      <section className="card">
        <div className="card-header-with-actions">
          <h3>Projects</h3>
          {selectedProjectIds.length > 0 ? (
            <div className="header-actions">
              {selectedProjectIds.length === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const p = projects.find((x: any) => x.id === selectedProjectIds[0]);
                    if (p) openEditProject(p);
                  }}
                >
                  Edit
                </button>
              ) : null}
              <button type="button" onClick={() => void deleteSelectedProjects()} className="danger">
                Delete
              </button>
            </div>
          ) : null}
        </div>
        {editingProjectId ? (
          <div className="edit-project-form card-inner">
            <h4>Edit project</h4>
            <div className="grid-two">
              <input
                placeholder="Project name"
                value={editProject.name}
                onChange={(e) => setEditProject((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                placeholder="Description"
                value={editProject.description}
                onChange={(e) => setEditProject((prev) => ({ ...prev, description: e.target.value }))}
              />
              <select
                value={editProject.status}
                onChange={(e) => setEditProject((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={editProject.clientCompanyId}
                onChange={(e) => setEditProject((prev) => ({ ...prev, clientCompanyId: e.target.value }))}
              >
                <option value="">Select client company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="edit-form-actions">
              <button type="button" onClick={() => void saveEditProject()}>
                Save
              </button>
              <button type="button" onClick={() => { setEditingProjectId(null); setStatus(""); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {status ? <p className="muted">{status}</p> : null}
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-sno">S.No</th>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all projects"
                    checked={projects.length > 0 && projects.every((p: any) => selectedProjectIds.includes(p.id))}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProjectIds(projects.map((p: any) => p.id));
                      else setSelectedProjectIds([]);
                    }}
                  />
                </th>
                <th>Name of the project</th>
                <th>Client company</th>
                <th>Status</th>
                <th>Unassign</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project: any, index: number) => (
                <tr key={project.id}>
                  <td className="col-sno">{index + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${project.name}`}
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={(e) => {
                        setSelectedProjectIds((prev) =>
                          e.target.checked ? [...prev, project.id] : prev.filter((id) => id !== project.id),
                        );
                      }}
                    />
                  </td>
                  <td>{project.name}</td>
                  <td>{project.clientCompany?.companyName ?? "—"}</td>
                  <td>
                    <select
                      value={project.status}
                      onChange={(event) => void handle(() => adminService.updateProject(project.id, { status: event.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                  <td>
                    <div className="project-row-actions">
                      {(project.assignments ?? []).length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        (project.assignments ?? []).map((assignment: any) => (
                          <button
                            key={assignment.employeeUserId}
                            type="button"
                            className="pill"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handle(() => adminService.unassignEmployee(project.id, assignment.employeeUserId));
                            }}
                          >
                            Unassign {formatName(assignment.employee?.fullName)}
                          </button>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No projects yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  return (
    <>
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
          <div className="header-actions">
            <button type="button" onClick={() => void loadAll()}>
              Refresh Data
            </button>
          </div>
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
      <div className={`app-snackbar ${snackbar.visible ? "show" : ""} ${snackbar.type}`}>
        {snackbar.message}
      </div>
    </>
  );
};
