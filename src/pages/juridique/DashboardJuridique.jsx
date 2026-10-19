import { Link } from "react-router-dom";
import "../role-dashboard.css";

const actions = [
  { title: "Tous les contrats", description: "Consulter le portefeuille contractuel selon vos droits.", to: "/juridique/contrats", icon: "fa-file-contract" },
  { title: "Règles et seuils", description: "Consulter les règles et seuils de validation.", to: "/juridique/regles", icon: "fa-scale-balanced" },
  { title: "Suivi des validations", description: "Suivre l’avancement des circuits de validation.", to: "/juridique/validations", icon: "fa-clipboard-check" },
  { title: "Versions des contrats", description: "Consulter l’historique des modifications.", to: "/juridique/versions", icon: "fa-code-branch" },
  { title: "Notifications", description: "Consulter les alertes et échéances.", to: "/juridique/notifications", icon: "fa-bell" },
  { title: "Mon profil", description: "Consulter les informations du compte.", to: "/juridique/profil", icon: "fa-user-gear" }
];

export default function Dashboard() {
  return (
    <div className="role-dashboard">
      <section className="role-welcome">
        <div className="role-welcome-icon"><i className="fa-solid fa-scale-balanced" aria-hidden="true" /></div>
        <div><span>ESPACE JURIDIQUE / ACHATS</span><h2>Bienvenue dans votre espace juridique / achats</h2><p>Consultez les contrats, suivez les validations et accédez aux règles de conformité autorisées pour votre rôle.</p></div>
      </section>
      <section className="role-section-heading"><div><h2>Accès rapides</h2><p>Sélectionnez une rubrique de votre espace.</p></div></section>
      <div className="role-action-grid">
        {actions.map((action) => <Link to={action.to} className="role-action-card" key={action.to}>
          <span className="role-action-icon"><i className={`fa-solid ${action.icon}`} aria-hidden="true" /></span>
          <span className="role-action-copy"><strong>{action.title}</strong><small>{action.description}</small><b>Ouvrir <i className="fa-solid fa-arrow-right" aria-hidden="true" /></b></span>
        </Link>)}
      </div>
      <section className="role-security-note"><i className="fa-solid fa-shield-halved" aria-hidden="true" /><div><strong>Accès selon votre rôle</strong><p>Les informations présentées doivent être filtrées par le backend selon votre compte et vos autorisations.</p></div></section>
    </div>
  );
}
