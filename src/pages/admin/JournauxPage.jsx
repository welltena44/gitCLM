export default function JournauxPage() {
  return (
    <div>
      <h2><i className="fa-solid fa-shield-halved"></i> Journaux d'audit - R seulement</h2><p className="subtitle">Traces non effaçables, non modifiables</p>
      <div className="card" style={{marginTop:20}}><table className="admin-table"><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Ressource</th></tr></thead><tbody><tr><td>12/10 14:31</td><td>admin@clm.mg</td><td>CREATE utilisateur</td><td>ID 32</td></tr><tr><td>12/10 14:30</td><td>gestionnaire@boa.mg</td><td>UPDATE contrat</td><td>CTR-001</td></tr></tbody></table></div>
    </div>
  );
}