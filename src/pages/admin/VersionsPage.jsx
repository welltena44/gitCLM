import InlineIcon from "../../composants/InlineIcon.jsx";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import Pagination from "../../composants/Pagination.jsx";
import { getApiErrorMessage } from "../../services/apiError.js";
import "./DashboardAdmin.css";
import "./AdminDataPages.css";

const date = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "—");

function parseContent(content) {
  if (content == null || content === "") return {};
  if (typeof content === "object") return content;
  try {
    return JSON.parse(content);
  } catch {
    return { contenu: content };
  }
}

function entries(content) {
  const value = parseContent(content);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value);
  }
  return [["Contenu", value]];
}

function formatValue(value) {
  if (value === undefined || value === null) return "—";
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

export default function VersionsPage() {
  const [rows, setRows] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [versions, contractList, userList] = await Promise.all([
          api.get("/versions-contrat"),
          api.get("/contrats"),
          api.get("/utilisateurs"),
        ]);
        if (active) {
          setRows(Array.isArray(versions.data) ? versions.data : []);
          setContracts(Array.isArray(contractList.data) ? contractList.data : []);
          setUsers(Array.isArray(userList.data) ? userList.data : []);
        }
      } catch (requestError) {
        if (active) {
          setError(getApiErrorMessage(requestError, "Impossible de charger l’historique des versions."));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const contract = contracts.find((item) => String(item.id) === String(row.contratId));
      const user = users.find((item) => String(item.id) === String(row.creePar));
      return !normalizedQuery || [
        contract?.reference,
        contract?.objet,
        row.version,
        row.avenantId,
        user?.matricule,
      ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [rows, contracts, users, query]);

  const compare = selected
    .map((id) => rows.find((row) => String(row.id) === String(id)))
    .filter(Boolean);
  const diff = useMemo(() => {
    const comparedVersions = selected
      .map((id) => rows.find((row) => String(row.id) === String(id)))
      .filter(Boolean);
    if (comparedVersions.length !== 2) return [];
    const first = parseContent(comparedVersions[0].contenu);
    const second = parseContent(comparedVersions[1].contenu);
    const keys = [...new Set([...Object.keys(first || {}), ...Object.keys(second || {})])].sort();
    return keys.map((key) => ({
      key,
      old: first?.[key],
      next: second?.[key],
      changed: JSON.stringify(first?.[key]) !== JSON.stringify(second?.[key]),
    }));
  }, [selected, rows]);

  const toggle = (id) => setSelected((current) => (
    current.includes(id)
      ? current.filter((value) => value !== id)
      : current.length < 2 ? [...current, id] : [current[1], id]
  ));

  const renderComparison = (version, side) => (
    <article className="version-compare-card">
      <header className="version-compare-heading">
        <div>
          <span>{version.avenantId ? `Avenant #${version.avenantId}` : "Version de contrat"}</span>
          <h4>Version {version.version}</h4>
        </div>
        <small>{date(version.dateCreation)}</small>
      </header>
      <dl className="version-compare-fields">
        {diff.map((field) => (
          <div className={`version-compare-field${field.changed ? " changed" : ""}`} key={field.key}>
            <dt>
              {field.key}
              {field.changed && <span className="version-change-badge">Modifié</span>}
            </dt>
            <dd><pre>{formatValue(side === "first" ? field.old : field.next)}</pre></dd>
          </div>
        ))}
      </dl>
    </article>
  );

  return (
    <div className="admin-data-page">
      <div className="admin-data-toolbar">
        <div>
          <span className="admin-home-eyebrow">ESPACE ADMINISTRATEUR</span>
          <h2><InlineIcon className="fa-solid fa-clock-rotate-left page-title-icon" /> Historique des versions</h2>
          <p>Archives conservées et comparaison de deux versions. Le contenu complet est consultable sans troncature.</p>
        </div>
        <span>{filtered.length} version(s)</span>
      </div>
      <label className="audit-search">
        Rechercher
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Référence, objet, version, matricule…"
        />
      </label>
      <p className="admin-muted">Sélectionnez deux versions dans la liste pour comparer leurs avenants et leurs différences.</p>
      {error && <p role="alert" className="admin-error">{error}</p>}
      {loading ? (
        <p className="admin-empty">Chargement…</p>
      ) : (
        <Pagination items={filtered} resetKey={query}>
          {(visible) => (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Comparer</th><th>Contrat</th><th>Version</th><th>Créée le</th>
                    <th>Créateur</th><th>Avenant</th><th>Contenu complet</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const contract = contracts.find((item) => String(item.id) === String(row.contratId));
                    const user = users.find((item) => String(item.id) === String(row.creePar));
                    return (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Sélectionner version ${row.version}`}
                            checked={selected.includes(row.id)}
                            onChange={() => toggle(row.id)}
                          />
                        </td>
                        <td><strong>{contract?.reference || `Contrat #${row.contratId}`}</strong><small>{contract?.objet || ""}</small></td>
                        <td>v{row.version}</td>
                        <td>{date(row.dateCreation)}</td>
                        <td>{user?.matricule || "—"}</td>
                        <td>{row.avenantId ? `#${row.avenantId}` : "—"}</td>
                        <td>
                          <details className="version-recap">
                            <summary>Afficher {entries(row.contenu).length} champ(s)</summary>
                            <div className="version-recap-grid">
                              {entries(row.contenu).map(([key, value]) => (
                                <div key={key}>
                                  <small>{String(key)}</small>
                                  <strong>{typeof value === "object" && value !== null
                                    ? <pre>{JSON.stringify(value, null, 2)}</pre>
                                    : String(value ?? "—")}</strong>
                                </div>
                              ))}
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })}
                  {!visible.length && <tr><td colSpan="7" className="admin-empty">Aucune version enregistrée.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Pagination>
      )}
      {compare.length === 2 && (
        <section className="admin-panel version-comparison">
          <div className="admin-data-toolbar">
            <div>
              <h3>Comparaison des avenants</h3>
              <p>Les champs modifiés sont signalés dans les deux colonnes.</p>
            </div>
            <button type="button" onClick={() => setSelected([])}>Effacer la sélection</button>
          </div>
          <div className="version-compare-grid">
            {renderComparison(compare[0], "first")}
            {renderComparison(compare[1], "second")}
          </div>
          {!diff.length && <p className="admin-empty">Aucun champ à comparer.</p>}
        </section>
      )}
    </div>
  );
}