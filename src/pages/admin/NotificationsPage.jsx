import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api.js";
import Pagination from "../../composants/Pagination.jsx";
import "./DashboardAdmin.css";

const date = (value) =>
  value ? new Date(value).toLocaleString("fr-FR") : "—";

const resetStatus = {
  EN_ATTENTE: "En attente",
  APPROUVEE: "Approuvée",
  REJETEE: "Rejetée",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [notificationResponse, requestResponse, userResponse] =
        await Promise.all([
          api.get("/notifications"),
          api.get("/admin/password-reset-requests/history"),
          api.get("/utilisateurs"),
        ]);
      setNotifications(
        Array.isArray(notificationResponse.data)
          ? notificationResponse.data
          : [],
      );
      setRequests(Array.isArray(requestResponse.data) ? requestResponse.data : []);
      setUsers(Array.isArray(userResponse.data) ? userResponse.data : []);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Impossible de charger l’historique des notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const entries = useMemo(() => {
    const userName = (id) => {
      const user = users.find((item) => String(item.id) === String(id));
      return user
        ? [user.prenom, user.nom].filter(Boolean).join(" ") ||
            `Matricule ${user.matricule}`
        : id
          ? `Compte #${id}`
          : "—";
    };
    const appNotifications = notifications.map((item) => ({
      id: `notification-${item.id}`,
      date: item.dateCreation,
      category: "Notification",
      subject: item.titre || "Notification CLM",
      recipient: userName(item.utilisateurId),
      detail: item.message || "—",
      status: item.lu ? "Lue" : "Non lue",
      statusClass: item.lu ? "approved" : "pending",
      contractId: item.contratId,
      ruleId: item.regleValidationId,
    }));
    const resetRequests = requests.map((item) => ({
      id: `reset-${item.id}`,
      date: item.dateCreation,
      category: "Réinitialisation",
      subject: `Demande de mot de passe · ${item.matricule}`,
      recipient: item.nom || `Matricule ${item.matricule}`,
      detail: "Demande de réinitialisation de mot de passe",
      status: resetStatus[item.statut] || item.statut,
      statusClass:
        item.statut === "APPROUVEE"
          ? "approved"
          : item.statut === "REJETEE"
            ? "rejected"
            : "pending",
    }));
    return [...appNotifications, ...resetRequests].sort(
      (first, second) =>
        new Date(second.date || 0).getTime() -
        new Date(first.date || 0).getTime(),
    );
  }, [notifications, requests, users]);

  const filteredEntries = entries.filter((entry) => {
    const matchesKind =
      kind === "all" ||
      (kind === "notifications" && entry.category === "Notification") ||
      (kind === "password" && entry.category === "Réinitialisation");
    const searchable =
      `${entry.category} ${entry.subject} ${entry.recipient} ${entry.detail} ${entry.status}`.toLowerCase();
    return matchesKind && searchable.includes(query.trim().toLowerCase());
  });

  return (
    <div className="admin-data-page">
      <div className="admin-data-toolbar">
        <div>
          <h2>
            <i
              className="fa-solid fa-bell page-title-icon"
              aria-hidden="true"
            />
            Historique des notifications
          </h2>
          <p>Notifications métier et demandes de réinitialisation traitées.</p>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          <i className="fa-solid fa-rotate" aria-hidden="true" /> {" "}
          Actualiser
        </button>
      </div>

      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}

      <div className="admin-kpis">
        <article>
          <span>Notifications métier</span>
          <strong>{notifications.length}</strong>
        </article>
        <article>
          <span>Demandes de réinitialisation</span>
          <strong>{requests.length}</strong>
        </article>
        <article>
          <span>Éléments affichés</span>
          <strong>{filteredEntries.length}</strong>
        </article>
      </div>

      <div className="admin-panel">
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titre, destinataire, contrat, message…"
            />
          </label>
          <label className="mgr-field">
            <span>Type</span>
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="all">Tous les événements</option>
              <option value="notifications">Notifications métier</option>
              <option value="password">Réinitialisations</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p className="admin-empty">Chargement de l’historique…</p>
        ) : filteredEntries.length === 0 ? (
          <p className="admin-empty">
            {entries.length
              ? "Aucun événement ne correspond à ces filtres."
              : "Aucune notification enregistrée."}
          </p>
        ) : (
          <Pagination items={filteredEntries} resetKey={`${kind}:${query}`}>
            {(visibleEntries) => (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Événement</th>
                      <th>Destinataire</th>
                      <th>Message</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{date(entry.date)}</td>
                        <td>{entry.category}</td>
                        <td>
                          <strong>{entry.subject}</strong>
                          {entry.contractId && (
                            <small>Contrat #{entry.contractId}</small>
                          )}
                          {entry.ruleId && <small>Règle #{entry.ruleId}</small>}
                        </td>
                        <td>{entry.recipient}</td>
                        <td>{entry.detail}</td>
                        <td>
                          <span className={`admin-decision ${entry.statusClass}`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Pagination>
        )}
      </div>
    </div>
  );
}