import axiosClient from "./axiosClient.js";

export async function getAssets(filters = {}) {
  const res = await axiosClient.get("/assets", { params: filters });
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
