import { useAuth } from "../hooks/useAuth";
import { ProfileEditor } from "../components/ProfileEditor";

export const ProfilePage = () => {
  const { user, setUser } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <main className="container">
      <section className="profile-hero card">
        <h1>Profile</h1>
        <p className="muted">Manage your personal information and keep your account details updated.</p>
        <div className="profile-meta">
          <span className="profile-badge">{user.role}</span>
          <span>{user.email}</span>
        </div>
      </section>
      <ProfileEditor user={user} onUpdated={setUser} />
    </main>
  );
};
