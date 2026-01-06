import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as labApi from "../api/labApi.js";
import * as assetApi from "../api/assetApi.js";
import { getActivities } from "../utils/activityTracker.js";

const PIE_COLORS = ["#E8A05A", "#8D6E63", "#4DB6AC", "#9575CD", "#FFB74D"];

function buildPieData(items, getKey) {
  const counts = {};
  items.forEach((item) => {
    const key = getKey(item) || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts).map(([label, value]) => ({
    label,
    value,
  }));
}

function PieChart({ title, subtitle, data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const gradient = useMemo(() => {
    if (!total) return "conic-gradient(#E8DCC8 0 100%)";

    let current = 0;
    const parts = data.map((item, index) => {
      const start = (current / total) * 100;
      const end = ((current + item.value) / total) * 100;
      current += item.value;
      const color = PIE_COLORS[index % PIE_COLORS.length];
      return `${color} ${start}% ${end}%`;
    });

    return `conic-gradient(${parts.join(", ")})`;
  }, [data, total]);

  return (
    <div className="card dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="dashboard-card-subtitle">{subtitle}</p>}
        </div>
        <span className="dashboard-card-total">{total}</span>
      </div>

      <div className="dashboard-pie">
        <div className="dashboard-pie-chart" style={{ backgroundImage: gradient }}>
          <div className="dashboard-pie-center">
            <span className="dashboard-pie-center-number">{total}</span>
            <span className="dashboard-pie-center-label">Total</span>
          </div>
        </div>

        <ul className="dashboard-pie-legend">
          {data.map((item, index) => {
            const percentage = total ? Math.round((item.value / total) * 100) : 0;
            return (
              <li key={item.label} className="dashboard-pie-legend-item">
                <span
                  className="dashboard-pie-legend-dot"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                <span className="dashboard-pie-legend-label">
                  {item.label}{" "}
                  <span className="dashboard-pie-legend-count">
                    ({item.value}, {percentage}%)
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [labs, setLabs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityRefresh, setActivityRefresh] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [labData, assetData] = await Promise.all([
          labApi.getLabs(),
          assetApi.getAssets(),
        ]);
        setLabs(labData);
        setAssets(assetData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(
    () => ({
      labs: labs.length,
      assets: assets.length,
    }),
    [labs, assets]
  );

  const labPieData = useMemo(
    () => buildPieData(labs, (lab) => lab.department || "Unassigned"),
    [labs]
  );

  const assetPieData = useMemo(
    () => buildPieData(assets, (asset) => asset.status || "UNKNOWN"),
    [assets]
  );

  const recentActivity = useMemo(() => {
    const activities = getActivities();
    
    return activities.map((activity) => ({
      id: activity.id,
      type: "Visit",
      title: activity.page,
      description: `${activity.date} at ${activity.time}`,
      timestamp: activity.timestamp,
      path: activity.path
    }));
  }, [activityRefresh]);
  
  // Refresh activities periodically to show latest
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityRefresh(prev => prev + 1);
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Overview of labs, assets and the latest activity in your lab network.
          </p>
        </div>
      </div>

      <div className="dashboard-layout">
        <section className="dashboard-main">
          <div className="cards-grid dashboard-stats-grid">
            <div
              className="card dashboard-stat-card dashboard-stat-clickable"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/labs")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/labs");
              }}
            >
              <h2>Total Labs</h2>
              <p className="card-number">{stats.labs}</p>
              <p className="dashboard-stat-caption">Active labs in the system</p>
            </div>
            <div
              className="card dashboard-stat-card dashboard-stat-clickable"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/assets")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate("/assets");
              }}
            >
              <h2>Total Assets</h2>
              <p className="card-number">{stats.assets}</p>
              <p className="dashboard-stat-caption">Tracked hardware assets</p>
            </div>
          </div>

          <div className="dashboard-charts-grid">
            <PieChart
              title="Labs by Department"
              subtitle="Distribution of labs across departments"
              data={labPieData}
            />
            <PieChart
              title="Assets by Status"
              subtitle="Health of all registered assets"
              data={assetPieData}
            />
          </div>
        </section>

        <aside className="dashboard-activity">
          <h2>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="dashboard-activity-empty">
              Your recent page visits will appear here. Navigate to different sections to see your activity.
            </p>
          ) : (
            <ul className="dashboard-activity-list">
              {recentActivity.map((event) => (
                <li key={`${event.type}-${event.id}`} className="dashboard-activity-item">
                  <span className="dashboard-activity-pill">{event.type}</span>
                  <div className="dashboard-activity-text">
                    <div className="dashboard-activity-title">{event.title}</div>
                    <div className="dashboard-activity-description">
                      {event.description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

export default DashboardPage;
