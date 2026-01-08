import { useEffect, useState } from "react";
import * as assetApi from "../../api/assetApi.js";
import * as importExportApi from "../../api/importExportApi.js";
import "../../index.css";

function getStatusLabel(status) {
  switch (status) {
    case "WORKING":
      return "Working";
    case "UNDER_REPAIR":
      return "Under Repair";
    case "SCRAPPED":
      return "Scrapped";
    case "LOST":
      return "Lost";
    default:
      return "Working";
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
      return "status-pill status-pill--working";
  }
}

function AssetListPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [newAsset, setNewAsset] = useState({
    assetId: "",
    model: "",
    quantity: "",
    pageNo: "",
    cost: "",
    status: "WORKING",
    entryDate: "",
    purchaseDate: "",
    remarks: ""
  });

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      const data = await assetApi.getAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");

    try {
      await assetApi.createAsset({
        ...newAsset,
        quantity: Number(newAsset.quantity),
        pageNo: Number(newAsset.pageNo),
        cost: Number(newAsset.cost),
        entryDate: newAsset.entryDate
          ? new Date(newAsset.entryDate)
          : null,
        purchaseDate: newAsset.purchaseDate
          ? new Date(newAsset.purchaseDate)
          : null
      });

      setNewAsset({
        assetId: "",
        model: "",
        quantity: "",
        pageNo: "",
        cost: "",
        status: "WORKING",
        entryDate: "",
        purchaseDate: "",
        remarks: ""
      });

      loadAssets();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create asset");
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    try {
      await importExportApi.importExcel(importFile);
      setImportFile(null);
      loadAssets();
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      const res = await importExportApi.exportExcel();
      const blob = new Blob([res.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventory.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Asset Inventory</h1>
      </div>

      <div className="page-columns">
        <section className="page-main">
          {assets.length === 0 ? (
            <p>No assets available.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Assigned</th>
                  <th>Remaining</th>
                  <th>Page No</th>
                  <th>Cost</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  // Get assigned and remaining from API
                  const assigned = a.assignedQuantity || 0;
                  const remaining = a.remainingQuantity !== undefined ? a.remainingQuantity : 0;
                  
                  // Calculate total as assigned + remaining when quantity is not available
                  const total = a.quantity !== undefined && a.quantity !== null ? a.quantity : (assigned + remaining);

                  return (
                    <tr key={a._id}>
                      <td>{a.assetId}</td>
                      <td>{a.model}</td>
                      <td>
                        <span className={getStatusClass(a.status)}>
                          {getStatusLabel(a.status)}
                        </span>
                      </td>
                      <td>{total}</td>
                      <td>{assigned}</td>
                      <td>{remaining}</td>
                      <td>{a.pageNo}</td>
                      <td>{a.cost}</td>
                      <td>{a.remarks || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <aside className="page-aside">
          <h2>Add Asset</h2>
          <form onSubmit={handleCreate} className="form-vertical">
            <label>
              Asset ID
              <input
                value={newAsset.assetId}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, assetId: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Model
              <input
                value={newAsset.model}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, model: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Quantity
              <input
                type="number"
                value={newAsset.quantity}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, quantity: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Page No
              <input
                type="number"
                value={newAsset.pageNo}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, pageNo: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Cost
              <input
                type="number"
                value={newAsset.cost}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, cost: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Status
              <select
                value={newAsset.status}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="WORKING">Working</option>
                <option value="UNDER_REPAIR">Under Repair</option>
                <option value="SCRAPPED">Scrapped</option>
                <option value="LOST">Lost</option>
              </select>
            </label>

            <label>
              Entry Date
              <input
                type="date"
                value={newAsset.entryDate}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, entryDate: e.target.value }))
                }
              />
            </label>

            <label>
              Purchase Date
              <input
                type="date"
                value={newAsset.purchaseDate}
                onChange={(e) =>
                  setNewAsset((p) => ({
                    ...p,
                    purchaseDate: e.target.value
                  }))
                }
              />
            </label>

            <label>
              Remarks
              <textarea
                value={newAsset.remarks}
                onChange={(e) =>
                  setNewAsset((p) => ({ ...p, remarks: e.target.value }))
                }
              />
            </label>

            {error && <div className="error-text">{error}</div>}

            <button className="btn btn-primary">Create Asset</button>
          </form>

          <hr />

          <h2>Import / Export</h2>
          <form onSubmit={handleImport} className="form-vertical">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files[0] || null)}
            />
            <button
              className="btn btn-primary"
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
            {exporting ? "Exporting..." : "Export Inventory"}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default AssetListPage;