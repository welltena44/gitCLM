
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [isClosed, setIsClosed] = useState(false);

  const getStoredUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
        localStorage.getItem("utilisateur") ||
        "{}"
      );
    } catch {
      return {};
    }
  };

  const user = getStoredUser();
  const matricule = user.matricule || user.id || "";

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("utilisateur");
    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  return (
    <div className="admin-layout">
      <Sidebar isClosed={isClosed} />

      <div className="admin-main">
        <div className="admin-topbar">
          <button
            className="menu-toggle-btn"
            onClick={() => setIsClosed(!isClosed)}
            aria-label="Ouvrir ou fermer le menu"
          >
            <i
              className={`fa-solid ${
                isClosed ? "fa-bars" : "fa-xmark"
              }`}
            ></i>
          </button>

          <div className="topbar-right">
            <div className="user-top">
              <i className="fa-solid fa-circle-user"></i>
              <span>
                Matricule : {matricule || "Indisponible"}
              </span>
            </div>

            <button
              className="logout-top-btn"
              onClick={handleLogout}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              {" "}Déconnexion
            </button>
          </div>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
