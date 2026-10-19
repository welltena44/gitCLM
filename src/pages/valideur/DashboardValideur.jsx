import { Link } from "react-router-dom";
import "../role-dashboard.css";

const actions = [
  { title: "Mes validations", description: "Examiner les demandes de validation qui vous sont assignées.", to: "/valideur/validations", icon: "fa-clipboard-check" },
  { title: "Contrats à examiner", description: "Consulter les dossiers nécessitant votre avis.", to: "/valideur/contrats", icon: "fa-file-signature" },
  { title: "Notifications", description: "Voir les alertes relatives à vos validations.", to: "/valideur/notifications", icon: "fa-bell" },
  { title: "Mon profil", description: "Consulter les informations du compte.", to: "/valideur/profil", icon: "fa-user-gear" }
];

export default function Dashboard() {
  return (
    <div className="role-dashboard">
      <section className="role-welcome">
        <div className="role-welcome-icon"><i className="fa-solid fa-clipboard-check" aria-hidden="true" /></div>
        <div><span>ESPACE VALIDEUR</span><h2>Bienvenue dans votre espace valideur</h2><p>Retrouvez les contrats soumis à votre avis et traitez les validations qui vous sont attribuées.</p></div>
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
