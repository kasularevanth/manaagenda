import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { MessagesPanel } from "../components/MessagesPanel";
import { ProfileEditor } from "../components/ProfileEditor";
import { adminService } from "../services/admin.service";
import { clientService } from "../services/client.service";
import type { User } from "../types/api";

type Props = {
  user: User;
  onUserUpdate: (user: User) => void;
};

export const ClientPage = ({ user, onUserUpdate }: Props) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const loadAll = async () => {
    try {
      const [projectData, requestData, serviceData] = await Promise.all([
        clientService.getProjects(),
        clientService.getServiceRequests(),
        adminService.getServices(),
      ]);
      setProjects(projectData as any[]);
      setRequests(requestData as any[]);
      setServices(serviceData as any[]);
      setStatus("");
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const onRequestService = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await clientService.createServiceRequest({ serviceId, notes });
      setServiceId("");
      setNotes("");
      await loadAll();
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <main className="container">
      <h1>Client Portal</h1>
      <p className="muted">{status}</p>
      <section className="card">
        <h3>Request New Service</h3>
        <form className="grid-two" onSubmit={onRequestService}>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} required>
            <option value="">Select service</option>
            {services.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Request notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <button type="submit">Submit Request</button>
        </form>
        {requests.map((entry) => (
          <p key={entry.id} className="list-item">
            {entry.service?.name} - {entry.status}
          </p>
        ))}
      </section>
      <section className="card">
        <h3>Projects</h3>
        {projects.map((project) => (
          <div className="list-item" key={project.id}>
            <p>
              <strong>{project.name}</strong> ({project.status})
            </p>
            <p>{project.description}</p>
            <p>
              Assigned employees:{" "}
              {(project.assignments ?? []).map((assignment: any) => assignment.employee?.fullName).join(", ") || "None"}
            </p>
          </div>
        ))}
      </section>
      <MessagesPanel currentUserId={user.id} />
      <ProfileEditor user={user} onUpdated={onUserUpdate} />
    </main>
  );
};
