import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./composants/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import GestionnaireLayout from "./layouts/GestionnaireLayout.jsx";
import ValideurLayout from "./layouts/ValideurLayout.jsx";
import JuridiqueLayout from "./layouts/JuridiqueLayout.jsx";
import DashboardAdmin from "./pages/admin/DashboardAdmin.jsx";
import UsersPage from "./pages/admin/Users.jsx";
import TypesContratPage from "./pages/admin/TypesContrat.jsx";
import ReglesValidationPage from "./pages/admin/ReglesValidation.jsx";
import ParametresAlertesPage from "./pages/admin/ParametresAlertes.jsx";
import ValidationsPage from "./pages/admin/ValidationsPage.jsx";
import VersionsPage from "./pages/admin/VersionsPage.jsx";
import JournauxPage from "./pages/admin/JournauxPage.jsx";
import DashboardGestionnaire from "./pages/gestionnaire/DashboardGestionnaire.jsx";
import DashboardValideur from "./pages/valideur/DashboardValideur.jsx";
import DashboardJuridique from "./pages/juridique/DashboardJuridique.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";
import { FeedbackProvider } from "./composants/FeedbackContext.jsx";
import ContractsPage from "./pages/gestionnaire/Contracts.jsx";
import ContractFormPage from "./pages/gestionnaire/ContractForm.jsx";
import ManagerValidationsPage from "./pages/gestionnaire/Validations.jsx";
import ManagerAmendmentsPage from "./pages/gestionnaire/Amendments.jsx";
import ManagerDocumentsPage from "./pages/gestionnaire/Documents.jsx";
import ManagerNotificationsPage from "./pages/gestionnaire/Notifications.jsx";
import ManagerProfilePage from "./pages/gestionnaire/Profile.jsx";
import ManagerDeadlinesPage from "./pages/gestionnaire/Deadlines.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

export default function App() {
  return (
    <FeedbackProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardAdmin />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="types-contrat" element={<TypesContratPage />} />
              <Route path="regles" element={<ReglesValidationPage />} />
              <Route path="alertes" element={<ParametresAlertesPage />} />
              <Route path="contrats" element={<WorkspacePage />} />
              <Route path="validations" element={<ValidationsPage />} />
              <Route path="versions" element={<VersionsPage />} />
              <Route path="journaux" element={<JournauxPage />} />
              <Route path="profil" element={<WorkspacePage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={["GESTIONNAIRE"]} />}>
            <Route path="/gestionnaire" element={<GestionnaireLayout />}>
              <Route index element={<DashboardGestionnaire />} />
              <Route path="contrats" element={<ContractsPage />} />
              <Route path="contrats/:id" element={<ContractsPage />} />
              <Route path="nouveau" element={<ContractFormPage />} />
              <Route path="contrats/:id/modifier" element={<ContractFormPage />} />
              <Route path="validations" element={<ManagerValidationsPage />} />
              <Route path="avenants" element={<ManagerAmendmentsPage />} />
              <Route path="documents" element={<ManagerDocumentsPage />} />
              <Route path="echeances" element={<ManagerDeadlinesPage />} />
              <Route path="notifications" element={<ManagerNotificationsPage />} />
              <Route path="profil" element={<ManagerProfilePage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={["VALIDEUR"]} />}>
            <Route path="/valideur" element={<ValideurLayout />}>
              <Route index element={<DashboardValideur />} />
              <Route path="validations" element={<WorkspacePage />} />
              <Route path="contrats" element={<WorkspacePage />} />
              <Route path="notifications" element={<WorkspacePage />} />
              <Route path="profil" element={<WorkspacePage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={["JURIDIQUE"]} />}>
            <Route path="/juridique" element={<JuridiqueLayout />}>
              <Route index element={<DashboardJuridique />} />
              <Route path="contrats" element={<WorkspacePage />} />
              <Route path="regles" element={<WorkspacePage />} />
              <Route path="validations" element={<WorkspacePage />} />
              <Route path="versions" element={<WorkspacePage />} />
              <Route path="notifications" element={<WorkspacePage />} />
              <Route path="profil" element={<WorkspacePage />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </FeedbackProvider>
  );
}
