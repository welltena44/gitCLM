export default function ParametresAlertesPage() {
  return (
    <div>
      <div className="page-header"><h2><i className="fa-solid fa-bell-gear"></i> Paramètres d'alertes - CRUD</h2><button className="btn-primary"><i className="fa-solid fa-plus"></i> Nouvelle alerte</button></div>
      <div className="card"><table className="admin-table"><thead><tr><th>Type</th><th>Délai</th><th>Destinataires</th><th>Actif</th><th>Actions</th></tr></thead><tbody><tr><td>Expiration</td><td>J-30, J-7</td><td>Gestionnaire, Juridique</td><td>✅</td><td><i className="fa-solid fa-pen"></i> <i className="fa-solid fa-trash"></i></td></tr></tbody></table></div>
    </div>
  );
}