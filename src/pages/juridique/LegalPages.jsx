import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api.js";
import { getContracts, getContractTypes, getValidations, getAmendments } from "../../services/contractService.js";
import "./LegalPages.css";

const formatDate = value => value ? new Date(value).toLocaleDateString("fr-FR") : "—";
const money = (value, currency = "Ar") => value == null ? "—" : `${Number(value).toLocaleString("fr-FR")} ${currency || "Ar"}`;
const err = e => e?.response?.data?.message || e?.message || "Impossible de charger les données.";

function useLegalData() {
  const [data, setData] = useState({ contracts: [], types: [], rules: [], validations: [], versions: [], amendments: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const jobs = [getContracts(), getContractTypes(), api.get("/regles-validation").then(r => r.data), getValidations(), api.get("/versions-contrat").then(r => r.data), getAmendments()];
    const results = await Promise.allSettled(jobs);
    const keys = ["contracts", "types", "rules", "validations", "versions", "amendments"];
    const next = {};
    results.forEach((r, i) => { next[keys[i]] = r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []; });
    setData(next);
    const failure = results.find(r => r.status === "rejected");
    if (failure) setError(err(failure.reason));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, load };
}

function LegalFrame({ title, description, loading, error, onRefresh, children }) {
  return <main className="legal-page"><header className="legal-page-head"><div><p className="legal-eyebrow">ESPACE JURIDIQUE · CONSULTATION</p><h2>{title}</h2><p>{description}</p></div><button className="legal-refresh" onClick={onRefresh}><i className="fa-solid fa-rotate"/> Actualiser</button></header>{loading ? <p className="legal-state">Chargement des données…</p> : error ? <p className="legal-state error">{error}</p> : children}</main>;
}

function LegalDashboard({ data, loading, error, load }) {
  const [typeFilter, setTypeFilter] = useState(""); const [serviceFilter, setServiceFilter] = useState("");
  const scoped = data.contracts.filter(c => (!typeFilter || String(c.typeId) === typeFilter) && (!serviceFilter || c.service === serviceFilter));
  const scopedIds = new Set(scoped.map(c => String(c.id)));
  const active = scoped.filter(c => ["ACTIF", "SIGNE"].includes(c.statut));
  const waiting = data.validations.filter(v => scopedIds.has(String(v.contratId)) && ["EN_ATTENTE", "EN_VALIDATION"].includes(String(v.decision || v.statut).toUpperCase()));
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = scoped.filter(c => c.dateFin && new Date(`${String(c.dateFin).slice(0,10)}T00:00:00`) >= today).sort((a,b) => String(a.dateFin).localeCompare(String(b.dateFin))).slice(0,5);
  const value = active.reduce((sum,c) => sum + Number(c.montant || 0), 0);
  return <LegalFrame title="Vue juridique du portefeuille" description="Contrats, circuits en cours et échéances à surveiller." loading={loading} error={error} onRefresh={load}>
    <section className="legal-filters"><label>Type de contrat<select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="">Tous les types</option>{data.types.map(t=><option value={t.id} key={t.id}>{t.nom || `Type ${t.id}`}</option>)}</select></label><label>Service<select value={serviceFilter} onChange={e=>setServiceFilter(e.target.value)}><option value="">Tous les services</option>{[...new Set(data.contracts.map(c=>c.service).filter(Boolean))].sort().map(s=><option key={s}>{s}</option>)}</select></label></section>
    <section className="legal-stats"><article><span>Contrats actifs</span><strong>{active.length}</strong></article><article><span>Engagement actif</span><strong>{money(value, active[0]?.devise)}</strong></article><article><span>Validations en attente</span><strong>{waiting.length}</strong></article><article><span>Règles configurées</span><strong>{data.rules.length}</strong></article></section>
    <section className="legal-panel"><div className="legal-panel-head"><h3>Prochaines échéances</h3><Link to="/juridique/contrats">Voir le portefeuille <i className="fa-solid fa-arrow-right"/></Link></div>{upcoming.length ? <div className="legal-table-wrap"><table><thead><tr><th>Contrat</th><th>Objet</th><th>Service</th><th>Fin prévue</th><th>Statut</th></tr></thead><tbody>{upcoming.map(c=><tr key={c.id}><td><strong>{c.reference || `#${c.id}`}</strong></td><td>{c.objet || "—"}</td><td>{c.service || "—"}</td><td>{formatDate(c.dateFin)}</td><td>{c.statut || "—"}</td></tr>)}</tbody></table></div>:<p className="legal-empty">Aucune échéance future enregistrée.</p>}</section>
  </LegalFrame>;
}

function LegalRules({ data, loading, error, load }) {
  const emptyForm = { typeContratId: "", montantMinimum: 0, montantMaximum: "" };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowForm(true); setActionError(""); };
  const openEdit = rule => {
    setForm({ typeContratId: rule.typeContratId ?? "", montantMinimum: rule.montantMinimum ?? 0, montantMaximum: rule.montantMaximum ?? "" });
    setEditing(rule.id); setShowForm(true); setActionError("");
  };
  const save = async event => {
    event.preventDefault(); setSaving(true); setActionError("");
    const payload = { ...form, typeContratId: form.typeContratId === "" ? null : Number(form.typeContratId), montantMinimum: Number(form.montantMinimum), montantMaximum: form.montantMaximum === "" ? null : Number(form.montantMaximum) };
    try {
      if (editing == null) await api.post("/regles-validation", payload);
      else await api.put(`/regles-validation/${editing}`, payload);
      setEditing(null); setForm(emptyForm); setShowForm(false); await load();
    } catch (e) { setActionError(err(e)); }
    finally { setSaving(false); }
  };
  return <LegalFrame title="Règles et seuils" description="Définissez les plages de montant et les types de contrats concernés. L’administrateur configure les niveaux et les rôles du circuit." loading={loading} error={error} onRefresh={load}>
    {actionError && <p className="legal-state error" role="alert">{actionError}</p>}
    <section className="legal-panel">
      <div className="legal-panel-head"><h3>Seuils de validation</h3><button className="legal-rule-button" type="button" onClick={openNew}><i className="fa-solid fa-plus"/> Ajouter une règle</button></div>
      <p className="legal-rule-help">Modifiez ici les seuils et types associés. Les niveaux et rôles de validation sont gérés par l’administrateur.</p>
      <div className="legal-table-wrap"><table><thead><tr><th>Type</th><th>Montant minimum</th><th>Montant maximum</th><th>Niveau</th><th>Rôle requis</th><th>Actions</th></tr></thead><tbody>{data.rules.map(r=><tr key={r.id}><td>{data.types.find(t=>String(t.id)===String(r.typeContratId))?.nom || "Tous les types"}</td><td>{money(r.montantMinimum)}</td><td>{r.montantMaximum == null ? "Sans plafond" : money(r.montantMaximum)}</td><td>{r.niveau}</td><td><span className="legal-tag">{r.roleRequis}</span></td><td><div className="legal-row-actions"><button type="button" onClick={()=>openEdit(r)} aria-label={`Modifier les seuils de la règle ${r.id}`}><i className="fa-solid fa-pen"/></button></div></td></tr>)}</tbody></table>{!data.rules.length && <p className="legal-empty">Aucune règle de validation configurée.</p>}</div>
    </section>
    {showForm && <div className="legal-rule-overlay"><form className="legal-rule-form" onSubmit={save}><h3>{editing == null ? "Ajouter une règle" : "Modifier la règle"}</h3>
      <label>Type de contrat<select value={form.typeContratId} onChange={e=>setForm({...form,typeContratId:e.target.value})}><option value="">Tous les types</option>{data.types.map(t=><option key={t.id} value={t.id}>{t.nom}</option>)}</select></label>
      <div className="legal-rule-fields"><label>Montant minimum<input type="number" min="0" step="0.01" required value={form.montantMinimum} onChange={e=>setForm({...form,montantMinimum:e.target.value})}/></label><label>Montant maximum<input type="number" min="0" step="0.01" placeholder="Sans plafond" value={form.montantMaximum} onChange={e=>setForm({...form,montantMaximum:e.target.value})}/></label></div>
      {actionError && <p className="legal-state error" role="alert">{actionError}</p>}<div className="legal-rule-actions"><button type="button" disabled={saving} onClick={()=>{setEditing(null);setForm(emptyForm);setShowForm(false);setActionError("");}}>Annuler</button><button type="submit" disabled={saving}>{saving ? "Enregistrement…" : editing == null ? "Créer la règle" : "Enregistrer"}</button></div>
    </form></div>}
  </LegalFrame>;
}

