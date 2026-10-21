import { useEffect, useState } from "react";
import api from "../../services/api.js";
import "./DashboardAdmin.css";

const money = value => Number(value || 0).toLocaleString("fr-FR");
const fmtDate = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR") : "—";

export default function DashboardAdmin() {
  const [data, setData] = useState({ contracts: [], users: [], validations: [] });
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/contrats"), api.get("/utilisateurs"), api.get("/validations")])
      .then(([contracts, users, validations]) => setData({ contracts: contracts.data || [], users: users.data || [], validations: validations.data || [] }))
      .catch(() => setError("Impossible de charger les indicateurs. Vérifiez que le serveur est disponible."));
  }, []);
  const active = data.contracts.filter(c => ["ACTIF", "APPROUVE", "VALIDE"].includes(c.statut));
  const pending = data.validations.filter(v => v.decision === "EN_ATTENTE");
  const now = new Date();
  const deadlines = data.contracts.filter(c => {
    if (!c.dateFin || !["ACTIF", "APPROUVE", "VALIDE"].includes(c.statut)) return false;
    const days = (new Date(`${c.dateFin}T00:00:00`) - now) / 86400000;
    return days >= 0 && days <= 90;
  }).sort((a, b) => String(a.dateFin).localeCompare(String(b.dateFin))).slice(0, 6);
  const total = active.reduce((sum, c) => sum + Number(c.montant || 0), 0);
  return <div className="admin-dashboard-page">
    <section className="admin-welcome-banner"><div className="admin-welcome-icon"><i className="fa-solid fa-anchor" /></div><div><span>ESPACE ADMINISTRATEUR</span><h2>Vue d’ensemble de la plateforme</h2><p>Suivez le portefeuille contractuel et l’activité CLM.</p></div></section>
    {error && <p role="alert" className="admin-error">{error}</p>}
    <section className="admin-kpis">
      <article><span>Contrats référencés</span><strong>{data.contracts.length}</strong></article>
      <article><span>Contrats actifs</span><strong>{active.length}</strong></article>
      <article><span>Engagement actif</span><strong>{money(total)} Ar</strong></article>
      <article><span>Validations en attente</span><strong>{pending.length}</strong></article>
      <article><span>Utilisateurs actifs</span><strong>{data.users.filter(u => u.actif !== false).length}</strong></article>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><h3>Échéances dans les 90 prochains jours</h3><p>Contrats actifs à surveiller.</p></div></div>
      {deadlines.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Référence</th><th>Objet</th><th>Service</th><th>Montant</th><th>Échéance</th></tr></thead><tbody>{deadlines.map(c => <tr key={c.id}><td>{c.reference}</td><td>{c.objet}</td><td>{c.service || "—"}</td><td>{money(c.montant)} {c.devise || "Ar"}</td><td>{fmtDate(c.dateFin)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">Aucune échéance dans les 90 prochains jours.</p>}
    </section>
    <section className="admin-info-panel"><i className="fa-solid fa-shield-halved" /><div><strong>Traçabilité et contrôle des accès</strong><p>Les droits doivent être appliqués côté serveur pour chaque opération.</p></div></section>
  </div>;
}
