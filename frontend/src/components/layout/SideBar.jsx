import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Lab Assets</h2>
        {user && <p className="sidebar-user">{user.name}</p>}
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/labs">Labs</NavLink>
        <NavLink to="/assets">Assets</NavLink>
        <NavLink to="/import-export">Import / Export</NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
