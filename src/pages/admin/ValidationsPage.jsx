export default function ValidationsPage() {
  return (
    <div>
      <h2><i className="fa-solid fa-clipboard-check"></i> Validations - Vue globale R</h2><p className="subtitle">Lecture seule pour Admin, décision par Valideur/Juridique</p>
      <div className="card" style={{marginTop:20}}><table className="admin-table"><thead><tr><th>Contrat</th><th>Valideur assigné</th><th>Décision</th><th>Date</th><th>Commentaire</th></tr></thead><tbody><tr><td>CTR-001</td><td>valideur@clm.mg</td><td><span className="badge green">Approuvé</span></td><td>10/10/2026</td><td>OK pour montant</td></tr></tbody></table></div>
    </div>
  );
}