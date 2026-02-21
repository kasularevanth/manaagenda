import dashboardIcon from "../assets/icons/dashboard-square-02.svg";
import userGroupIcon from "../assets/icons/user-group.svg";
import buildingIcon from "../assets/icons/building-03.svg";

const cards = [
  { label: "Admin Control", icon: dashboardIcon },
  { label: "Team Collaboration", icon: userGroupIcon },
  { label: "Client Workspace", icon: buildingIcon },
];

export const AuthVisual = () => {
  return (
    <section className="auth-visual">
      <div className="auth-ring" />
      <p className="auth-brand">Revanth Software Solutions</p>
      <h2>Secure Project Operations</h2>
      <p className="auth-visual-text">Plan, assign, approve, and deliver software projects with role-based access.</p>
      <div className="auth-visual-cards">
        {cards.map((card) => (
          <article className="auth-mini-card" key={card.label}>
            <img src={card.icon} alt="" />
            <span>{card.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
};
