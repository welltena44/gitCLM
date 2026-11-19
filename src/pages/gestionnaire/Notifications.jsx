import InlineIcon from "../../composants/InlineIcon.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFeedback } from "../../composants/FeedbackContext.jsx";
import Pagination from "../../composants/Pagination.jsx";
import * as svc from "../../services/contractService.js";
import "./ManagerPages.css";

const money = (n, dev = "Ar") =>
  n == null || n === ""
    ? "—"
    : `${Number(n).toLocaleString("fr-FR")} ${dev || "Ar"}`;
const date = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
        "fr-FR",
      )
    : "—";
const statusLabel = (s) =>
  ({
    BROUILLON: "Brouillon",
    EN_ATTENTE: "En attente",
    EN_VALIDATION: "En validation",
    MODIFICATION_DEMANDEE: "Modifications demandées",
    VALIDE: "Validé",
    APPROUVE: "Approuvé",
    ACTIF: "Actif",
    SIGNE: "Signé",
    A_VENIR: "À venir",
    NON_REQUISE: "Non requise",
    REJETE: "Rejeté",
    EXPIRE: "Expiré",
    RESILIE: "Résilié",
    ARCHIVE: "Archivé",
  })[s] ||
  s ||
  "Non défini";
const statusClass = (s) =>
  ["ACTIF", "VALIDE", "APPROUVE"].includes(s)
    ? "good"
    : ["EN_ATTENTE", "EN_VALIDATION", "MODIFICATION_DEMANDEE"].includes(s)
      ? "pending"
      : ["REJETE", "EXPIRE", "RESILIE"].includes(s)
        ? "bad"
        : "neutral";
const normalizedStatus = (status) =>
  String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
const isTerminated = (contract) =>
  normalizedStatus(contract.statut) === "RESILIE";
const isActiveContract = (contract) => {
  if (isTerminated(contract)) return false;
  if (!["SIGNE", "ACTIF", "APPROUVE", "VALIDE"].includes(normalizedStatus(contract.statut)) || !contract.dateSignature || !contract.dateDebut)
    return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return String(contract.dateDebut).slice(0, 10) <= today;
};
const errMessage = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Une erreur inattendue est survenue.";
function PageActions({ children }) {
  return <div className="mgr-actions">{children}</div>;
}
function Button({ children, variant = "primary", ...props }) {
  return (
    <button className={`mgr-btn ${variant}`} {...props}>
      {children}
    </button>
  );
}
function LoadingOrEmpty({ loading, empty, error }) {
  if (loading)
    return (
      <div className="mgr-state">
        <InlineIcon className="fa-solid fa-spinner fa-spin" /> Chargement des données…
      </div>
    );
  if (error)
    return (
      <div className="mgr-state error">
        <InlineIcon className="fa-solid fa-circle-exclamation" /> {error}
      </div>
    );
  if (empty)
    return (
      <div className="mgr-state">
        <InlineIcon className="fa-regular fa-folder-open" /> Aucun résultat ne correspond
        à vos critères.
      </div>
    );
  return null;
}


