import { createContext, useState, useContext } from "react";
import api from "../services/api.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });


  const loginUser = (userData) => {
    const { token, ...safeUser } = userData || {};
    if (token) sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const logout = async () => {
    // Journaliser uniquement une déconnexion volontaire, jamais un simple rechargement.
    try {
      await api.post("/auth/logout");
    } catch {
      // La session peut déjà être expirée; le nettoyage local reste nécessaire.
    } finally {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
