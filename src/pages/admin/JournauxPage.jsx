import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import "./JournauxPage.css";

const PAGE_SIZE = 25;
const date = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "—");
const actionLabel = (action) =>
  ({
    CONNEXION: "Connexion",
    DECONNEXION: "Déconnexion",
    FERMETURE_ONGLET: "Déconnexion",
    CREATION: "Création",
    MODIFICATION: "Modification",
    SUPPRESSION: "Suppression",
  })[action] || String(action || "Action");
const actionClass = (action) =>
  ({
    CONNEXION: "audit-action-login",
    DECONNEXION: "audit-action-logout",
    FERMETURE_ONGLET: "audit-action-logout",
  })[action] || "audit-action-default";
const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function JournauxPage() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const value = { page, size: PAGE_SIZE };
    if (userId) value.userId = Number(userId);
    if (action.trim()) value.action = action.trim();
    if (fromDate) value.fromDate = `${fromDate}T00:00:00`;
    if (toDate) value.toDate = `${toDate}T23:59:59`;
    return value;
  }, [page, userId, action, fromDate, toDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let journalRows;
      try {
        const journalResponse = await api.get("/journaux-audit/page", {
          params,
        });
        const result = journalResponse.data || {};
        journalRows = Array.isArray(result.content)
          ? result.content
          : Array.isArray(result)
            ? result
            : [];
        setTotalPages(Number(result.totalPages || 0));
        setTotalElements(Number(result.totalElements || 0));
      } catch {
        // Older backend deployments expose only the original list endpoint.
        // Keep the audit screen usable while the paged endpoint is unavailable.
        const journalResponse = await api.get("/journaux-audit");
        const allRows = Array.isArray(journalResponse.data)
          ? journalResponse.data
          : [];
        const from = fromDate
          ? new Date(`${fromDate}T00:00:00`).getTime()
          : null;
        const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;
        const filteredRows = allRows.filter((row) => {
          const rowDate = new Date(row.dateAction).getTime();
          return (
            (!userId || String(row.utilisateurId) === userId) &&
            (!action.trim() ||
              String(row.action || "")
                .toLocaleLowerCase("fr")
                .includes(action.trim().toLocaleLowerCase("fr"))) &&
            (from === null || rowDate >= from) &&
            (to === null || rowDate <= to)
          );
        });
        setTotalElements(filteredRows.length);
        setTotalPages(Math.ceil(filteredRows.length / PAGE_SIZE));
        journalRows = filteredRows.slice(
          page * PAGE_SIZE,
          (page + 1) * PAGE_SIZE,
        );
      }
      setRows(journalRows);
      setLoading(false);
      // Les données de référence enrichissent seulement les libellés. Leur échec
      // ne doit pas masquer les journaux qui ont bien été chargés.
      const [userResult, contractResult] = await Promise.allSettled([
        api.get("/utilisateurs"),
        api.get("/contrats"),
      ]);
      setUsers(
        userResult.status === "fulfilled" &&
          Array.isArray(userResult.value.data)
          ? userResult.value.data
          : [],
      );
      setContracts(
        contractResult.status === "fulfilled" &&
          Array.isArray(contractResult.value.data)
          ? contractResult.value.data
          : [],
      );
    } catch (e) {
      setRows([]);
      setError(
        e.response?.data?.message ||
          e.response?.data?.detail ||
          "Impossible de charger les journaux d’audit. Vérifiez les filtres et les droits ADMIN.",
      );
    } finally {
      setLoading(false);
    }
  }, [params, page, userId, action, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleRows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fr");
    if (!term) return rows;
    return rows.filter((row) => {
      const user = users.find(
        (item) => String(item.id) === String(row.utilisateurId),
      );
      const values = [
        row.action,
        row.referenceContrat,
        row.ancienneValeur,
        row.nouvelleValeur,
        user?.matricule,
        user?.nom,
        user?.prenom,
      ];
      return values
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(term);
    });
  }, [rows, users, query]);

  const changeFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      // Exporte toutes les pages correspondant aux filtres serveur, pas uniquement la page affichée.
      const first = await api.get("/journaux-audit/page", {
        params: { ...params, page: 0, size: 100 },
      });
      const firstData = first.data || {};
      const allRows = [...(firstData.content || [])];
      const pages = Number(firstData.totalPages || 0);
      for (let current = 1; current < pages; current += 1) {
        const response = await api.get("/journaux-audit/page", {
          params: { ...params, page: current, size: 100 },
        });
        allRows.push(...(response.data?.content || []));
      }
      const headers = [
        "Date",
        "Utilisateur ID",
        "Action",
        "Contrat ID",
        "Référence contrat",
        "Ancienne valeur",
        "Nouvelle valeur",
      ];
      const lines = [
        headers,
        ...allRows.map((row) => [
          row.dateAction || "",
          row.utilisateurId ?? "",
          row.action || "",
          row.contratId ?? "",
          row.referenceContrat || "",
          row.ancienneValeur || "",
          row.nouvelleValeur || "",
        ]),
      ];
      const csv =
        "\uFEFF" +
        lines.map((line) => line.map(escapeCsv).join(";")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `journaux-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.message || "L’export des journaux a échoué.");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setUserId("");
    setAction("");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  return (
    <div className="admin-data-page">
      <div className="admin-data-toolbar">
        <div>
          <span className="admin-home-eyebrow">ESPACE ADMINISTRATEUR</span>
          <h2>
            <i className="fa-solid fa-clipboard-list page-title-icon" aria-hidden="true" />
            Journaux d’audit
          </h2>
          <p>Recherche multicritère et export des actions enregistrées sur la plateforme.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" onClick={load} disabled={loading}>
            <i className="fa-solid fa-rotate" aria-hidden="true" /> Actualiser
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}

      <section className="admin-panel">
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche dans les résultats affichés</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Action, contrat, matricule, changement…"
            />
          </label>
          <label className="mgr-field">
            <span>Utilisateur</span>
            <select value={userId} onChange={changeFilter(setUserId)}>
              <option value="">Tous les utilisateurs</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {[user.matricule, user.prenom, user.nom]
                    .filter(Boolean)
                    .join(" · ") || `Compte #${user.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="mgr-field">
            <span>Action</span>
            <input
              value={action}
              onChange={changeFilter(setAction)}
              placeholder="Ex. CONNEXION"
            />
          </label>
          <label className="mgr-field">
            <span>Du</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={changeFilter(setFromDate)}
            />
          </label>
          <label className="mgr-field">
            <span>Au</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={changeFilter(setToDate)}
            />
          </label>
        </div>
        <div
          className="admin-page-actions audit-pagination"
          style={{ marginTop: 12 }}
        >
          <button type="button" onClick={resetFilters}>
            Réinitialiser les filtres
          </button>
          <span>
            {totalElements.toLocaleString("fr-FR")} trace(s) au total · page{" "}
            {totalPages ? page + 1 : 0}/{totalPages}
          </span>
        </div>
      </section>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Contrat</th>
              <th>Changement</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="admin-empty">
                  Chargement des journaux…
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const user = users.find(
                  (item) => String(item.id) === String(row.utilisateurId),
                );
                const contract = contracts.find(
                  (item) => String(item.id) === String(row.contratId),
                );
                return (
                  <tr key={row.id}>
                    <td>{date(row.dateAction)}</td>
                    <td>
                      {user
                        ? `${user.matricule || ""} ${[user.prenom, user.nom].filter(Boolean).join(" ")}`.trim()
                        : row.utilisateurId
                          ? `Compte #${row.utilisateurId}`
                          : "Système"}
                    </td>
                    <td>
                      <span
                        className={`audit-action ${actionClass(row.action)}`}
                      >
                        {actionLabel(row.action)}
                      </span>
                    </td>
                    <td>
                      {row.referenceContrat ||
                        contract?.reference ||
                        (row.contratId ? `#${row.contratId}` : "—")}
                    </td>
                    <td>
                      {row.ancienneValeur || row.nouvelleValeur ? (
                        <details>
                          <summary>Voir le détail</summary>
                          <div>
                            <strong>Avant</strong>
                            <pre>{row.ancienneValeur || "—"}</pre>
                            <strong>Après</strong>
                            <pre>{row.nouvelleValeur || "—"}</pre>
                          </div>
                        </details>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && visibleRows.length === 0 && (
              <tr>
                <td colSpan="5" className="admin-empty">
                  Aucune trace pour ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-page-actions audit-pagination audit-page-navigation">
        <button
          type="button"
          disabled={loading || page <= 0}
          onClick={() => setPage((value) => Math.max(0, value - 1))}
        >
          Précédent
        </button>
        <span>
          Page {totalPages ? page + 1 : 0} sur {totalPages}
        </span>
        <button
          type="button"
          disabled={loading || page + 1 >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
