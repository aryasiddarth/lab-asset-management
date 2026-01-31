import axiosClient from "./axiosClient.js";

export async function getAssets() {
  const res = await axiosClient.get("/assets");
  return res.data;
}

export async function getAssetById(id) {
  const res = await axiosClient.get(`/assets/${id}`);
  return res.data;
}

export async function createAsset(payload) {
  const res = await axiosClient.post("/assets", payload);
  return res.data;
}

export async function updateAsset(assetId, payload) {
  const res = await axiosClient.put(`/assets/${assetId}`, payload);
  return res.data;
}

export async function deleteAsset(assetId) {
  const res = await axiosClient.delete(`/assets/${assetId}`);
  return res.data;
}
