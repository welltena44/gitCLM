
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Sidebar.css";

const iconPaths = {
  "fa-bell": ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  "fa-calendar-clock": ["M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1", "M12 13v3l2 1"],
  "fa-clipboard-check": ["M9 5h6l1 2h3v14H5V7h3l1-2", "m8 14 2.5 2.5L16 11"],
  "fa-code-branch": ["M6 3v12a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V9", "M12 9l4-4 4 4", "M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M16 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4", "M16 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4"],
  "fa-file-circle-plus": ["M13 3H6v18h12v-8", "M13 3v6h6", "M15 3l4 6", "M14 16h7m-3.5-3.5v7"],
  "fa-file-contract": ["M6 3h8l4 4v14H6z", "M14 3v5h5", "M9 12h6m-6 3h6m-6 3h3"],
  "fa-file-pen": ["M6 3h8l4 4v6", "M14 3v5h5", "M6 3v18h7", "m14 18 5-5 2 2-5 5-3 1z"],
  "fa-file-signature": ["M6 3h8l4 4v6", "M14 3v5h5", "M6 3v18h7", "m13 17 2-2 3 3-2 2-4 1z"],
  "fa-folder-open": ["M3 6h7l2 2h9v11H3z", "m3 14 2-3h15l1 3"],
  "fa-layer-group": ["m12 3 9 5-9 5-9-5z", "m3 12 9 5 9-5", "m3 16 9 5 9-5"],
  "fa-list-check": ["M10 6h10M10 12h10M10 18h10", "m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2"],
  "fa-scale-balanced": ["M12 3v18m-7 0h14M5 6h14", "m5 6-3 7h6z", "m19 6-3 7h6z", "M8 13a3 3 0 0 0 6 0"],
  "fa-shield-halved": ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11", "M12 2v20"],
  "fa-table-columns": ["M4 4h16v16H4z", "M12 4v16", "M7 8h2m-2 4h2m6-4h2m-2 4h2"],
  "fa-user-gear": ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M4 21a8 8 0 0 1 12-6", "M18 16v2m0 4v-2m-3-1h2m4 0h2m-5-2 1.5 1.5m3 3L22 23m0-7-1.5 1.5m-3 3L16 22"],
  "fa-users": ["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M17 10a2.5 2.5 0 1 0 0-5", "M3 20a6 6 0 0 1 12 0", "M16 14a5 5 0 0 1 5 5"],
  "fa-chevron-down": ["m6 9 6 6 6-6"],
};

