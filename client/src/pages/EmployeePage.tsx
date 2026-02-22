import { useEffect, useState } from "react";
import { MessagesPanel } from "../components/MessagesPanel";
import { employeeService } from "../services/employee.service";
import type { User } from "../types/api";
import { useSnackbar } from "../context/SnackbarContext";

type Props = {
  user: User;
};

export const EmployeePage = ({ user }: Props) => {
  const showSnackbar = useSnackbar().showSnackbar;
  const [projects, setProjects] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const loadProjects = async () => {
    try {
      const data = (await employeeService.getProjects()) as any[];
      setProjects(data);
      setStatus("");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  return (
    <main className="container">
      <h1>Employee Portal</h1>
      <p className="muted">{status}</p>
      <section className="card">
        <h3>Assigned Projects</h3>
        {projects.map((project) => (
          <div key={project.id} className="list-item">
            <p>
              <strong>{project.name}</strong> - {project.description}
            </p>
            <p>Client: {project.clientCompany?.companyName}</p>
            <select
              defaultValue={project.status}
              onChange={async (event) => {
                setStatus("");
                try {
                  await employeeService.updateProjectStatus(project.id, event.target.value);
                  await loadProjects();
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
      </section>
      <MessagesPanel currentUserId={user.id} />
    </main>
  );
};
