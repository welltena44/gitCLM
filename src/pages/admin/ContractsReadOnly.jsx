import { useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import "./DashboardAdmin.css";
const date = value => value ? new Date(`${String(value).slice(0,10)}T00:00:00`).toLocaleDateString("fr-FR") : "—";
export default function ContractsReadOnly() {
  const [rows,setRows]=useState([]),[query,setQuery]=useState(""),[error,setError]=useState("");
  useEffect(()=>{api.get("/contrats").then(({data})=>setRows(Array.isArray(data)?data:[])).catch(()=>setError("Impossible de charger les contrats."));},[]);
  const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return rows.filter(c=>!q||[c.reference,c.objet,c.service,c.statut].filter(Boolean).join(" ").toLowerCase().includes(q));},[rows,query]);
  return <div className="admin-data-page"><div className="admin-data-toolbar"><div><h2>Référentiel des contrats</h2><p>Consultation globale en lecture seule.</p></div><span>{filtered.length} contrat(s)</span></div><label className="audit-search">Rechercher<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Référence, objet, service, statut…"/></label>{error&&<p role="alert">{error}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Référence</th><th>Objet</th><th>Service</th><th>Responsable</th><th>Montant</th><th>Statut</th><th>Fin</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td>{c.reference}</td><td>{c.objet}</td><td>{c.service||"—"}</td><td>{c.responsableNom||`#${c.responsableId}`}</td><td>{Number(c.montant||0).toLocaleString("fr-FR")} {c.devise||"Ar"}</td><td>{c.statut}</td><td>{date(c.dateFin)}</td></tr>)}{filtered.length===0&&!error&&<tr><td colSpan="7" className="admin-empty">Aucun contrat correspondant.</td></tr>}</tbody></table></div></div>;
}
