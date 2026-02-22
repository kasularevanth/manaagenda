import { useAuth } from "../hooks/useAuth";
import { ProfileEditor } from "../components/ProfileEditor";

export const ProfilePage = () => {
  const { user, setUser } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <main className="container">
      <section className="profile-hero">
        <h1>Profile</h1>
        <p className="muted">Manage your personal information. Changes here will appear everywhere in the app.</p>
      </section>
      <ProfileEditor user={user} onUpdated={setUser} />
    </main>
  );
};
