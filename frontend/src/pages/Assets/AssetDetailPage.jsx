import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as assetApi from "../../api/assetApi.js";

function AssetDetailPage() {
  const { assetId } = useParams();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [assetId]);

  async function load() {
    try {
      const data = await assetApi.getAssetById(assetId);
      setAsset(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load asset");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading asset…</p>;
  if (error) return <p>{error}</p>;
  if (!asset) return <p>Asset not found</p>;

  return (
    <div>
      <h1>Asset {asset.assetId}</h1>

      <div style={{ marginBottom: "1rem" }}>
        <p><strong>Model:</strong> {asset.model}</p>
        <p><strong>Page No:</strong> {asset.pageNo}</p>
        <p><strong>Cost:</strong> {asset.cost}</p>

        {asset.entryDate && (
          <p>
            <strong>Entry Date:</strong>{" "}
            {new Date(asset.entryDate).toLocaleDateString()}
          </p>
        )}

        {asset.purchaseDate && (
          <p>
            <strong>Purchase Date:</strong>{" "}
            {new Date(asset.purchaseDate).toLocaleDateString()}
          </p>
        )}

        {asset.remarks && (
          <p>
            <strong>Remarks:</strong> {asset.remarks}
          </p>
        )}
      </div>

      <hr />

      <h2>Quantity Summary</h2>
      <ul>
        <li><strong>Total:</strong> {asset.quantity}</li>
        <li><strong>Assigned:</strong> {asset.assignedQuantity}</li>
        <li><strong>Remaining:</strong> {asset.remainingQuantity}</li>
      </ul>

      <hr />

      <h2>Lab Allocation</h2>

      {asset.allocations?.length === 0 ? (
        <p>This asset is not assigned to any lab.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Lab</th>
              <th>Department</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {asset.allocations.map((a) => (
              <tr key={a.labId}>
                <td>
                  <Link to={`/labs/${a.labId}`}>
                    {a.labCode}
                  </Link>
                </td>
                <td>{a.department}</td>
                <td>{a.quantityAssigned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AssetDetailPage;
