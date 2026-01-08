import axiosClient from "./axiosClient.js";

export async function getLabs() {
  const res = await axiosClient.get("/labs");
  return res.data;
}

export async function getLabById(labId) {
  const res = await axiosClient.get(`/labs/${labId}`);
  return res.data;
}

export async function getLabAssets(labId) {
  const res = await axiosClient.get(`/labs/${labId}/assets`);
  return res.data;
}

export async function assignAsset(labId, assetId, quantity) {
  const res = await axiosClient.post(`/labs/${labId}/assign-asset`, {
    assetId,
    quantity
  });
  return res.data;
}

export async function unassignAsset(labId, assetId, quantity) {
  const res = await axiosClient.post(`/labs/${labId}/unassign-asset`, {
    assetId,
    quantity
  });
  return res.data;
}
