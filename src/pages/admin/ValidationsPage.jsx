import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api.js";

const date = value => value ? new Date(value).toLocaleString("fr-FR") : "—";
const decisions = { EN_ATTENTE: "En attente", A_VENIR: "À venir", NON_REQUISE: "Non requise", APPROUVE: "Approuvé", REJETE: "Rejeté", MODIFICATION_DEMANDEE: "Modification demandée" };
export default function ValidationsPage() {
  const [searchParams] = useSearchParams();
  const targetContractId = searchParams.get("contratId");
  const [rows, setRows] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(() => Promise.all([api.get("/validations"), api.get("/contrats"), api.get("/utilisateurs")]).then(([v, c, u]) => { setRows(v.data || []); setContracts(c.data || []); setUsers(u.data || []); }).catch(() => setError("Impossible de charger l’historique des validations.")), []);
  useEffect(() => { load(); }, [load]);
  const name = id => users.find(u => String(u.id) === String(id))?.matricule || "—";
  const contract = id => contracts.find(c => String(c.id) === String(id));
  const displayedRows = targetContractId
    ? [...rows.filter(row => String(row.contratId) === targetContractId), ...rows.filter(row => String(row.contratId) !== targetContractId)]
    : rows;
  return <div className="admin-data-page"><div className="admin-data-toolbar"><div><h2>Historique des validations</h2><p>Consultation des décisions prises par les valideurs.</p></div><span>{rows.length} décision(s)</span></div>{targetContractId&&<p className="admin-info-panel"><i className="fa-solid fa-bell"/><span>Validations du contrat <strong>{contract(targetContractId)?.reference||`#${targetContractId}`}</strong> affichées en premier.</span></p>}{error && <p role="alert">{error}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Contrat</th><th>Matricule demandeur</th><th>Matricule valideur</th><th>Niveau / cycle</th><th>Décision</th><th>Soumis le</th><th>Traité le</th><th>Commentaire</th></tr></thead><tbody>{displayedRows.map(v => { const c = contract(v.contratId); return <tr key={v.id} className={String(v.contratId)===targetContractId?"notification-target":""}><td>{c ? <><strong>{c.reference}</strong><small>{c.objet}</small></> : `Contrat #${v.contratId}`}</td><td>{name(v.demandeurId)}</td><td>{name(v.valideurId)}</td><td>{v.niveau} / {v.cycle}</td><td><span className={`admin-decision ${v.decision === "EN_ATTENTE" ? "pending" : v.decision === "APPROUVE" ? "approved" : "rejected"}`}>{decisions[v.decision] || v.decision}</span></td><td>{date(v.dateSoumission)}</td><td>{date(v.dateValidation)}</td><td>{v.commentaire || "—"}</td></tr>; })}{!rows.length && !error && <tr><td colSpan="8" className="admin-empty">Aucune validation enregistrée.</td></tr>}</tbody></table></div></div>;
}
