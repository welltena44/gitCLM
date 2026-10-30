import { useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import Pagination from "../../composants/Pagination.jsx";
import "./DashboardAdmin.css";

const date = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "—");

// Convertit le contenu archivé en résumé lisible, même si la base renvoie du JSON texte.
function recapEntries(content) {
  if (!content) return [];
  let value = content;
  if (typeof content === "string") {
    try {
      value = JSON.parse(content);
    } catch {
      return [["Résumé", content]];
    }
  }
  if (typeof value !== "object" || Array.isArray(value))
    return [["Résumé", String(value)]];
  return Object.entries(value)
    .slice(0, 12)
    .map(([key, item]) => [
      key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      typeof item === "object" && item !== null
        ? JSON.stringify(item, null, 2)
        : String(item ?? "—"),
    ]);
}
export default function VersionsPage() {
  const [rows, setRows] = useState([]),
    [contracts, setContracts] = useState([]),
    [users, setUsers] = useState([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get("/versions-contrat"),
      api.get("/contrats"),
      api.get("/utilisateurs"),
    ])
      .then(([v, c, u]) => {
        setRows(v.data || []);
        setContracts(c.data || []);
        setUsers(u.data || []);
      })
      .catch(() =>
        setError("Impossible de charger l’historique des versions."),
      );
  }, []);
  const filteredRows = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("fr");
    if (!search) return rows;
    return rows.filter((row) => {
      const contract = contracts.find(
        (item) => String(item.id) === String(row.contratId),
      );
      const creator = users.find(
        (item) => String(item.id) === String(row.creePar),
      );
      return [
        contract?.reference,
        contract?.objet,
        row.version,
        creator?.matricule,
        row.avenantId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(search);
    });
  }, [rows, contracts, users, query]);
  return (
    <div className="admin-data-page">
      <div className="admin-data-toolbar">
        <div>
          <h2>
            <i
              className="fa-solid fa-clock-rotate-left page-title-icon"
              aria-hidden="true"
            />
            Historique des versions
          </h2>
          <p>Versions enregistrées pour préserver l’historique des contrats.</p>
        </div>
        <span>{filteredRows.length} version(s)</span>
      </div>
      <label className="audit-search">
        Rechercher
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Référence, objet, version, matricule…"
          aria-label="Rechercher dans l’historique des versions"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <Pagination items={filteredRows} resetKey={query}>
        {(visibleRows) => (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Contrat</th>
              <th>Version</th>
              <th>Créée le</th>
              <th>Matricule créateur</th>
              <th>Avenant</th>
              <th>Contenu conservé</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => {
              const c = contracts.find(
                (x) => String(x.id) === String(r.contratId),
              );
              const u = users.find((x) => String(x.id) === String(r.creePar));
              return (
                <tr key={r.id}>
                  <td>
                    {c ? (
                      <>
                        <strong>{c.reference}</strong>
                        <small>{c.objet}</small>
                      </>
                    ) : (
                      `Contrat #${r.contratId}`
                    )}
                  </td>
                  <td>v{r.version}</td>
                  <td>{date(r.dateCreation)}</td>
                  <td>{u?.matricule || "—"}</td>
                  <td>{r.avenantId ? `#${r.avenantId}` : "—"}</td>
                  <td>
                    <details className="version-recap">
                      <summary>Consulter le récapitulatif</summary>
                      <div className="version-recap-grid">
                        {recapEntries(r.contenu).map(([label, value]) => (
                          <div key={label}>
                            <small>{label}</small>
                            <strong>{value || "—"}</strong>
                          </div>
                        ))}
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !error && (
              <tr>
                <td colSpan="6" className="admin-empty">
                  Aucune version enregistrée.
                </td>
              </tr>
            )}
            {rows.length > 0 && filteredRows.length === 0 && (
              <tr>
                <td colSpan="6" className="admin-empty">
                  Aucune version ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        )}
      </Pagination>
    </div>
  );
}