function SidebarIcon({ name, className = "" }) {
  return (
    <svg
      className={`sidebar-inline-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {(iconPaths[name] || iconPaths["fa-file-contract"]).map((path, index) => (
        <path d={path} key={`${name}-${index}`} />
      ))}
    </svg>
  );
}

const menus = {
  ADMIN: {
    title: "Administration",
    subtitle: "Pilotage de la plateforme",
    home: "/admin",
    groups: [
      {
        title: "Pilotage",
        links: [
          ["Tableau de bord", "/admin", "fa-table-columns"],
          ["Utilisateurs", "/admin/users", "fa-users"],
          ["Notifications", "/admin/notifications", "fa-bell"],
        ],
      },
      {
        title: "Configuration",
        collapsible: true,
        links: [
          ["Types de contrat", "/admin/types-contrat", "fa-layer-group"],
          ["Règles de validation", "/admin/regles", "fa-list-check"],
          ["Paramètres des alertes", "/admin/alertes", "fa-bell"],
        ],
      },
      {
        title: "Consultation et audit",
        collapsible: true,
        links: [
          ["Contrats", "/admin/contrats", "fa-file-contract"],
          ["Validations", "/admin/validations", "fa-clipboard-check"],
          ["Versions", "/admin/versions", "fa-code-branch"],
          ["Journaux d’audit", "/admin/journaux", "fa-shield-halved"],
        ],
      },
    ],
  },

  GESTIONNAIRE: {
    title: "Espace gestionnaire",
    subtitle: "Gestion de votre portefeuille",
    home: "/gestionnaire",
    groups: [
      {
        title: "Mon activité",
        links: [
          ["Tableau de bord", "/gestionnaire", "fa-table-columns"],
          ["Mes contrats", "/gestionnaire/contrats", "fa-file-contract"],
          ["Nouveau contrat", "/gestionnaire/nouveau", "fa-file-circle-plus"],
          ["Suivi des validations", "/gestionnaire/validations", "fa-clipboard-check"],
        ],
      },
      {
        title: "Dossiers",
        links: [
          ["Mes avenants", "/gestionnaire/avenants", "fa-file-pen"],
          ["Documents", "/gestionnaire/documents", "fa-folder-open"],
          ["Échéances et alertes", "/gestionnaire/echeances", "fa-calendar-clock"],
        ],
      },
      {
        title: "Mon espace",
        links: [
          ["Notifications", "/gestionnaire/notifications", "fa-bell"],
          ["Mon profil", "/gestionnaire/profil", "fa-user-gear"],
        ],
      },
    ],
  },

  VALIDEUR: {
    title: "Espace valideur",
    subtitle: "Circuit de validation",
    home: "/valideur",
    groups: [
      {
        title: "Mes validations",
        links: [
          ["Tableau de bord", "/valideur", "fa-table-columns"],
          ["Mes validations", "/valideur/validations", "fa-clipboard-check"],
          ["Contrats à examiner", "/valideur/contrats", "fa-file-signature"],
        ],
      },
      {
        title: "Mon espace",
        links: [
          ["Notifications", "/valideur/notifications", "fa-bell"],
          ["Mon profil", "/valideur/profil", "fa-user-gear"],
        ],
      },
    ],
  },

  JURIDIQUE: {
    title: "Espace juridique",
    subtitle: "Consultation & conformité",
    home: "/juridique",
    groups: [
      {
        title: "Vue d’ensemble",
        links: [
          ["Tableau de bord", "/juridique", "fa-table-columns"],
          ["Tous les contrats", "/juridique/contrats", "fa-file-contract"],
        ],
      },
      {
        title: "Conformité",
        links: [
          ["Règles et seuils", "/juridique/regles", "fa-scale-balanced"],
          ["Suivi des validations", "/juridique/validations", "fa-clipboard-check"],
          ["Versions des contrats", "/juridique/versions", "fa-code-branch"],
        ],
      },
      {
        title: "Mon espace",
        links: [
          ["Notifications", "/juridique/notifications", "fa-bell"],
          ["Mon profil", "/juridique/profil", "fa-user-gear"],
        ],
      },
    ],
  },
};

export default function Sidebar({ isClosed = false, onNavigate }) {
  const { user } = useAuth();
  const location = useLocation();

  const storedUser = (() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("user") ||
          sessionStorage.getItem("utilisateur") ||
          "{}"
      );
    } catch {
      return {};
    }
  })();

  const activeUser = user || storedUser;
  const role = String(activeUser?.role || "ADMIN").toUpperCase();
  const config = menus[role] || menus.ADMIN;

  // Ouvre automatiquement le groupe contenant la page actuellement consultée.
  const [expandedGroups, setExpandedGroups] = useState(() => {
    if (role !== "ADMIN") return {};

    return Object.fromEntries(
      config.groups
        .filter((group) => group.collapsible)
        .map((group) => [
          group.title,
          group.links.some(
            ([, path]) =>
              location.pathname === path ||
              location.pathname.startsWith(`${path}/`)
          ),
        ])
    );
  });

  // Ouvre ou ferme le sous-menu sélectionné.
  const toggleGroup = (title) => {
    setExpandedGroups((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  const workspaceLabels = {
    ADMIN: {
      title: "Espace administration",
      subtitle: "Pilotage de la plateforme",
      icon: "fa-shield-halved",
    },
    GESTIONNAIRE: {
      title: "Espace gestionnaire",
      subtitle: "Gestion de vos contrats",
      icon: "fa-folder-open",
    },
    VALIDEUR: {
      title: "Espace valideur",
      subtitle: "Traitement des validations",
      icon: "fa-clipboard-check",
    },
    JURIDIQUE: {
      title: "Espace juridique",
      subtitle: "Conformité et engagements",
      icon: "fa-scale-balanced",
    },
  };

  const workspace = workspaceLabels[role] || workspaceLabels.ADMIN;

  return (
    <aside
      className={`modernSidebar-nav ${isClosed ? "closed" : ""}`}
      style={{
        "--sidebar-watermark": `url(${process.env.PUBLIC_URL}/LogoSPAT.jpeg)`,
      }}
      aria-label={`Navigation ${config.title}`}
    >
      <div className="sidebar-workspace-card">
        <span className="sidebar-workspace-icon" aria-hidden="true">
          <SidebarIcon name={workspace.icon} />
        </span>

        <span className="sidebar-workspace-copy">
          <strong>{workspace.title}</strong>
          <small>{workspace.subtitle}</small>
        </span>

        <span className="sidebar-workspace-status" title="Espace actif" />
      </div>

      <nav aria-label="Menu principal">
        <ul className="menu-categories">
          {config.groups.map((group, index) => {
            const canCollapse = role === "ADMIN" && group.collapsible;
            const isExpanded = Boolean(expandedGroups[group.title]);
            const submenuId = `admin-sidebar-submenu-${index}`;

            return (
              <li className="sidebar-group" key={group.title}>
                {canCollapse ? (
                  <>
                    <button
                      type="button"
                      className={`sidebar-group-toggle ${
                        isExpanded ? "is-expanded" : ""
                      }`}
                      onClick={() => toggleGroup(group.title)}
                      aria-expanded={isExpanded}
                      aria-controls={submenuId}
                    >
                      <span className="sidebar-group-title">
                        {group.title}
                      </span>

                      <SidebarIcon
                        name="fa-chevron-down"
                        className={`sidebar-group-chevron ${isExpanded ? "is-expanded" : ""}`}
                      />
                    </button>

                    <ul
                      id={submenuId}
                      className="sidebar-group-links"
                      hidden={!isExpanded}
                    >
                      {group.links.map(([label, to, icon]) => (
                        <li className="menu" key={to}>
                          <NavLink
                            to={to}
                            end={to === config.home}
                            onClick={onNavigate}
                          >
                            <SidebarIcon name={icon} />
                            <span className="label">{label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="sidebar-group-title">
                      {group.title}
                    </div>

                    <ul className="sidebar-group-links">
                      {group.links.map(([label, to, icon]) => (
                        <li className="menu" key={to}>
                          <NavLink
                            to={to}
                            end={to === config.home}
                            onClick={onNavigate}
                          >
                            <SidebarIcon name={icon} />
                            <span className="label">{label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-bottom">
        <span className="sidebar-bottom-line" aria-hidden="true" />
        <small>SPAT · CLM — Plateforme sécurisée</small>
      </div>
    </aside>
  );
}
