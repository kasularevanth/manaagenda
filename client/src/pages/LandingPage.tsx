import dashboardIcon from "../assets/icons/dashboard-square-02.svg";
import userGroupIcon from "../assets/icons/user-group.svg";
import buildingIcon from "../assets/icons/building-03.svg";
import searchIcon from "../assets/icons/search-01.svg";
import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Admin Command Center",
    text: "Manage users, services, project assignments, approvals, and platform-wide operations.",
    icon: dashboardIcon,
  },
  {
    title: "Employee Delivery Hub",
    text: "Track assigned work, update progress, and collaborate with admin and clients.",
    icon: userGroupIcon,
  },
  {
    title: "Client Project Space",
    text: "Request services, monitor project status, and communicate with assigned team members.",
    icon: buildingIcon,
  },
];

export const LandingPage = () => {
  return (
    <main className="landing" id="home">
      <div className="landing-bg-orb orb-one" />
      <div className="landing-bg-orb orb-two" />
      <div className="landing-bg-grid" />
      <header className="landing-topbar container">
        <div className="landing-logo-wrap">
          <div className="landing-logo-mark">V</div>
          <span className="landing-brand">Revanth Software Solutions</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#why-us">Why Choose Us</a>
          <a href="#faq">FAQ&apos;s</a>
        </nav>
        <div className="landing-top-actions" aria-label="authentication actions">
          <Link className="nav-auth-btn nav-auth-login" to="/login">
            Login
          </Link>
          <Link className="nav-auth-btn nav-auth-register" to="/register">
            Register
          </Link>
        </div>
      </header>
      <section className="hero container">
        <p className="eyebrow">Company Management Portal</p>
        <h1>Your Complete Software Company Management Portal</h1>
        <p className="hero-text">
          Secure, role-based operations for Admins, Employees, and Clients with project tracking, service requests, and
          streamlined communication in one clean interface.
        </p>
      </section>
      <section className="container features" id="features">
        {featureCards.map((card) => (
          <article className="feature-card" key={card.title}>
            <img src={card.icon} alt="" className="feature-icon" />
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>
      <section className="container landing-strip">
        <div className="strip-item">
          <img src={searchIcon} alt="" />
          <div>
            <h4>Clear Visibility</h4>
            <p>Track projects by status, client, team members, and timelines.</p>
          </div>
        </div>
        <div className="strip-item">
          <img src={dashboardIcon} alt="" />
          <div>
            <h4>One Dashboard</h4>
            <p>All key operations from request approval to employee assignment in one place.</p>
          </div>
        </div>
      </section>
      <section className="container features" id="why-us">
        <article className="feature-card">
          <h3>Why Choose Us</h3>
          <p>
            Revanth Software Solutions helps companies run delivery operations with clear ownership, secure messaging,
            and role-based access control across admin, employee, and client workflows.
          </p>
        </article>
        <article className="feature-card">
          <h3>Built for Practical Delivery</h3>
          <p>
            From service request approval to project assignment and status tracking, every step is organized to reduce
            communication gaps and improve execution visibility.
          </p>
        </article>
      </section>
      <section className="container features" id="faq">
        <article className="feature-card">
          <h3>FAQ&apos;s</h3>
          <p>
            <strong>Who can create users?</strong> Admin can create and manage users.
            <br />
            <strong>Can employees unassign themselves?</strong> No, only admin can assign or unassign project members.
            <br />
            <strong>How are projects created?</strong> Client requests service, admin approves, project is created.
          </p>
        </article>
      </section>
    </main>
  );
};
