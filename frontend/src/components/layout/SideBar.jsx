import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function Sidebar({ isOpen, onNavigate }) {
  const { user } = useAuth();

  const handleClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
      <div className="sidebar-header">
        <h2>Lab Assets</h2>
        {user && <p className="sidebar-user">{user.name}</p>}
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end onClick={handleClick}>
          Dashboard
        </NavLink>
        <NavLink to="/labs" onClick={handleClick}>
          Labs
        </NavLink>
        <NavLink to="/assets" onClick={handleClick}>
          Assets
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
