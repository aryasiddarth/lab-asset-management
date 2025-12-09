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

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await importExportApi.exportExcel();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "assets.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed");
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
          <h2>Export to Excel</h2>
          <p>Download all assets as an Excel file.</p>
          <button
            className="btn btn-outline"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Assets"}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default ImportExportPage;
