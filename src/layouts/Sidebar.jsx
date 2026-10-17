import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ isClosed }) {
  const location = useLocation();

  const [admin, setAdmin] = useState({
    matricule: "",
    nom: "",
    prenom: "",
  });

  // États pour contrôler l'ouverture/fermeture des sections rétractables
  const [openParametres, setOpenParametres] = useState(true);
  const [openLectureSeule, setOpenLectureSeule] = useState(true);

  useEffect(() => {
    const stored =
      localStorage.getItem("user") ||
      localStorage.getItem("utilisateur");

    if (stored) {
      try {
        const u = JSON.parse(stored);
        setAdmin({
          matricule: u.matricule || u.id || "",
          nom: u.nom || "",
          prenom: u.prenom || "",
        });
      } catch (error) {
        console.error("Erreur de lecture des informations utilisateur", error);
      }
    }
  }, []);

  return (
    <div className={`modernSidebar-nav ${isClosed ? "closed" : ""}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">
          <i className="fa-solid fa-anchor"></i>
        </span>
        <div className="brand-text">
          <small>SPAT</small>
          <strong>Admin Panel</strong>
        </div>
      </div>

      <nav>
        <ul className="menu-categories">
          {/* Dashboard (Bouton normal) */}
          <li className="menu">
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>
              <i className="fa-solid fa-table-columns"></i>
              <span className="label">Dashboard</span>
            </Link>
          </li>

          {/* Utilisateurs (Bouton normal) */}
          <li className="menu">
            <Link to="/admin/users" className={location.pathname === "/admin/users" ? "active" : ""}>
              <i className="fa-solid fa-users"></i>
              <span className="label">Utilisateurs</span>
            </Link>
          </li>

          {/* --- SECTION PARAMÈTRES (Bouton rétractable style Dashboard) --- */}
          <li className="menu-dropdown-container">
            <div 
              className="dropdown-button" 
              onClick={() => setOpenParametres(!openParametres)}
            >
              <i className="fa-solid fa-gears"></i>
              <span className="label">Paramètres</span>
              <i className={`fa-solid fa-chevron-down chevron ${openParametres ? "open" : ""}`}></i>
            </div>

            {openParametres && (
              <ul className="submenu-list">
                <li className="menu">
                  <Link to="/admin/types-contrat" className={location.pathname === "/admin/types-contrat" ? "active" : ""}>
                    <i className="fa-solid fa-layer-group"></i>
                    <span className="label">Types de contrat</span>
                  </Link>
                </li>
                <li className="menu">
                  <Link to="/admin/regles" className={location.pathname === "/admin/regles" ? "active" : ""}>
                    <i className="fa-solid fa-list-check"></i>
                    <span className="label">Règles validation</span>
                  </Link>
                </li>
                <li className="menu">
                  <Link to="/admin/alertes" className={location.pathname === "/admin/alertes" ? "active" : ""}>
                    <i className="fa-solid fa-bell"></i>
                    <span className="label">Paramètres alertes</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* --- SECTION LECTURE SEULE (Bouton rétractable style Dashboard) --- */}
          <li className="menu-dropdown-container">
            <div 
              className="dropdown-button" 
              onClick={() => setOpenLectureSeule(!openLectureSeule)}
            >
              <i className="fa-solid fa-eye"></i>
              <span className="label">Vues</span>
              <i className={`fa-solid fa-chevron-down chevron ${openLectureSeule ? "open" : ""}`}></i>
            </div>

            {openLectureSeule && (
              <ul className="submenu-list">
                <li className="menu">
                  <Link to="/admin/contrats" className={location.pathname === "/admin/contrats" ? "active" : ""}>
                    <i className="fa-solid fa-file-contract"></i>
                    <span className="label">Contrats</span>
                  </Link>
                </li>
                <li className="menu">
                  <Link to="/admin/validations" className={location.pathname === "/admin/validations" ? "active" : ""}>
                    <i className="fa-solid fa-clipboard-check"></i>
                    <span className="label">Validations</span>
                  </Link>
                </li>
                <li className="menu">
                  <Link to="/admin/versions" className={location.pathname === "/admin/versions" ? "active" : ""}>
                    <i className="fa-solid fa-code-branch"></i>
                    <span className="label">Versions</span>
                  </Link>
                </li>
                <li className="menu">
                  <Link to="/admin/journaux" className={location.pathname === "/admin/journaux" ? "active" : ""}>
                    <i className="fa-solid fa-shield-halved"></i>
                    <span className="label">Journaux audit</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
</div>
  );
}