import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./EngagementDashboard.css";

const ACTIVE_STATUSES = ["ACTIF", "APPROUVE", "VALIDE", "SIGNE"];
const money = value => Number(value || 0).toLocaleString("fr-FR");
const formatDate = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR") : "—";
const dayDifference = (value, today) => (new Date(`${String(value).slice(0, 10)}T00:00:00`) - today) / 86400000;

function amountByCurrency(contracts) {
  const totals = new Map();
  contracts.forEach(contract => {
    const currency = contract.devise || "Ar";
    totals.set(currency, (totals.get(currency) || 0) + Number(contract.montant || 0));
  });
  return [...totals].map(([currency, total]) => `${money(total)} ${currency}`).join(" · ") || "0 Ar";
}

function countBy(contracts, valueFor) {
  const counts = new Map();
  contracts.forEach(contract => {
    const label = valueFor(contract) || "Non renseigné";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "fr"));
}

export default function EngagementDashboard({ role, contracts = [], types = [], validations = [], users = [], loading = false, error = "", onRefresh }) {
  const [typeFilter, setTypeFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("90");
  const isAdmin = role === "ADMIN";
  const today = useMemo(() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }, []);
  const filtered = contracts.filter(contract =>
    (!typeFilter || String(contract.typeId) === typeFilter) &&
    (!serviceFilter || contract.service === serviceFilter)
  );
  const active = filtered.filter(contract => ACTIVE_STATUSES.includes(String(contract.statut).toUpperCase()));
  const filteredIds = new Set(filtered.map(contract => String(contract.id)));
  const legalReview = validations.filter(validation =>
    validation.roleRequis === "JURIDIQUE" && validation.decision === "EN_ATTENTE" && filteredIds.has(String(validation.contratId))
  );
  const upcoming = filtered.filter(contract =>
    contract.dateFin && ACTIVE_STATUSES.includes(String(contract.statut).toUpperCase()) &&
    dayDifference(contract.dateFin, today) >= 0 && dayDifference(contract.dateFin, today) <= Number(deadlineDays)
  ).sort((left, right) => String(left.dateFin).localeCompare(String(right.dateFin)));
  const legalReviewContracts = [...new Map(legalReview.map(validation => {
    const contract = filtered.find(item => String(item.id) === String(validation.contratId));
    return contract ? [String(contract.id), contract] : null;
  }).filter(Boolean)).values()];
  const typeCounts = countBy(active, contract => types.find(type => String(type.id) === String(contract.typeId))?.nom);
  const serviceCounts = countBy(active, contract => contract.service);
  const managerMatricule = id => users.find(user => String(user.id) === String(id))?.matricule || "—";
  const portfolioPath = isAdmin ? "/admin/contrats" : "/juridique/contrats";
  const reviewPath = isAdmin ? "/admin/validations" : "/juridique/validations";

  if (loading) return <main className="engagement-dashboard"><p className="engagement-state">Chargement du portefeuille…</p></main>;
  if (error) return <main className="engagement-dashboard"><p className="engagement-state error" role="alert">{error}</p></main>;

  return <main className="engagement-dashboard">
    <header className="engagement-heading">
      <div><span>{isAdmin ? "PILOTAGE GLOBAL" : "SURVEILLANCE CONTRACTUELLE"}</span><h2>{isAdmin ? "Dashboard des engagements" : "Surveillance des engagements"}</h2><p>{isAdmin ? "Vue consolidée des contrats actifs et des prochaines échéances." : "Échéances et validations juridiques à surveiller dans votre périmètre."}</p></div>
      <button type="button" onClick={onRefresh} aria-label="Actualiser le tableau de bord"><i className="fa-solid fa-rotate"/> Actualiser</button>
    </header>
    <section className="engagement-filters" aria-label="Filtres du portefeuille">
      <label>Type de contrat<select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="">Tous les types</option>{types.map(type => <option key={type.id} value={type.id}>{type.nom || `Type ${type.id}`}</option>)}</select></label>
      <label>Service<select value={serviceFilter} onChange={event => setServiceFilter(event.target.value)}><option value="">Tous les services</option>{[...new Set(contracts.map(contract => contract.service).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")).map(service => <option key={service} value={service}>{service}</option>)}</select></label>
      <label>Période d’échéance<select value={deadlineDays} onChange={event => setDeadlineDays(event.target.value)}><option value="30">30 prochains jours</option><option value="90">90 prochains jours</option><option value="180">6 prochains mois</option><option value="365">12 prochains mois</option></select></label>
    </section>
    <section className="engagement-metrics">
      <article><span>Contrats actifs</span><strong>{active.length}</strong></article>
      <article><span>Montants nominaux actifs</span><strong>{amountByCurrency(active)}</strong></article>
      <article><span>Échéances dans les {deadlineDays} jours</span><strong>{upcoming.length}</strong></article>
      <article><span>À examiner juridiquement</span><strong>{legalReviewContracts.length}</strong><small>Validations juridiques en attente</small></article>
      {isAdmin && <article><span>Contrats référencés</span><strong>{filtered.length}</strong></article>}
    </section>
    {isAdmin && <section className="engagement-admin-stats"><span>{validations.filter(item => item.decision === "EN_ATTENTE").length} validation(s) en attente</span><span>{users.filter(user => user.actif !== false).length} utilisateur(s) actif(s)</span></section>}
    <section className="engagement-breakdowns"><Breakdown title="Contrats actifs par type" rows={typeCounts}/><Breakdown title="Contrats actifs par service" rows={serviceCounts}/></section>
    <section className="engagement-panel">
      <div className="engagement-panel-heading"><div><h3>Échéances à surveiller</h3><p>Contrats actifs dont la date de fin correspond à la période choisie.</p></div><Link to={portfolioPath}>Voir le portefeuille <i className="fa-solid fa-arrow-right"/></Link></div>
      <div className="engagement-table-wrap"><table><thead><tr><th>Contrat</th><th>Type</th><th>Service</th><th>Responsable (matricule)</th><th>Montant</th><th>Date de fin</th></tr></thead><tbody>{upcoming.slice(0, 10).map(contract => <tr key={contract.id}><td><Link to={`${portfolioPath}?contratId=${contract.id}`}>{contract.reference || `Contrat #${contract.id}`}<small>{contract.objet || "Objet non renseigné"}</small></Link></td><td>{types.find(type => String(type.id) === String(contract.typeId))?.nom || "—"}</td><td>{contract.service || "—"}</td><td>{managerMatricule(contract.responsableId)}</td><td>{money(contract.montant)} {contract.devise || "Ar"}</td><td>{formatDate(contract.dateFin)}</td></tr>)}</tbody></table>{!upcoming.length && <p className="engagement-empty">Aucune échéance dans cette période.</p>}</div>
    </section>
    <section className="engagement-panel">
      <div className="engagement-panel-heading"><div><h3>Contrats à examiner juridiquement</h3><p>Une action est requise quand une validation de rôle Juridique est en attente.</p></div><Link to={reviewPath}>Ouvrir les validations <i className="fa-solid fa-arrow-right"/></Link></div>
      <div className="engagement-table-wrap"><table><thead><tr><th>Contrat</th><th>Service</th><th>Responsable (matricule)</th><th>Montant</th><th>Fin prévue</th><th>Action</th></tr></thead><tbody>{legalReviewContracts.slice(0, 10).map(contract => <tr key={contract.id}><td><Link to={`${portfolioPath}?contratId=${contract.id}`}>{contract.reference || `Contrat #${contract.id}`}<small>{contract.objet || "Objet non renseigné"}</small></Link></td><td>{contract.service || "—"}</td><td>{managerMatricule(contract.responsableId)}</td><td>{money(contract.montant)} {contract.devise || "Ar"}</td><td>{formatDate(contract.dateFin)}</td><td><Link to={reviewPath}>Voir le dossier</Link></td></tr>)}</tbody></table>{!legalReviewContracts.length && <p className="engagement-empty">Aucune validation juridique en attente.</p>}</div>
    </section>
  </main>;
}

function Breakdown({ title, rows }) {
  return <section className="engagement-breakdown"><h3>{title}</h3>{rows.length ? <ul>{rows.map(([label, count]) => <li key={label}><span>{label}</span><strong>{count}</strong></li>)}</ul> : <p>Aucun contrat actif.</p>}</section>;
}