import { createContext, useState, useContext, useEffect } from "react";
import { reportSessionEnd } from "../services/api.js";

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

  useEffect(() => {
    if (!user) return undefined;
    const logTabClose = () => {
      reportSessionEnd();
    };
    window.addEventListener("pagehide", logTabClose);
    return () => window.removeEventListener("pagehide", logTabClose);
  }, [user]);

  const loginUser = (userData) => {
    const { token, ...safeUser } = userData || {};
    if (token) sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const logout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
