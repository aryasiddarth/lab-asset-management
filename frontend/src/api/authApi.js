import axiosClient from "./axiosClient.js";

export async function login(email, password) {
  const res = await axiosClient.post("/auth/login", { email, password });
  return res.data;
}
