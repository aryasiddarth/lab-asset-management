import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as labApi from "../../api/labApi.js";
import * as assetApi from "../../api/assetApi.js";

function LabDetailPage() {
  const { labId } = useParams();
  const [lab, setLab] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // A. Add new state
  const [unassignedAssets, setUnassignedAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [assigning, setAssigning] = useState(false);

  // B. Load unassigned assets
  useEffect(() => {
    async function load() {
      try {
        const [labData, assetData, unassigned] = await Promise.all([
          labApi.getLabById(labId),
          assetApi.getAssets({ labId }),
          assetApi.getUnassignedAssets(),
        ]);
        setLab(labData);
        setAssets(assetData);
        setUnassignedAssets(unassigned);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [labId]);

  // C. Add assign handler
  const handleAssignAsset = async () => {
    if (!selectedAsset) return;

    try {
      setAssigning(true);

      await labApi.assignAsset(labId, selectedAsset);

      // Refresh lab assets
      const updatedAssets = await assetApi.getAssets({ labId });
      setAssets(updatedAssets);

      // Refresh stock
      const updatedUnassigned = await assetApi.getUnassignedAssets();
      setUnassignedAssets(updatedUnassigned);

      setSelectedAsset("");
    } catch (err) {
      console.error(err);
      alert("Failed to assign asset");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <p>Loading lab...</p>;
  if (!lab) return <p>Lab not found</p>;

  return (
    <div>
      <h1>{lab.name}</h1>
      <p>
        <strong>Code:</strong> {lab.code} | <strong>Department:</strong>{" "}
        {lab.department}
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

      <h2 style={{ marginTop: "1.5rem" }}>Assets in this Lab</h2>
      {assets.length === 0 ? (
        <p>No assets yet in this lab.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Model</th>
              <th>Status</th>
              <th>Purchase Date</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset._id}>
                <td>
                  <Link to={`/assets/${asset._id}`}>{asset.assetTag}</Link>
                </td>
                <td>{asset.model?.name || "-"}</td>
                <td>{asset.status}</td>
                <td>
                  {asset.purchaseDate
                    ? new Date(asset.purchaseDate).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* D. Add Assign UI block */}
      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Assign Asset to this Lab</h2>

      {unassignedAssets.length === 0 ? (
        <p>No unassigned assets available.</p>
      ) : (
        <>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
          >
            <option value="">Select asset</option>
            {unassignedAssets.map((asset) => (
              <option key={asset._id} value={asset._id}>
                {asset.assetTag} — {asset.model?.name || "No model"}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            style={{ marginLeft: "0.75rem" }}
            onClick={handleAssignAsset}
            disabled={!selectedAsset || assigning}
          >
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </>
      )}
    </div>
  );
}

export default LabDetailPage;