import { useEffect, useState } from "react";
import * as assetApi from "../../api/assetApi.js";
import * as labApi from "../../api/labApi.js";

function AssetListPage() {
  const [assets, setAssets] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ labId: "", status: "" });

  // Simple form to create a new asset
  const [newAsset, setNewAsset] = useState({
    assetTag: "",
    labId: "",
    status: "WORKING",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [assetData, labData] = await Promise.all([
          assetApi.getAssets(),
          labApi.getLabs(),
        ]);
        setAssets(assetData);
        setLabs(labData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredAssets = assets.filter((a) => {
    if (filters.labId && a.labId !== filters.labId) return false;
    if (filters.status && a.status !== filters.status) return false;
    return true;
  });

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const created = await assetApi.createAsset(newAsset);
      setAssets((prev) => [...prev, created]);
      setNewAsset({ assetTag: "", labId: "", status: "WORKING" });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create asset");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p>Loading assets...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Assets</h1>
      </div>

      <div className="page-columns">
        <section className="page-main">
          <div className="filters">
            <label>
              Lab
              <select
                name="labId"
                value={filters.labId}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {labs.map((lab) => (
                  <option key={lab._id} value={lab._id}>
                    {lab.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="WORKING">Working</option>
                <option value="UNDER_REPAIR">Under Repair</option>
                <option value="SCRAPPED">Scrapped</option>
                <option value="LOST">Lost</option>
              </select>
            </label>
          </div>

          {filteredAssets.length === 0 ? (
            <p>No assets found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Lab</th>
                  <th>Status</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td>{asset.assetTag}</td>
                    <td>{asset.lab?.code || "-"}</td>
                    <td>{asset.status}</td>
                    <td>{asset.model?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="page-aside">
          <h2>Add Asset (minimal)</h2>
          <form onSubmit={handleCreateAsset} className="form-vertical">
            <label>
              Asset Tag
              <input
                value={newAsset.assetTag}
                onChange={(e) =>
                  setNewAsset((prev) => ({
                    ...prev,
                    assetTag: e.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Lab
              <select
                value={newAsset.labId}
                onChange={(e) =>
                  setNewAsset((prev) => ({ ...prev, labId: e.target.value }))
                }
                required
              >
                <option value="">Select lab</option>
                {labs.map((lab) => (
                  <option key={lab._id} value={lab._id}>
                    {lab.code}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                value={newAsset.status}
                onChange={(e) =>
                  setNewAsset((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="WORKING">Working</option>
                <option value="UNDER_REPAIR">Under Repair</option>
                <option value="SCRAPPED">Scrapped</option>
                <option value="LOST">Lost</option>
              </select>
            </label>

            {error && <div className="error-text">{error}</div>}

            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Asset"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

export default AssetListPage;
