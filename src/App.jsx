import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import DashboardAdmin from "./pages/admin/DashboardAdmin.jsx";
import UsersPage from "./pages/admin/Users.jsx";
import TypesContratPage from "./pages/admin/TypesContrat.jsx";
import ReglesValidationPage from "./pages/admin/ReglesValidation.jsx";
import ParametresAlertesPage from "./pages/admin/ParametresAlertes.jsx";
import ValidationsPage from "./pages/admin/ValidationsPage.jsx";
import VersionsPage from "./pages/admin/VersionsPage.jsx";
import JournauxPage from "./pages/admin/JournauxPage.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardAdmin />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="types-contrat" element={<TypesContratPage />} />
            <Route path="regles" element={<ReglesValidationPage />} />
            <Route path="alertes" element={<ParametresAlertesPage />} />
            <Route path="validations" element={<ValidationsPage />} />
            <Route path="versions" element={<VersionsPage />} />
            <Route path="journaux" element={<JournauxPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;