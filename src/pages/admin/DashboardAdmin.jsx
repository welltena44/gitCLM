import "./DashboardAdmin.css";

export default function DashboardAdmin() {
  return (
    <div className="admin-page">
      {/* TOPBAR comme dans ton HTML */}
      <div className="topbar">
        <button className="btn-toggle">
          <i className="fa-solid fa-bars"></i>
        </button>
        <div>
          <h2><i className="fa-solid fa-table-columns"></i> Bienvenue</h2>
          <p>Vue d'ensemble CLM - Contrats, validations et alertes</p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fa-solid fa-file-contract"></i></div>
          <div className="stat-info">
            <span>Contrats actifs</span>
            <strong>124</strong>
            <small className="up"><i className="fa-solid fa-arrow-up"></i> +12 ce mois</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><i className="fa-solid fa-hourglass-half"></i></div>
          <div className="stat-info">
            <span>En attente validation</span>
            <strong>18</strong>
            <small className="danger"><i className="fa-solid fa-triangle-exclamation"></i> 3 urgents</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-users"></i></div>
          <div className="stat-info">
            <span>Utilisateurs</span>
            <strong>32</strong>
            <small>2 nouveaux</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><i className="fa-solid fa-bell"></i></div>
          <div className="stat-info">
            <span>Échéances &lt;30j</span>
            <strong>7</strong>
            <small className="danger">À traiter</small>
          </div>
        </div>
      </div>

      {/* 2 COLONNES COMME TA FORME */}
      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h4><i className="fa-solid fa-chart-pie"></i> Contrats par type</h4>
            <button><i className="fa-solid fa-ellipsis"></i></button>
          </div>
          <div className="card-body placeholder">
            <i className="fa-solid fa-chart-column"></i>
            <p>Graphique ici - filtrable par type ou service</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4><i className="fa-solid fa-clock"></i> Échéances à venir</h4>
            <a href="/admin/alertes">Voir tout</a>
          </div>
          <div className="card-body">
            <ul className="list">
              <li><i className="fa-solid fa-file-lines"></i> Contrat Prestige SA expire dans 5j <span className="badge red">Urgent</span></li>
              <li><i className="fa-solid fa-file-lines"></i> Maintenance IT - Renouvellement 12j <span className="badge orange">Bientôt</span></li>
              <li><i className="fa-solid fa-file-lines"></i> Location Bureau Tana - 28j <span className="badge green">OK</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}