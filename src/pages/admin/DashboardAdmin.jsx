import { Link } from "react-router-dom";
import "./DashboardAdmin.css";

const actions = [
  { title: "Utilisateurs", description: "Créer et gérer les comptes, rôles et accès.", to: "/admin/users", icon: "fa-users" },
  { title: "Types de contrat", description: "Maintenir le référentiel des catégories de contrats.", to: "/admin/types-contrat", icon: "fa-layer-group" },
  { title: "Règles de validation", description: "Consulter et configurer les seuils et circuits.", to: "/admin/regles", icon: "fa-list-check" },
  { title: "Paramètres des alertes", description: "Gérer les alertes et échéances de suivi.", to: "/admin/alertes", icon: "fa-bell" },
  { title: "Validations", description: "Consulter les décisions et l’avancement des validations.", to: "/admin/validations", icon: "fa-clipboard-check" },
  { title: "Versions et audit", description: "Consulter les versions et les traces de la plateforme.", to: "/admin/versions", icon: "fa-shield-halved" },
];

export default function DashboardAdmin() {
  return (
    <div className="admin-dashboard-page">
      <section className="admin-welcome-banner">
        <div className="admin-welcome-icon"><i className="fa-solid fa-anchor" /></div>
        <div><span>ESPACE ADMINISTRATEUR</span><h2>Bienvenue sur votre tableau de bord</h2><p>Accédez rapidement aux outils d’administration de la plateforme CLM de SPAT.</p></div>
      </section>
      <div className="admin-section-heading"><div><h2>Accès rapides</h2><p>Choisissez une rubrique pour poursuivre votre travail.</p></div></div>
      <div className="admin-quick-grid">
        {actions.map((action) => <Link to={action.to} className="admin-quick-card" key={action.to}>
          <span className="admin-quick-icon"><i className={`fa-solid ${action.icon}`} /></span>
          <span className="admin-quick-copy"><strong>{action.title}</strong><small>{action.description}</small><b>Ouvrir <i className="fa-solid fa-arrow-right" /></b></span>
        </Link>)}
      </div>
      <section className="admin-info-panel">
        <i className="fa-solid fa-shield-halved" />
        <div><strong>Traçabilité et contrôle des accès</strong><p>Les rôles définissent les rubriques accessibles. Les contrôles de sécurité doivent également être appliqués par le backend pour chaque opération.</p></div>
      </section>
    </div>
  );
}
