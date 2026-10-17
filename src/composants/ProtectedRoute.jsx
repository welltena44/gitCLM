import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuth } = useAuth()

  // Pas connecté
  if (!isAuth) return <Navigate to="/login" replace />

  // Mauvais rôle
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  // Si on l'utilise avec <ProtectedRoute><Dashboard /></ProtectedRoute>
  // ou si on l'utilise comme layout parent avec <Outlet />
  return children ? children : <Outlet />
}