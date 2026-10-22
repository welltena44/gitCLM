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

export default function Sidebar({ isClosed = false, onNavigate }) {
  const { user } = useAuth();
  const storedRole = (() => { try { return JSON.parse(sessionStorage.getItem("user") || sessionStorage.getItem("utilisateur") || "{}").role; } catch { return "ADMIN"; } })();
  const role = String(user?.role || storedRole || "ADMIN").toUpperCase();
  const config = menus[role] || menus.ADMIN;

  return (
    <aside className={`modernSidebar-nav ${isClosed ? "closed" : ""}`} aria-label={`Navigation ${config.title}`}>
      <NavLink to={config.home} className="sidebar-brand" onClick={onNavigate}>
        <span className="brand-mark"><img src="/LogoSPAT.jpeg" alt="" /></span>
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
      <div className="sidebar-bottom"><span className="sidebar-bottom-line" /><small>SPAT · CLM sécurisé</small></div>
    </aside>
  );
}
