import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Sidebar.css";

const menus = {
  ADMIN: {
    title: "Administration",
    subtitle: "Pilotage de la plateforme",
    home: "/admin",
    groups: [
      { title: "PILOTAGE", links: [
        ["Tableau de bord", "/admin", "fa-table-columns"],
        ["Utilisateurs", "/admin/users", "fa-users"],
      ]},
      { title: "CONFIGURATION", links: [
        ["Types de contrat", "/admin/types-contrat", "fa-layer-group"],
        ["Règles de validation", "/admin/regles", "fa-list-check"],
        ["Paramètres des alertes", "/admin/alertes", "fa-bell"],
      ]},
      { title: "CONSULTATION & AUDIT", links: [
        ["Contrats", "/admin/contrats", "fa-file-contract"],
        ["Validations", "/admin/validations", "fa-clipboard-check"],
        ["Versions", "/admin/versions", "fa-code-branch"],
        ["Journaux d’audit", "/admin/journaux", "fa-shield-halved"],
      ]},
    ],
  },
  GESTIONNAIRE: {
    title: "Espace gestionnaire", subtitle: "Gestion de votre portefeuille", home: "/gestionnaire",
    groups: [
      { title: "MON ACTIVITÉ", links: [
        ["Tableau de bord", "/gestionnaire", "fa-table-columns"],
        ["Mes contrats", "/gestionnaire/contrats", "fa-file-contract"],
        ["Nouveau contrat", "/gestionnaire/nouveau", "fa-file-circle-plus"],
        ["Suivi des validations", "/gestionnaire/validations", "fa-clipboard-check"],
      ]},
      { title: "DOSSIERS", links: [
        ["Mes avenants", "/gestionnaire/avenants", "fa-file-pen"],
        ["Documents", "/gestionnaire/documents", "fa-folder-open"],
        ["Échéances et alertes", "/gestionnaire/echeances", "fa-calendar-clock"],
      ]},
      { title: "MON ESPACE", links: [
        ["Notifications", "/gestionnaire/notifications", "fa-bell"],
        ["Mon profil", "/gestionnaire/profil", "fa-user-gear"],
      ]},
    ],
  },
  VALIDEUR: {
    title: "Espace valideur", subtitle: "Circuit de validation", home: "/valideur",
    groups: [
      { title: "MES VALIDATIONS", links: [
        ["Tableau de bord", "/valideur", "fa-table-columns"],
        ["Mes validations", "/valideur/validations", "fa-clipboard-check"],
        ["Contrats à examiner", "/valideur/contrats", "fa-file-signature"],
      ]},
      { title: "MON ESPACE", links: [
        ["Notifications", "/valideur/notifications", "fa-bell"],
        ["Mon profil", "/valideur/profil", "fa-user-gear"],
      ]},
    ],
  },
  JURIDIQUE: {
    title: "Espace juridique", subtitle: "Consultation & conformité", home: "/juridique",
    groups: [
      { title: "VUE D’ENSEMBLE", links: [
        ["Tableau de bord", "/juridique", "fa-table-columns"],
        ["Tous les contrats", "/juridique/contrats", "fa-file-contract"],
      ]},
      { title: "CONFORMITÉ", links: [
        ["Règles et seuils", "/juridique/regles", "fa-scale-balanced"],
        ["Suivi des validations", "/juridique/validations", "fa-clipboard-check"],
        ["Versions des contrats", "/juridique/versions", "fa-code-branch"],
      ]},
      { title: "MON ESPACE", links: [
        ["Notifications", "/juridique/notifications", "fa-bell"],
        ["Mon profil", "/juridique/profil", "fa-user-gear"],
      ]},
    ],
  },
};

const roleLabels = { ADMIN: "Administrateur", GESTIONNAIRE: "Gestionnaire", VALIDEUR: "Valideur", JURIDIQUE: "Juridique / Achats" };

export default function Sidebar({ isClosed = false, onNavigate }) {
  const { user } = useAuth();
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || localStorage.getItem("utilisateur") || "{}"); }
    catch { return {}; }
  }, []);
  const activeUser = user || storedUser;
  const role = String(activeUser?.role || "ADMIN").toUpperCase();
  const config = menus[role] || menus.ADMIN;
  const fullName = [activeUser?.prenom, activeUser?.nom].filter(Boolean).join(" ") || roleLabels[role] || "Utilisateur";
  const matricule = activeUser?.matricule || activeUser?.id || "";
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "U";

  return (
    <aside className={`modernSidebar-nav ${isClosed ? "closed" : ""}`} aria-label={`Navigation ${config.title}`}>
      <NavLink to={config.home} className="sidebar-brand" onClick={onNavigate}>
        <span className="brand-mark"><i className="fa-solid fa-anchor" aria-hidden="true" /></span>
        <span className="brand-text"><small>SPAT</small><strong>CLM · {config.title}</strong><span className="brand-subtitle">{config.subtitle}</span></span>
      </NavLink>
      <nav aria-label="Menu principal">
        <ul className="menu-categories">
          {config.groups.map(group => (
            <li className="sidebar-group" key={group.title}>
              <div className="sidebar-group-title">{group.title}</div>
              <ul className="sidebar-group-links">
                {group.links.map(([label, to, icon]) => (
                  <li className="menu" key={to}>
                    <NavLink to={to} end={to === config.home} onClick={onNavigate}>
                      <i className={`fa-solid ${icon}`} aria-hidden="true" /><span className="label">{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-user-heading"><span className="status-indicator" /> SESSION ACTIVE</div>
        <div className="sidebar-user-profile">
          <div className="admin-avatar" aria-hidden="true">{initials}</div>
          <div className="admin-info"><span className="admin-name" title={fullName}>{fullName}</span><span className="admin-label">{roleLabels[role] || role}</span>{matricule && <span className="admin-matricule">Matricule : {matricule}</span>}</div>
        </div>
      </div>
      <div className="sidebar-bottom"><span className="sidebar-bottom-line" /><small>SPAT · CLM sécurisé</small></div>
    </aside>
  );
}
