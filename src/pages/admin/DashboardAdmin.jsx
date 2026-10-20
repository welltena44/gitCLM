import "./DashboardAdmin.css";

export default function DashboardAdmin() {
  return (
    <div className="admin-dashboard-page">
      <section className="admin-welcome-banner">
        <div className="admin-welcome-icon"><i className="fa-solid fa-anchor" /></div>
        <div><span>ESPACE ADMINISTRATEUR</span><h2>Bienvenue sur votre tableau de bord</h2><p>Suivez et administrez la plateforme CLM de SPAT.</p></div>
      </section>
      <section className="admin-info-panel">
        <i className="fa-solid fa-shield-halved" />
        <div><strong>Traçabilité et contrôle des accès</strong><p>Les rôles définissent les rubriques accessibles. Les contrôles de sécurité doivent également être appliqués par le backend pour chaque opération.</p></div>
      </section>
    </div>
  );
}
