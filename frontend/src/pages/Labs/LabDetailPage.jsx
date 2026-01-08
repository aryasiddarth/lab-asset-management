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

      <h2 style={{ marginTop: "1.5rem" }}>
        Assigned Assets
      </h2>

      {assignedAssets.length === 0 ? (
        <p>No assets assigned to this lab.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Model</th>
              <th>Page No</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {assignedAssets.map((a) => (
              <tr key={a._id}>
                <td>{a.assetCode}</td>
                <td>{a.model}</td>
                <td>{a.pageNo}</td>
                <td>{a.quantityAssigned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr style={{ margin: "1.5rem 0" }} />

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
                {a.assetId} — remaining {a.remainingQuantity}
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
    </div>
  );
}

export default LabDetailPage;
