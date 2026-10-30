import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuth } = useAuth();
  const path = window.location.pathname;

  // Pas connecté
  if (!isAuth) return <Navigate to="/login" replace />;
  if (user?.changementMotDePasseRequis && path !== "/change-password")
    return <Navigate to="/change-password" replace />;
  if (!user?.changementMotDePasseRequis && path === "/change-password")
    return <Navigate to="/" replace />;

  // Mauvais rôle
  if (roles && user && !roles.includes(user.role)) {
    const homeByRole = {
      ADMIN: "/admin",
      GESTIONNAIRE: "/gestionnaire",
      JURIDIQUE: "/juridique",
      VALIDEUR: "/valideur",
    };
    return <Navigate to={homeByRole[user.role] || "/login"} replace />;
  }

  // Si on l'utilise avec <ProtectedRoute><Dashboard /></ProtectedRoute>
  // ou si on l'utilise comme layout parent avec <Outlet />
  return children ? children : <Outlet />;
}
