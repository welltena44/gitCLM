import "../role-dashboard.css";

export default function Dashboard() {
  return (
    <div className="role-dashboard">
      <section className="role-welcome">
        <div className="role-welcome-icon"><i className="fa-solid fa-scale-balanced" aria-hidden="true" /></div>
        <div><span>ESPACE JURIDIQUE / ACHATS</span><h2>Bienvenue dans votre espace juridique / achats</h2><p>Suivez les contrats, les validations et les règles de conformité de votre périmètre.</p></div>
      </section>
      <section className="role-security-note"><i className="fa-solid fa-shield-halved" aria-hidden="true" /><div><strong>Accès selon votre rôle</strong><p>Les informations présentées doivent être filtrées par le backend selon votre compte et vos autorisations.</p></div></section>
    </div>
  );
}
