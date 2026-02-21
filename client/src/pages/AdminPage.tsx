import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminService } from "../services/admin.service";
import type { User } from "../types/api";
import { MessagesPanel } from "../components/MessagesPanel";
import { ProfileEditor } from "../components/ProfileEditor";

type Props = {
  user: User;
  onUserUpdate: (user: User) => void;
};

export const AdminPage = ({ user, onUserUpdate }: Props) => {
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
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
    setClients(allClients as any[]);
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

  return (
    <main className="container">
      <header className="header-row">
        <h1>Admin Portal</h1>
      </header>
      <p className="muted">{status}</p>
      <section className="card">
        <h3>Dashboard Stats</h3>
        <div className="stats">
          <span>Employees: {dashboard.employees ?? 0}</span>
          <span>Clients: {dashboard.clients ?? 0}</span>
          <span>Projects: {dashboard.projects ?? 0}</span>
          <span>Pending Requests: {dashboard.pendingRequests ?? 0}</span>
        </div>
      </section>
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
            {entry.fullName} ({entry.role}) - {entry.email}
            {entry.role === "EMPLOYEE" ? (
              <button type="button" onClick={() => void handle(() => adminService.removeEmployee(entry.id))}>
                Remove Employee
              </button>
            ) : null}
          </div>
        ))}
      </section>
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
          <input
            placeholder="Client contact user ID"
            value={newCompany.contactUserId}
            onChange={(event) => setNewCompany({ ...newCompany, contactUserId: event.target.value })}
            required
          />
          <button type="submit">Create Company</button>
        </form>
        {clients.map((entry) => (
          <p key={entry.id} className="list-item">
            {entry.companyName} | contact: {entry.contactUser?.fullName}
          </p>
        ))}
      </section>
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
          <input
            placeholder="Client company ID"
            value={newProject.clientCompanyId}
            onChange={(event) => setNewProject({ ...newProject, clientCompanyId: event.target.value })}
            required
          />
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
                onChange={(event) =>
                  void handle(() => adminService.updateProject(project.id, { status: event.target.value }))
                }
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <input
                placeholder="Employee ID to assign"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const input = event.currentTarget;
                    void handle(async () => {
                      await adminService.assignEmployee(project.id, input.value);
                      input.value = "";
                    });
                  }
                }}
              />
            </div>
            {(project.assignments ?? []).map((assignment: any) => (
              <button
                key={assignment.employeeUserId}
                type="button"
                className="pill"
                onClick={() => void handle(() => adminService.unassignEmployee(project.id, assignment.employeeUserId))}
              >
                Unassign {assignment.employee?.fullName}
              </button>
            ))}
          </div>
        ))}
      </section>
      <MessagesPanel currentUserId={user.id} />
      <ProfileEditor user={user} onUpdated={onUserUpdate} />
    </main>
  );
};
