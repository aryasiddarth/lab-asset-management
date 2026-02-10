import { useAuth } from "../../context/AuthContext.jsx";
import mitLogo from "../../assets/mit-logo.png";

function getInitials(user) {
  if (!user) return "?";
  if (user.name) {
    const parts = user.name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return "?";
}

function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="icon-button navbar-burger"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="navbar-brand">
          <img src={mitLogo} alt="Lab Asset logo" className="navbar-logo" />
          <div className="navbar-brand-text">
            <span className="navbar-title">School of Computer Engineering</span>
            <span className="navbar-subtitle">Lab Asset Management</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {user && (
          <div className="navbar-account">
            <div className="navbar-avatar">{getInitials(user)}</div>
            <div className="navbar-account-text">
              <div className="navbar-account-name">
                {user.name || user.email || "Logged in user"}
              </div>
              <div className="navbar-account-meta">
                {user.email}
                {user.role ? ` · ${user.role}` : ""}
              </div>
            </div>
            <button className="btn btn-outline" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
