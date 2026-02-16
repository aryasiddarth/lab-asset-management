import { useEffect, useState, useRef } from "react";
import * as assetApi from "../../api/assetApi.js";
import * as importExportApi from "../../api/importExportApi.js";
import "../../index.css";
import { useAuth } from "../../context/AuthContext.jsx";

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
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, asset: null });

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const tableRef = useRef(null);
  const formRef = useRef(null);

  const [newAsset, setNewAsset] = useState({
    assetTag: "",        // ADDED: assetTag field
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

  const toDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const resetForm = () => {
    setNewAsset({
      assetTag: "",
      model: "",
      quantity: "",
      pageNo: "",
      cost: "",
      status: "WORKING",
      entryDate: "",
      purchaseDate: "",
      remarks: ""
    });
    setEditingAssetId(null);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      assetTag: newAsset.assetTag,
      model: newAsset.model,
      quantity: Number(newAsset.quantity),
      pageNo: Number(newAsset.pageNo),
      cost: Number(newAsset.cost),
      status: newAsset.status,
      purchaseDate: newAsset.purchaseDate
        ? new Date(newAsset.purchaseDate)
        : null,
      remarks: newAsset.remarks
    };

    try {
      if (editingAssetId) {
        await assetApi.updateAsset(editingAssetId, payload);
      } else {
        await assetApi.createAsset(payload);
      }

      resetForm();
      loadAssets();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${editingAssetId ? "update" : "create"} asset`
      );
    }
  }

  const handleStartEdit = (asset) => {
    setEditingAssetId(asset._id);
    setNewAsset({
      assetTag: asset.assetTag || "",
      model: asset.model || "",
      quantity: asset.quantity ?? "",
      pageNo: asset.pageNo ?? "",
      cost: asset.cost ?? "",
      status: asset.status || "WORKING",
      entryDate: "",
      purchaseDate: toDateInput(asset.purchaseDate),
      remarks: asset.remarks || ""
    });
    setError("");
    
    // Scroll to top and highlight form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (formRef.current) {
      formRef.current.classList.add('highlight-flash');
      setTimeout(() => {
        formRef.current?.classList.remove('highlight-flash');
      }, 1000);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setError("");
  };

  const handleDeleteAsset = (asset) => {
    setDeleteModal({ show: true, asset });
  };

  const confirmDelete = async () => {
    if (!deleteModal.asset) return;

    try {
      setError("");
      await assetApi.deleteAsset(deleteModal.asset._id);
      setDeleteModal({ show: false, asset: null });
      loadAssets();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to delete asset"
      );
      setDeleteModal({ show: false, asset: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, asset: null });
  };

  const scrollTable = (direction) => {
    if (tableRef.current) {
      const scrollAmount = 300;
      tableRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
          {/* ADDED: Table header for Asset Tag and SL No */}
          {assets.length === 0 ? (
            <p>No assets available.</p>
          ) : (
            <>
              <div className="scroll-controls">
                <button
                  className="scroll-btn scroll-btn-left"
                  onClick={() => scrollTable('left')}
                  title="Scroll left"
                >
                  ←
                </button>
                <button
                  className="scroll-btn scroll-btn-right"
                  onClick={() => scrollTable('right')}
                  title="Scroll right"
                >
                  →
                </button>
              </div>
              <div className="table-responsive" ref={tableRef}>
            <table className="table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Page No</th>
                  <th>Purchase Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Assigned</th>
                  <th>Remaining</th>
                  <th>Cost</th>
                  <th>Remarks</th>
                  {isAdmin && <th></th>}
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
                      <td className="font-mono">{a.assetTag || "-"}</td>
                      <td>{a.pageNo}</td>
                      <td>
                        {a.purchaseDate
                          ? new Date(a.purchaseDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>
                        <span className={getStatusClass(a.status)}>
                          {getStatusLabel(a.status)}
                        </span>
                      </td>
                      <td>{total}</td>
                      <td>{assigned}</td>
                      <td>{remaining}</td>
                      <td>{a.cost}</td>
                      <td>{a.remarks || "-"}</td>
                      {isAdmin && (
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn action-btn-edit"
                              type="button"
                              onClick={() => handleStartEdit(a)}
                            >
                              Edit
                            </button>
                            <button
                              className="action-btn action-btn-delete"
                              type="button"
                              onClick={() => handleDeleteAsset(a)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            </>
          )}
        </section>

        <aside className="page-aside" ref={formRef}>
          {isAdmin ? (
            <>
              <h2>{editingAssetId ? "Edit Asset" : "Add Asset"}</h2>
              <form onSubmit={handleSubmit} className="form-vertical">
                {/* ADDED: Asset Tag field */}
                <label>
                  Asset Tag *
                  <input
                    value={newAsset.assetTag}
                    onChange={(e) =>
                      setNewAsset((p) => ({ ...p, assetTag: e.target.value }))
                    }
                    placeholder="e.g., CL-1-1"
                    required
                  />
                  <small className="text-gray-500 text-xs mt-1 block">
                    Unique identifier for the asset
                  </small>
                </label>

                {/* SL No removed: field no longer used */}

                {/* Asset ID removed: using Asset Tag instead */}

                <label>
                  Model *
                  <input
                    value={newAsset.model}
                    onChange={(e) =>
                      setNewAsset((p) => ({ ...p, model: e.target.value }))
                    }
                    required
                  />
                </label>

                <label>
                  Quantity *
                  <input
                    type="number"
                    value={newAsset.quantity}
                    onChange={(e) =>
                      setNewAsset((p) => ({ ...p, quantity: e.target.value }))
                    }
                    min="1"
                    required
                  />
                </label>

                <label>
                  Page No *
                  <input
                    type="number"
                    value={newAsset.pageNo}
                    onChange={(e) =>
                      setNewAsset((p) => ({ ...p, pageNo: e.target.value }))
                    }
                    min="1"
                    required
                  />
                </label>

                <label>
                  Cost *
                  <input
                    type="number"
                    value={newAsset.cost}
                    onChange={(e) =>
                      setNewAsset((p) => ({ ...p, cost: e.target.value }))
                    }
                    min="0"
                    step="0.01"
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

                <div className="text-xs text-gray-600 mb-3">
                  <p className="font-semibold">Note:</p>
                  <ul className="list-disc pl-4 mt-1">
                    <li>Fields marked with * are required</li>
                    <li>Asset Tag must be unique</li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit">
                    {editingAssetId ? "Save Changes" : "Create Asset"}
                  </button>
                  {editingAssetId && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <hr />
            </>
          ) : (
            <p className="muted-text">Only admins can add assets.</p>
          )}

          <h2>Import / Export</h2>
          {isAdmin ? (
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
          ) : (
            <p className="muted-text">Only admins can import assets.</p>
          )}

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

      {deleteModal.show && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete asset{" "}
              <strong>{deleteModal.asset?.assetTag}</strong>?
            </p>
            {deleteModal.asset?.assignedQuantity > 0 && (
              <p className="error-text">
                Warning: This asset has {deleteModal.asset.assignedQuantity} units assigned to labs.
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={confirmDelete}>
                Confirm
              </button>
              <button className="btn btn-secondary" onClick={cancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetListPage;