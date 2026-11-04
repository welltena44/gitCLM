
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Sidebar.css";

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
          <i className={`fa-solid ${workspace.icon}`} />
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

                      <i
                        className={`fa-solid fa-chevron-down sidebar-group-chevron ${
                          isExpanded ? "is-expanded" : ""
                        }`}
                        aria-hidden="true"
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
                            <i
                              className={`fa-solid ${icon}`}
                              aria-hidden="true"
                            />
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
                            <i
                              className={`fa-solid ${icon}`}
                              aria-hidden="true"
                            />
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
