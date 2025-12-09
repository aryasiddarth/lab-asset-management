import axiosClient from "./axiosClient.js";

export async function importExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosClient.post("/import/excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export function exportExcel(params = {}) {
  // Download Excel file
  return axiosClient.get("/export/excel", {
    params,
    responseType: "blob",
  });
}
