import axiosClient from "./axiosClient.js";

export async function getStocks(filters = {}) {
  const res = await axiosClient.get("/stocks", { params: filters });
  return res.data;
}

export async function getStockById(id) {
  const res = await axiosClient.get(`/stocks/${id}`);
  return res.data;
}

export async function createStock(payload) {
  const res = await axiosClient.post("/stocks", payload);
  return res.data;
}

export async function updateStock(id, payload) {
  const res = await axiosClient.put(`/stocks/${id}`, payload);
  return res.data;
}

export async function deleteStock(id) {
  const res = await axiosClient.delete(`/stocks/${id}`);
  return res.data;
}