export default function LegalPages() {
  const { pathname } = useLocation(); const { data, loading, error, load } = useLegalData();
  const [query, setQuery] = useState("");
  const contractsById = useMemo(() => new Map(data.contracts.map(c => [String(c.id), c])), [data.contracts]);
  if (pathname === "/juridique" || pathname === "/juridique/") return <LegalDashboard {...{data,loading,error,load}}/>;
  if (pathname === "/juridique/contrats") {
    const list = data.contracts.filter(c => `${c.reference||""} ${c.objet||""} ${c.service||""} ${c.statut||""}`.toLowerCase().includes(query.toLowerCase()));
    return <LegalFrame title="Portefeuille des contrats" description="Recherche et consultation de l’ensemble des dossiers contractuels." loading={loading} error={error} onRefresh={load}><input className="legal-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher par référence, objet, service ou statut"/><div className="legal-table-wrap"><table><thead><tr><th>Référence</th><th>Objet</th><th>Type</th><th>Service</th><th>Montant</th><th>Fin</th><th>Statut</th></tr></thead><tbody>{list.map(c=><tr key={c.id}><td><strong>{c.reference || `#${c.id}`}</strong></td><td>{c.objet || "—"}</td><td>{data.types.find(t=>String(t.id)===String(c.typeId))?.nom || "—"}</td><td>{c.service || "—"}</td><td>{money(c.montant,c.devise)}</td><td>{formatDate(c.dateFin)}</td><td><span className="legal-tag">{c.statut || "Non défini"}</span></td></tr>)}</tbody></table>{!list.length && <p className="legal-empty">Aucun contrat ne correspond à la recherche.</p>}</div></LegalFrame>;
  }
  if (pathname === "/juridique/regles") return <LegalRules {...{data,loading,error,load}}/>;
  if (pathname === "/juridique/validations") return <LegalFrame title="Suivi des validations" description="Historique des étapes et décisions rendues sur les contrats." loading={loading} error={error} onRefresh={load}><div className="legal-table-wrap"><table><thead><tr><th>Contrat</th><th>Étape</th><th>Rôle requis</th><th>Valideur</th><th>Décision</th><th>Commentaire</th><th>Date</th></tr></thead><tbody>{data.validations.map(v=>{const c=contractsById.get(String(v.contratId));return <tr key={v.id}><td><strong>{c?.reference || `Contrat #${v.contratId}`}</strong><small>{c?.objet}</small></td><td>{v.etape || `Étape ${v.niveau || "—"}`}</td><td>{v.roleRequis || "—"}</td><td>{v.valideurNom || (v.valideurId ? `Compte #${v.valideurId}` : "—")}</td><td><span className="legal-tag">{v.decision || v.statut || "EN_ATTENTE"}</span></td><td>{v.commentaire || "—"}</td><td>{formatDate(v.dateValidation || v.dateSoumission)}</td></tr>;})}</tbody></table>{!data.validations.length && <p className="legal-empty">Aucune validation enregistrée.</p>}</div></LegalFrame>;
  if (pathname === "/juridique/versions") return <LegalFrame title="Versions et avenants" description="Traçabilité des versions et modifications associées aux contrats." loading={loading} error={error} onRefresh={load}><div className="legal-table-wrap"><table><thead><tr><th>Contrat</th><th>Version</th><th>Date</th><th>Avenant</th><th>Contenu archivé</th></tr></thead><tbody>{data.versions.map(v=>{const c=contractsById.get(String(v.contratId));return <tr key={v.id}><td><strong>{c?.reference || `Contrat #${v.contratId}`}</strong><small>{c?.objet}</small></td><td>v{v.version}</td><td>{formatDate(v.dateCreation)}</td><td>{v.avenantId ? `Avenant #${v.avenantId}` : "—"}</td><td><details><summary>Afficher</summary><pre>{JSON.stringify(v.contenu,null,2)}</pre></details></td></tr>;})}</tbody></table>{!data.versions.length && <p className="legal-empty">Aucune version archivée.</p>}</div><h3 className="legal-subtitle">Avenants</h3><div className="legal-table-wrap"><table><thead><tr><th>Numéro</th><th>Contrat</th><th>Date</th><th>Modifications</th><th>Montant après</th></tr></thead><tbody>{data.amendments.map(a=><tr key={a.id}><td>{a.numero || `#${a.id}`}</td><td>{contractsById.get(String(a.contratId))?.reference || `Contrat #${a.contratId}`}</td><td>{formatDate(a.dateAvenant)}</td><td>{a.modifications || a.description || "—"}</td><td>{money(a.montantApres,contractsById.get(String(a.contratId))?.devise)}</td></tr>)}</tbody></table>{!data.amendments.length && <p className="legal-empty">Aucun avenant enregistré.</p>}</div></LegalFrame>;
  return null;
}
