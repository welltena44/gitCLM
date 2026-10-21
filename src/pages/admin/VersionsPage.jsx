import { useEffect, useState } from "react";
import api from "../../services/api.js";
import "./DashboardAdmin.css";

const date = value => value ? new Date(value).toLocaleString("fr-FR") : "—";
export default function VersionsPage() {
  const [rows, setRows] = useState([]), [contracts, setContracts] = useState([]), [users, setUsers] = useState([]), [error, setError] = useState("");
  useEffect(() => { Promise.all([api.get("/versions-contrat"), api.get("/contrats"), api.get("/utilisateurs")]).then(([v,c,u]) => { setRows(v.data || []); setContracts(c.data || []); setUsers(u.data || []); }).catch(() => setError("Impossible de charger l’historique des versions.")); }, []);
  return <div className="admin-data-page"><div className="admin-data-toolbar"><div><h2>Historique des versions</h2><p>Versions enregistrées pour préserver l’historique des contrats.</p></div><span>{rows.length} version(s)</span></div>{error && <p role="alert">{error}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Contrat</th><th>Version</th><th>Créée le</th><th>Créée par</th><th>Avenant</th><th>Contenu conservé</th></tr></thead><tbody>{rows.map(r => { const c = contracts.find(x => String(x.id) === String(r.contratId)); const u = users.find(x => String(x.id) === String(r.creePar)); return <tr key={r.id}><td>{c ? <><strong>{c.reference}</strong><small>{c.objet}</small></> : `Contrat #${r.contratId}`}</td><td>v{r.version}</td><td>{date(r.dateCreation)}</td><td>{u?.email || (r.creePar ? `Utilisateur #${r.creePar}` : "—")}</td><td>{r.avenantId ? `#${r.avenantId}` : "—"}</td><td><details><summary>Afficher le récapitulatif</summary><pre>{JSON.stringify(r.contenu || {}, null, 2)}</pre></details></td></tr>; })}{rows.length === 0 && !error && <tr><td colSpan="6" className="admin-empty">Aucune version enregistrée.</td></tr>}</tbody></table></div></div>;
}
