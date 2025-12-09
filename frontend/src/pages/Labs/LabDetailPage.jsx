import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as labApi from "../../api/labApi.js";
import * as assetApi from "../../api/assetApi.js";

function LabDetailPage() {
  const { labId } = useParams();
  const [lab, setLab] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [labData, assetData] = await Promise.all([
          labApi.getLabById(labId),
          assetApi.getAssets({ labId }),
        ]);
        setLab(labData);
        setAssets(assetData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [labId]);

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
    </div>
  );
}

export default LabDetailPage;