export function ManagerNotificationsPage() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [items, setItems] = useState([]),
    [filter, setFilter] = useState("all"),
    [q, setQ] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [autoRefresh, setAutoRefresh] = useState(false),
    [bulkMarking, setBulkMarking] = useState(false);
  const load = useCallback(async () => {
    if (!user?.id) {
      setError("Identifiant utilisateur indisponible.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await svc.getNotifications(user.id);
      setItems(data || []);
      setError("");
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => load(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);
  const bulkMarkRead = async () => {
    const unread = items.filter((n) => !n.lu);
    if (!unread.length) { toast("Toutes les notifications sont lues.", "info"); return; }
    setBulkMarking(true);
    try {
      for (const n of unread) {
        try { await svc.markNotificationRead(n.id); } catch (e) {}
      }
      setItems((old) => old.map((x) => ({ ...x, lu: true })));
      toast(unread.length + " notification(s) marquée(s) comme lue(s).", "success");
    } catch (e) { toast(errMessage(e), "error"); }
    finally { setBulkMarking(false); }
  };
  const data = items.filter(
    (n) =>
      (filter === "all" ||
        (filter === "unread" && !n.lu) ||
        (filter === "read" && n.lu)) &&
      (!q ||
        `${n.titre || ""} ${n.message || ""} ${n.type || ""}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  const mark = async (n) => {
    toast("Mise à jour de la notification…", "info");
    try {
      await svc.markNotificationRead(n.id);
      setItems((old) =>
        old.map((x) => (x.id === n.id ? { ...x, lu: true } : x)),
      );
      toast("Notification marquée comme lue.", "success");
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const remove = async (n) => {
    if (
      !(await confirm({
        title: "Supprimer la notification ?",
        message: "Cette notification sera retirée de votre liste.",
        confirmLabel: "Supprimer",
        danger: true,
      }))
    )
      return;
    toast("Suppression de la notification en cours…", "info");
    try {
      await svc.deleteNotification(n.id);
      setItems((old) => old.filter((x) => x.id !== n.id));
      toast("Notification supprimée.");
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <h2>Centre de notifications</h2>
          <p>
            Les informations importantes de vos contrats, validations et
            échéances.
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          <InlineIcon className="fa-solid fa-rotate" /> Actualiser
        </Button>
        <label className="mgr-btn secondary" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ display: "none" }} />
          <InlineIcon className={`fa-solid ${autoRefresh ? "fa-bell" : "fa-bell-slash"}`} /> Auto-rafraîchissement
        </label>
        <Button variant="primary" onClick={bulkMarkRead} disabled={bulkMarking}>
          <InlineIcon className="fa-solid fa-check-double" /> Tout marquer comme lu
        </Button>
      </div>
      <div className="mgr-kpis">
        <div>
          <span>Total</span>
          <strong>{items.length}</strong>
          <small>notifications</small>
        </div>
        <div>
          <span>Non lues</span>
          <strong>{items.filter((n) => !n.lu).length}</strong>
          <small>à consulter</small>
        </div>
        <div>
          <span>Lues</span>
          <strong>{items.filter((n) => n.lu).length}</strong>
          <small>déjà consultées</small>
        </div>
      </div>
      <section className="mgr-panel">
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche</span>
            <div className="mgr-search">
              <InlineIcon className="fa-solid fa-magnifying-glass" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher dans les notifications…"
              />
            </div>
          </label>
          <label className="mgr-field">
            <span>Afficher</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </label>
        </div>
        <LoadingOrEmpty
          loading={loading}
          error={error}
          empty={!loading && !data.length}
        />
        <Pagination items={data} resetKey={`${q}:${filter}`}>
          {(visibleItems) => (
        <div className="mgr-notifications">
          {visibleItems.map((n) => (
            <article
              key={n.id}
              className={`mgr-notification ${n.lu ? "read" : ""}`}
            >
              <span
                className={`mgr-notif-icon ${String(n.type).toLowerCase()}`}
              >
                <InlineIcon
                  className={`fa-solid ${String(n.type).toUpperCase().includes("VALID") ? "fa-clipboard-check" : String(n.type).toUpperCase().includes("ECHEANCE") ? "fa-calendar-days" : "fa-bell"}`}
                />
              </span>
              <div className="mgr-notif-body">
                <div className="mgr-notif-head">
                  <strong>{n.titre || "Notification CLM"}</strong>
                  {!n.lu && <span className="mgr-unread-dot">Non lue</span>}
                </div>
                <p>{n.message}</p>
                <small>
                  {n.type || "Information"} ·{" "}
                  {n.dateCreation
                    ? new Date(n.dateCreation).toLocaleString("fr-FR")
                    : "Date inconnue"}
                </small>
                {n.contratId && (
                  <Link
                    to={user?.role === "VALIDEUR" ? `/valideur/contrats?contratId=${n.contratId}` : user?.role === "ADMIN" ? "/admin/contrats" : user?.role === "JURIDIQUE" ? "/juridique/contrats" : `/gestionnaire/contrats/${n.contratId}`}
                    className="mgr-contract-link"
                  >
                    Ouvrir le contrat{" "}
                    <InlineIcon className="fa-solid fa-arrow-up-right-from-square" />
                  </Link>
                )}
              </div>
              <div className="mgr-notif-actions">
                {!n.lu && (
                  <button title="Marquer comme lue" onClick={() => mark(n)}>
                    <InlineIcon className="fa-solid fa-check" />
                  </button>
                )}
                <button title="Supprimer" onClick={() => remove(n)}>
                  <InlineIcon className="fa-regular fa-trash-can" />
                </button>
              </div>
            </article>
          ))}
        </div>
          )}
        </Pagination>
      </section>
    </div>
  );
}

export default ManagerNotificationsPage;
