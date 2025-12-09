import { useAuth } from "../../context/AuthContext.jsx";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-title">Computer Lab Asset Management</div>
      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user">
              {user.email} ({user.role})
            </span>
            <button className="btn btn-outline" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
