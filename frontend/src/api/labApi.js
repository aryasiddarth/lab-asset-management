import axiosClient from "./axiosClient.js";

export async function getLabs() {
  const res = await axiosClient.get("/labs");
  return res.data;
}

export async function getLabById(id) {
  const res = await axiosClient.get(`/labs/${id}`);
  return res.data;
}

export async function createLab(payload) {
  const res = await axiosClient.post("/labs", payload);
  return res.data;
}
