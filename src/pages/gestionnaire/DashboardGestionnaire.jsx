import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import * as svc from "../../services/contractService.js";
import { useFeedback } from "../../composants/FeedbackContext.jsx";
import Pagination from "../../composants/Pagination.jsx";
import "../role-dashboard.css";
import "./ManagerPages.css";

const date = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
        "fr-FR",
      )
    : "—";
const statusLabel = (status) =>
  ({
    BROUILLON: "Brouillon",
    EN_ATTENTE: "En attente",
    EN_VALIDATION: "En validation",
    ACTIF: "Actif",
    APPROUVE: "Approuvé",
    VALIDE: "Validé",
    REJETE: "Rejeté",
    EXPIRE: "Expiré",
  })[status] ||
  status ||
  "Non défini";

export default function DashboardGestionnaire() {
  const { user } = useAuth();
  const { toast } = useFeedback();
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contractData, notificationData] = await Promise.all([
        svc.getContracts(),
        user?.id ? svc.getNotifications(user.id) : Promise.resolve([]),
      ]);
      setContracts(Array.isArray(contractData) ? contractData : []);
      setNotifications(Array.isArray(notificationData) ? notificationData : []);
      setError("");
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          "Impossible de charger les données du tableau de bord.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const waiting = contracts.filter((contract) =>
    ["EN_ATTENTE", "EN_VALIDATION"].includes(contract.statut),
  );
  const drafts = contracts.filter((contract) => contract.statut === "BROUILLON");
  const due = contracts.filter((contract) => {
    if (!contract.dateFin) return false;
    const endDate = new Date(`${contract.dateFin}T23:59:59`);
    const remaining = endDate - new Date();
    return remaining >= 0 && remaining <= 30 * 86400000;
  });
  const unread = notifications.filter(
    (notification) => !notification.lu,
  ).length;
  const attention = contracts
    .filter((contract) => {
      const isDueSoon = due.some((item) => item.id === contract.id);
      return isDueSoon || ["EN_ATTENTE", "EN_VALIDATION", "BROUILLON"].includes(contract.statut);
    })
    .sort((a, b) => {
      const aDate = a.dateFin ? new Date(`${a.dateFin}T00:00:00`).getTime() : Infinity;
      const bDate = b.dateFin ? new Date(`${b.dateFin}T00:00:00`).getTime() : Infinity;
      return aDate - bDate;
    })
    .slice(0, 6);

  return (
    <div className="role-dashboard mgr-page">
      <section className="role-welcome">
        <div className="role-welcome-icon">
          <i className="fa-solid fa-file-signature" />
        </div>
        <div>
          <span>ESPACE GESTIONNAIRE</span>
          <h2>Bonjour {user?.prenom || "Gestionnaire"}</h2>
          <p>
            Vue d’ensemble du portefeuille, des validations et des échéances.
          </p>
        </div>
        <button className="mgr-btn secondary" onClick={load} disabled={loading}>
          <i
            className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"}`}
          />{" "}
          Actualiser
        </button>
      </section>

      {error && (
        <div className="mgr-inline-error">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </div>
      )}

      <div className="mgr-kpis">
        <div>
          <span>Validations en attente</span>
          <strong>{loading ? "—" : waiting.length}</strong>
          <small>à suivre</small>
        </div>
        <div>
          <span>Échéances à 30 jours</span>
          <strong>{loading ? "—" : due.length}</strong>
          <small>à surveiller</small>
        </div>
        <div>
          <span>Brouillons à finaliser</span>
          <strong>{loading ? "—" : drafts.length}</strong>
          <small>à compléter</small>
        </div>
        <div>
          <span>Notifications non lues</span>
          <strong>{loading ? "—" : unread}</strong>
          <small>à consulter</small>
        </div>
      </div>

      <section className="mgr-panel">
        <div className="mgr-panel-title">
          <div>
            <h3>Contrats à suivre</h3>
            <p>Validations, échéances proches et brouillons à compléter.</p>
          </div>
          <Link className="mgr-contract-link" to="/gestionnaire/contrats">
            Ouvrir Mes contrats <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
        {loading ? (
          <div className="mgr-state">
            <i className="fa-solid fa-spinner fa-spin" /> Chargement…
          </div>
        ) : attention.length === 0 ? (
          <div className="mgr-state">
            Aucun contrat ne demande de suivi particulier.
          </div>
        ) : (
          <div className="mgr-dashboard-attention-list">
            {attention.map((contract) => {
              const isDueSoon = due.some((item) => item.id === contract.id);
              const reason = contract.statut === "BROUILLON"
                ? "Brouillon à compléter"
                : ["EN_ATTENTE", "EN_VALIDATION"].includes(contract.statut)
                  ? "Validation en attente"
                  : "Échéance proche";
              return (
                <div className="mgr-dashboard-attention-item" key={contract.id}>
                  <Link
                    className="mgr-dashboard-attention-link"
                    to={`/gestionnaire/contrats/${contract.id}`}
                  >
                    <span className="mgr-dashboard-attention-icon">
                      <i className={`fa-solid ${isDueSoon ? "fa-calendar-days" : contract.statut === "BROUILLON" ? "fa-file-circle-exclamation" : "fa-hourglass-half"}`} />
                    </span>
                    <span className="mgr-dashboard-attention-copy">
                      <strong>{contract.reference || `CLM-${contract.id}`}</strong>
                      <small>{contract.objet || "Objet non renseigné"}</small>
                    </span>
                    <span className="mgr-dashboard-attention-reason">{reason}</span>
                    <span className="mgr-dashboard-attention-date">{isDueSoon ? date(contract.dateFin) : statusLabel(contract.statut)}</span>
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </Link>
                  {contract.renouvellementAutomatique && ["ACTIF", "APPROUVE"].includes(contract.statut) && (
                    <button
                      type="button"
                      className="mgr-dashboard-renew"
                      onClick={async () => {
                        try {
                          const baseDate = contract.dateFin ? new Date(contract.dateFin) : new Date();
                          baseDate.setMonth(baseDate.getMonth() + (contract.dureeMois || 12));
                          await svc.quickRenewContract(contract.id, baseDate.toISOString().slice(0, 10));
                          toast("Contrat renouvelé automatiquement avec succès.");
                          load();
                        } catch {
                          toast("Erreur lors du renouvellement rapide.", "error");
                        }
                      }}
                    >
                      <i className="fa-solid fa-bolt" /> Renouveler
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mgr-panel">
        <div className="mgr-panel-title">
          <div>
            <h3>Notifications récentes</h3>
            <p>{unread} non lue(s)</p>
          </div>
          <Link className="mgr-contract-link" to="/gestionnaire/notifications">
            Tout voir <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
        {notifications.length === 0 ? (
          <div className="mgr-state">Aucune notification à afficher.</div>
        ) : (
          <Pagination items={notifications}>
            {(visibleNotifications) => visibleNotifications.map((notification) => (
            <div className="mgr-notification" key={notification.id}>
              <span className="mgr-notif-icon">
                <i className="fa-solid fa-bell" />
              </span>
              <div className="mgr-notif-body">
                <div className="mgr-notif-head">
                  <strong>{notification.titre || "Notification CLM"}</strong>
                  {!notification.lu && (
                    <span className="mgr-unread-dot">Non lue</span>
                  )}
                </div>
                <p>{notification.message}</p>
                <small>
                  {notification.dateCreation
                    ? new Date(notification.dateCreation).toLocaleString(
                        "fr-FR",
                      )
                    : "Date inconnue"}
                </small>
              </div>
            </div>
            ))}
          </Pagination>
        )}
      </section>
    </div>
  );
}
