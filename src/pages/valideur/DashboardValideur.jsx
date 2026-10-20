import "../role-dashboard.css";

export default function Dashboard() {
  return (
    <div className="role-dashboard">
      <section className="role-welcome">
        <div className="role-welcome-icon"><i className="fa-solid fa-clipboard-check" aria-hidden="true" /></div>
        <div><span>ESPACE VALIDEUR</span><h2>Bienvenue dans votre espace valideur</h2><p>Traitez les contrats qui vous sont attribués et suivez vos décisions.</p></div>
      </section>
      <section className="role-security-note"><i className="fa-solid fa-shield-halved" aria-hidden="true" /><div><strong>Accès selon votre rôle</strong><p>Les informations présentées doivent être filtrées par le backend selon votre compte et vos autorisations.</p></div></section>
    </div>
  );
}
