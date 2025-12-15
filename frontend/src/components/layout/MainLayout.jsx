import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import "./layout.css";

function MainLayout() {
  // Start with sidebar open; it will collapse after the user chooses a section.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarOpen((open) => !open);
  };

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavigate = () => {
    // Collapse sidebar once a section is chosen
    setSidebarOpen(false);
  };

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <Sidebar isOpen={sidebarOpen} onNavigate={handleNavigate} />

      <div className="app-main">
        <Navbar onToggleSidebar={handleToggleSidebar} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* Hover zone at the left edge to reopen sidebar on any screen size */}
      <div className="sidebar-hover-zone" onMouseEnter={handleOpenSidebar} />
    </div>
  );
}

export default MainLayout;
