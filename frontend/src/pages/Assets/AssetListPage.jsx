import { useEffect, useState } from "react";
import * as assetApi from "../../api/assetApi.js";
import * as labApi from "../../api/labApi.js";
import * as importExportApi from "../../api/importExportApi.js";

function getStatusLabel(status) {
  switch (status) {
    case "WORKING":
      return "Working";
    case "UNDER_REPAIR":
      return "Under repair";
    case "SCRAPPED":
      return "Scrapped";
    case "LOST":
      return "Lost";
    default:
      return status || "Unknown";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "WORKING":
      return "status-pill status-pill--working";
    case "UNDER_REPAIR":
      return "status-pill status-pill--repair";
    case "SCRAPPED":
      return "status-pill status-pill--scrapped";
    case "LOST":
      return "status-pill status-pill--lost";
    default:
      return "status-pill";
  }
}

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
  // Import / Export state
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setError("");
    try {
      const result = await importExportApi.importExcel(importFile);
      setImportResult(result);
      // Refresh assets after import
      const updatedAssets = await assetApi.getAssets();
      setAssets(updatedAssets);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Import failed. Check the Excel file format."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await importExportApi.exportExcel();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "assets.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed");
    } finally {
      setExporting(false);
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
                    <td>
                      <span className={getStatusClass(asset.status)}>
                        {getStatusLabel(asset.status)}
                      </span>
                    </td>
                    <td>{asset.model?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="page-aside">
          <h2>Add Asset</h2>
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

          <hr style={{ margin: "1.25rem 0", border: "none", borderTop: "1px solid #E8DCC8" }} />

          <h2>Import / Export</h2>
          <form onSubmit={handleImport} className="form-vertical">
            <label>
              Import from Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0] || null)}
              />
            </label>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={!importFile || importing}
            >
              {importing ? "Importing..." : "Import"}
            </button>
          </form>

          <button
            className="btn btn-outline"
            style={{ marginTop: "0.75rem", width: "100%" }}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Assets to Excel"}
          </button>

          {importResult && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <h3>Import summary</h3>
              <pre className="pre">
                {JSON.stringify(importResult, null, 2)}
              </pre>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AssetListPage;
