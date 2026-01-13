import axiosClient from "./axiosClient.js";

/**
 * Import assets from Excel
 *
 * Backend is expected to:
 * - Create ONE Asset per row
 * - Use quantity column (NOT per-unit creation)
 * - Ignore lab assignment (labs handled separately)
 */
export async function importExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosClient.post("/import/excel", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return res.data;
}

/**
 * Export inventory to Excel
 * Should export:
 * Bill No, Description, Order ID, Quantity, Assigned, Remaining, Page No, Cost, Remarks
 */
export async function exportExcel() {
  return axiosClient.get("/export/excel", {
    responseType: "blob"
  });
}
