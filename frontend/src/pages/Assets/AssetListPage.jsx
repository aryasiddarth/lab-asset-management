import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import * as assetApi from "../../api/assetApi.js";
import * as stockApi from "../../api/stockApi.js";
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState("assets"); // "assets" or "stocks"
  
  // Assets state
  const [assets, setAssets] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ labId: "", status: "" });

  // Simple form to create a new asset
  const [newAsset, setNewAsset] = useState({
    assetTag: "",
    status: "WORKING",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  // Import / Export state
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Stocks state
  const [stocks, setStocks] = useState([]);
  const [stockFilters, setStockFilters] = useState({ labId: "" });
  const [newStock, setNewStock] = useState({
    stockId: "",
    quantity: 1,
    purchaseDate: new Date().toISOString().split('T')[0],
    labId: "",
    remarks: ""
  });
  const [creatingStock, setCreatingStock] = useState(false);
  const [stockError, setStockError] = useState("");
  const [editingStock, setEditingStock] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [assetData, stockData, labData] = await Promise.all([
          assetApi.getAssets(),
          stockApi.getStocks(),
          labApi.getLabs(),
        ]);
        setAssets(assetData);
        setStocks(stockData);
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
      setNewAsset({ assetTag: "", status: "WORKING" });
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

  const filteredStocks = stocks.filter((s) => {
    if (stockFilters.labId && s.labId !== stockFilters.labId) return false;
    return true;
  });

  const handleStockFilterChange = (e) => {
    const { name, value } = e.target;
    setStockFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateStock = async (e) => {
    e.preventDefault();
    setCreatingStock(true);
    setStockError("");
    try {
      const payload = {
        ...newStock,
        labId: newStock.labId || null,
        purchaseDate: newStock.purchaseDate ? new Date(newStock.purchaseDate).toISOString() : new Date().toISOString()
      };
      const created = await stockApi.createStock(payload);
      setStocks((prev) => [...prev, created]);
      setNewStock({
        stockId: "",
        quantity: 1,
        purchaseDate: new Date().toISOString().split('T')[0],
        labId: "",
        remarks: ""
      });
    } catch (err) {
      setStockError(err?.response?.data?.message || "Failed to create stock");
    } finally {
      setCreatingStock(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!editingStock) return;
    setCreatingStock(true);
    setStockError("");
    try {
      const payload = {
        ...editingStock,
        labId: editingStock.labId || null,
        purchaseDate: editingStock.purchaseDate ? new Date(editingStock.purchaseDate).toISOString() : new Date().toISOString()
      };
      const updated = await stockApi.updateStock(editingStock._id, payload);
      setStocks((prev) => prev.map(s => s._id === updated._id ? updated : s));
      setEditingStock(null);
    } catch (err) {
      setStockError(err?.response?.data?.message || "Failed to update stock");
    } finally {
      setCreatingStock(false);
    }
  };

  const handleDeleteStock = async (id) => {
    if (!confirm("Are you sure you want to delete this stock?")) return;
    try {
      await stockApi.deleteStock(id);
      setStocks((prev) => prev.filter(s => s._id !== id));
    } catch (err) {
      setStockError(err?.response?.data?.message || "Failed to delete stock");
    }
  };

  const handleEditStock = (stock) => {
    setEditingStock({
      ...stock,
      purchaseDate: stock.purchaseDate ? new Date(stock.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Assets/Stocks</h1>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #ecebea" }}>
        <button
          className="btn"
          style={{
            marginRight: "0.5rem",
            marginBottom: "0.5rem",
            background: activeTab === "assets" ? "#f58232" : "transparent",
            color: activeTab === "assets" ? "white" : "#3A2F2A",
            border: "1px solid #ecebea"
          }}
          onClick={() => setActiveTab("assets")}
        >
          Assets
        </button>
        <button
          className="btn"
          style={{
            marginBottom: "0.5rem",
            background: activeTab === "stocks" ? "#f58232" : "transparent",
            color: activeTab === "stocks" ? "white" : "#3A2F2A",
            border: "1px solid #ecebea"
          }}
          onClick={() => setActiveTab("stocks")}
        >
          Stocks
        </button>
      </div>

      {activeTab === "assets" && (

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
      )}

      {activeTab === "stocks" && (
        <div className="page-columns">
          <section className="page-main">
            <div className="filters">
              <label>
                Lab
                <select
                  name="labId"
                  value={stockFilters.labId}
                  onChange={handleStockFilterChange}
                >
                  <option value="">All</option>
                  <option value="null">Unassigned</option>
                  {labs.map((lab) => (
                    <option key={lab._id} value={lab._id}>
                      {lab.code}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filteredStocks.length === 0 ? (
              <p>No stocks found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Stock ID</th>
                    <th>Quantity</th>
                    <th>Purchase Date</th>
                    <th>Lab</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => (
                    <tr key={stock._id}>
                      <td>{stock.stockId}</td>
                      <td>{stock.quantity}</td>
                      <td>{stock.purchaseDate ? new Date(stock.purchaseDate).toLocaleDateString() : "-"}</td>
                      <td>{stock.lab?.code || "Unassigned"}</td>
                      <td>
                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-outline"
                              style={{ marginRight: "0.5rem", fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                              onClick={() => handleEditStock(stock)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", color: "#c62828" }}
                              onClick={() => handleDeleteStock(stock._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {!isAdmin && <span style={{ color: "#6E625C", fontSize: "0.8rem" }}>View only</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {isAdmin && (
          <aside className="page-aside">
            <h2>{editingStock ? "Edit Stock" : "Add Stock"}</h2>
            <form onSubmit={editingStock ? handleUpdateStock : handleCreateStock} className="form-vertical">
              <label>
                Stock ID
                <input
                  value={editingStock ? editingStock.stockId : newStock.stockId}
                  onChange={(e) =>
                    editingStock
                      ? setEditingStock((prev) => ({ ...prev, stockId: e.target.value }))
                      : setNewStock((prev) => ({ ...prev, stockId: e.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  min="0"
                  value={editingStock ? editingStock.quantity : newStock.quantity}
                  onChange={(e) =>
                    editingStock
                      ? setEditingStock((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                      : setNewStock((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                  }
                  required
                />
              </label>

              <label>
                Purchase Date
                <input
                  type="date"
                  value={editingStock ? editingStock.purchaseDate : newStock.purchaseDate}
                  onChange={(e) =>
                    editingStock
                      ? setEditingStock((prev) => ({ ...prev, purchaseDate: e.target.value }))
                      : setNewStock((prev) => ({ ...prev, purchaseDate: e.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Assign to Lab
                <select
                  value={editingStock ? (editingStock.labId || "") : (newStock.labId || "")}
                  onChange={(e) =>
                    editingStock
                      ? setEditingStock((prev) => ({ ...prev, labId: e.target.value }))
                      : setNewStock((prev) => ({ ...prev, labId: e.target.value }))
                  }
                >
                  <option value="">Unassigned</option>
                  {labs.map((lab) => (
                    <option key={lab._id} value={lab._id}>
                      {lab.code} - {lab.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Remarks
                <input
                  value={editingStock ? (editingStock.remarks || "") : (newStock.remarks || "")}
                  onChange={(e) =>
                    editingStock
                      ? setEditingStock((prev) => ({ ...prev, remarks: e.target.value }))
                      : setNewStock((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                />
              </label>

              {stockError && <div className="error-text">{stockError}</div>}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-primary" type="submit" disabled={creatingStock}>
                  {creatingStock ? "Saving..." : editingStock ? "Update Stock" : "Create Stock"}
                </button>
                {editingStock && (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => setEditingStock(null)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </aside>
          )}
          
          {!isAdmin && (
            <aside className="page-aside">
              <h2>Stock Management</h2>
              <p style={{ color: "#6E625C", fontSize: "0.9rem" }}>
                Only administrators can create, edit, or delete stocks.
              </p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

export default AssetListPage;