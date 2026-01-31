import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as labApi from "../../api/labApi.js";
import * as assetApi from "../../api/assetApi.js";

function LabDetailPage() {
  const { labId } = useParams();

  const [lab, setLab] = useState(null);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, assignment: null });

  useEffect(() => {
    load();
  }, [labId]);

  async function load() {
    try {
      const [labData, labAssets, assets] = await Promise.all([
        labApi.getLabById(labId),
        labApi.getLabAssets(labId),
        assetApi.getAssets()
      ]);

      setLab(labData);
      setAssignedAssets(labAssets);
      setAllAssets(assets);
    } catch (err) {
      console.error(err);
      setError("Failed to load lab data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!selectedAssetId || !quantity) return;

    try {
      setAssigning(true);
      setError("");

      await labApi.assignAsset(
        labId,
        selectedAssetId,
        Number(quantity)
      );

      setSelectedAssetId("");
      setQuantity("");
      load();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to assign asset"
      );
    } finally {
      setAssigning(false);
    }
  }

  const handleStartEdit = (assignment) => {
    setEditingAssignmentId(assignment._id);
    setEditQuantity(String(assignment.quantityAssigned || ""));
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingAssignmentId(null);
    setEditQuantity("");
    setError("");
  };

  const handleSaveEdit = async (assignment) => {
    if (!editQuantity) return;
    try {
      setError("");
      await labApi.updateLabAsset(
        labId,
        assignment._id,
        Number(editQuantity)
      );
      handleCancelEdit();
      load();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to update assignment"
      );
    }
  };

  const handleDeleteAssignment = (assignment) => {
    setDeleteModal({ show: true, assignment });
  };

  const confirmDelete = async () => {
    if (!deleteModal.assignment) return;

    try {
      setError("");
      await labApi.unassignAsset(
        labId,
        deleteModal.assignment.assetId,
        deleteModal.assignment.quantityAssigned
      );
      setDeleteModal({ show: false, assignment: null });
      load();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to delete assignment"
      );
      setDeleteModal({ show: false, assignment: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, assignment: null });
  };

  if (loading) return <p>Loading lab…</p>;
  if (!lab) return <p>Lab not found</p>;

  const selectedAsset = allAssets.find(
    (a) => a._id === selectedAssetId
  );

  return (
    <div>
      <h1>{lab.name}</h1>
      <p>
        <strong>Code:</strong> {lab.code} |{" "}
        <strong>Department:</strong> {lab.department}
      </p>

      <p>
        <strong>Technician:</strong> {lab.technicianName || "Unassigned"}
      </p>

      {lab.location && (
        <p>
          <strong>Location:</strong> {lab.location}
        </p>
      )}

      {lab.remarks && (
        <p>
          <strong>Remarks:</strong> {lab.remarks}
        </p>
      )}

      <h2>Assign Asset</h2>

      <div className="form-vertical">
        <label>
          Asset
          <select
            value={selectedAssetId}
            onChange={(e) =>
              setSelectedAssetId(e.target.value)
            }
          >
            <option value="">Select asset</option>
            {allAssets.map((a) => (
              <option
                key={a._id}
                value={a._id}
                disabled={a.remainingQuantity === 0}
              >
                {a.assetTag || a.assetId} — remaining {a.remainingQuantity}
              </option>
            ))}
          </select>
        </label>

        {selectedAsset && (
          <p style={{ color: "#6E625C" }}>
            Available: {selectedAsset.remainingQuantity}
          </p>
        )}

        <label>
          Quantity
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        {error && (
          <div className="error-text">{error}</div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleAssign}
          disabled={
            assigning ||
            !selectedAssetId ||
            !quantity
          }
        >
          {assigning ? "Assigning…" : "Assign"}
        </button>
      </div>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2 style={{ marginTop: "1.5rem" }}>
        Assigned Assets
      </h2>

      {assignedAssets.length === 0 ? (
        <p>No assets assigned to this lab.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Page No</th>
              <th>Quantity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assignedAssets.map((a) => (
              <tr key={a._id}>
                <td>{a.assetCode}</td>
                <td>{a.pageNo || "-"}</td>
                <td>
                  {editingAssignmentId === a._id ? (
                    <input
                      type="number"
                      min="1"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      style={{ maxWidth: "90px" }}
                    />
                  ) : (
                    a.quantityAssigned
                  )}
                </td>
                <td>
                  {editingAssignmentId === a._id ? (
                    <>
                      <button
                        className="link"
                        type="button"
                        onClick={() => handleSaveEdit(a)}
                      >
                        Save
                      </button>
                      <button
                        className="link"
                        type="button"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="link"
                        type="button"
                        onClick={() => handleStartEdit(a)}
                      >
                        Edit
                      </button>
                      <button
                        className="link"
                        type="button"
                        onClick={() => handleDeleteAssignment(a)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteModal.show && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>
              Remove <strong>{deleteModal.assignment?.assetCode}</strong> from this lab?
            </p>
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

export default LabDetailPage;
