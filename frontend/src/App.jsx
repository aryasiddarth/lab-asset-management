import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import MainLayout from "./components/layout/MainLayout.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LabListPage from "./pages/Labs/LabListPage.jsx";
import LabDetailPage from "./pages/Labs/LabDetailPage.jsx";
import AssetListPage from "./pages/Assets/AssetListPage.jsx";
import AssetDetailPage from "./pages/Assets/AssetDetailPage.jsx";
import ImportExportPage from "./pages/ImportExportPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected area */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="labs" element={<LabListPage />} />
        <Route path="labs/:labId" element={<LabDetailPage />} />
        <Route path="assets" element={<AssetListPage />} />
        <Route path="assets/:assetId" element={<AssetDetailPage />} />
        <Route path="import-export" element={<ImportExportPage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
