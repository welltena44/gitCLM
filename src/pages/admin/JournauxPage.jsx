import { useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import "./DashboardAdmin.css";

const date = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "—");
const actionLabel = (action) =>
  ({
    CONNEXION: "Connexion",
    DECONNEXION: "Déconnexion",
    FERMETURE_ONGLET: "Déconnexion",
  })[action] || String(action || "Action");
const actionClass = (action) =>
  ({
    CONNEXION: "audit-action-login",
    DECONNEXION: "audit-action-logout",
    FERMETURE_ONGLET: "audit-action-logout",
  })[action] || "audit-action-default";
export default function JournauxPage() {
  const [rows, setRows] = useState([]),
    [contracts, setContracts] = useState([]),
    [users, setUsers] = useState([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get("/journaux-audit"),
      api.get("/contrats"),
      api.get("/utilisateurs"),
    ])
      .then(([j, c, u]) => {
        setRows(j.data || []);
        setContracts(c.data || []);
        setUsers(u.data || []);
      })
      .catch(() => setError("Impossible de charger les journaux d’audit."));
  }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        !q ||
        [
          r.action,
          r.referenceContrat,
          r.ancienneValeur,
          r.nouvelleValeur,
          users.find((u) => String(u.id) === String(r.utilisateurId))
            ?.matricule,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
  }, [rows, users, query]);
  return (
    <div className="admin-data-page">
      <div className="admin-data-toolbar">
        <div>
          <h2>Journaux d’audit</h2>
          <p>Historique des actions enregistrées sur la plateforme.</p>
        </div>
        <span>{filtered.length} entrée(s)</span>
      </div>
      <label className="audit-search">
        Rechercher
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Action, contrat, matricule…"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Matricule</th>
              <th>Action</th>
              <th>Contrat</th>
              <th>Changement</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const c = contracts.find(
                (x) => String(x.id) === String(r.contratId),
              );
              const u = users.find(
                (x) => String(x.id) === String(r.utilisateurId),
              );
              return (
                <tr key={r.id}>
                  <td>{date(r.dateAction)}</td>
                  <td>{u?.matricule || (r.utilisateurId ? "—" : "Système")}</td>
                  <td>
                    <span className={`audit-action ${actionClass(r.action)}`}>
                      {actionLabel(r.action)}
                    </span>
                  </td>
                  <td>
                    {r.referenceContrat ||
                      c?.reference ||
                      (r.contratId ? `#${r.contratId}` : "—")}
                  </td>
                  <td>
                    {r.ancienneValeur || r.nouvelleValeur ? (
                      <details>
                        <summary>Voir</summary>
                        <div>
                          <strong>Avant</strong>
                          <pre>{r.ancienneValeur || "—"}</pre>
                          <strong>Après</strong>
                          <pre>{r.nouvelleValeur || "—"}</pre>
                        </div>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && !error && (
              <tr>
                <td colSpan="5" className="admin-empty">
                  Aucune trace ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
