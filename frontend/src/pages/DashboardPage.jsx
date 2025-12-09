import { useEffect, useState } from "react";
import * as labApi from "../api/labApi.js";
import * as assetApi from "../api/assetApi.js";

function DashboardPage() {
  const [stats, setStats] = useState({ labs: 0, assets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const labs = await labApi.getLabs();
        const assets = await assetApi.getAssets();
        setStats({ labs: labs.length, assets: assets.length });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="cards-grid">
        <div className="card">
          <h2>Total Labs</h2>
          <p className="card-number">{stats.labs}</p>
        </div>
        <div className="card">
          <h2>Total Assets</h2>
          <p className="card-number">{stats.assets}</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
