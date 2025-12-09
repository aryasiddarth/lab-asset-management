import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as assetApi from "../../api/assetApi.js";

function AssetDetailPage() {
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await assetApi.getAssetById(assetId);
        setAsset(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assetId]);

  if (loading) return <p>Loading asset...</p>;
  if (!asset) return <p>Asset not found</p>;

  return (
    <div>
      <h1>Asset {asset.assetTag}</h1>
      <p>
        <strong>Status:</strong> {asset.status}
      </p>
      <p>
        <strong>Lab:</strong> {asset.lab?.name || "-"}
      </p>
      <p>
        <strong>Model:</strong> {asset.model?.name || "-"}
      </p>
      <p>
        <strong>Serial Number:</strong> {asset.serialNumber || "-"}
      </p>
      <p>
        <strong>Purchase Date:</strong>{" "}
        {asset.purchaseDate
          ? new Date(asset.purchaseDate).toLocaleDateString()
          : "-"}
      </p>
      <p>
        <strong>Warranty Expiry:</strong>{" "}
        {asset.warrantyExpiry
          ? new Date(asset.warrantyExpiry).toLocaleDateString()
          : "-"}
      </p>
      {asset.remarks && (
        <p>
          <strong>Remarks:</strong> {asset.remarks}
        </p>
      )}
    </div>
  );
}

export default AssetDetailPage;
