import { useState } from "react";
import * as importExportApi from "../api/importExportApi.js";

function ImportExportPage() {
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const result = await importExportApi.importExcel(file);
      setImportResult(result);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Import failed. Check file format."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await importExportApi.exportExcel();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Excel export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const res = await importExportApi.exportPdf();
      const blob = new Blob([res.data], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h1>Import / Export</h1>

      <div className="page-columns">
        <section className="page-main">
          <h2>Import from Excel</h2>
          <form onSubmit={handleImport} className="form-vertical">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            {error && <div className="error-text">{error}</div>}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!file || importing}
            >
              {importing ? "Importing..." : "Import"}
            </button>
          </form>

          {importResult && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <h3>Import summary</h3>
              <pre className="pre">
                {JSON.stringify(importResult, null, 2)}
              </pre>
            </div>
          )}
        </section>

        <aside className="page-aside">
          <h2>Export Inventory</h2>
          <p>Download all assets (assigned and unassigned) as Excel or PDF.</p>
          <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
            <button
              className="btn btn-outline"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "Export as Excel"}
            </button>
            <button
              className="btn btn-outline"
              onClick={handleExportPdf}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "Export as PDF"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ImportExportPage;
