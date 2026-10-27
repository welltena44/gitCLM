import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext.jsx";
import "./WorkspaceLayout.css";
import { useFeedback } from "../composants/FeedbackContext.jsx";
import api from "../services/api.js";
import PasswordResetRequestsPopup from "../composants/PasswordResetRequestsPopup.jsx";

export default function WorkspaceLayout() {
  const [menuClosed, setMenuClosed] = useState(() => window.innerWidth <= 800);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useFeedback();
  const [unreadCount, setUnreadCount] = useState(0);
  const [passwordResetCount, setPasswordResetCount] = useState(0);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState([]);
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("user") ||
          sessionStorage.getItem("utilisateur") ||
          "{}",
      );
    } catch {
      return {};
    }
  }, []);
  const activeUser = user || storedUser;
  const role = activeUser?.role || "ADMIN";
  const profilePath =
    role === "GESTIONNAIRE"
      ? "/gestionnaire/profil"
      : role === "ADMIN"
        ? "/admin/profil"
        : role === "VALIDEUR"
          ? "/valideur/profil"
          : "/juridique/profil";

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Confirmer la déconnexion",
      message:
        "Voulez-vous vraiment fermer votre session CLM ? Les modifications non enregistrées pourraient être perdues.",
      confirmLabel: "Se déconnecter",
      danger: true,
    });
    if (!ok) return;
    // Demande au backend de tracer la déconnexion tant que le token est encore présent.
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn(
        "La déconnexion n'a pas pu être tracée côté serveur.",
        error,
      );
    }
    if (typeof logout === "function") logout();
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("utilisateur");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const notificationPath = (notification) => {
    const type = String(notification?.type || "").toUpperCase();
    const contractId = notification?.contratId;
    if (notification?.regleValidationId) {
      const rulesPath =
        role === "ADMIN"
          ? "/admin/regles"
          : role === "JURIDIQUE"
            ? "/juridique/regles"
            : null;
      if (rulesPath)
        return `${rulesPath}?regleId=${notification.regleValidationId}`;
    }
    if (type.includes("VALID")) {
      if (role === "ADMIN")
        return contractId
          ? `/admin/validations?contratId=${contractId}`
          : "/admin/validations";
      if (role === "VALIDEUR")
        return contractId
          ? `/valideur/contrats?contratId=${contractId}`
          : "/valideur/contrats";
      if (role === "JURIDIQUE")
        return contractId
          ? `/juridique/validations?contratId=${contractId}`
          : "/juridique/validations";
      return contractId
        ? `/gestionnaire/validations?contratId=${contractId}`
        : "/gestionnaire/validations";
    }
    if (type.includes("AVENANT") && role === "GESTIONNAIRE")
      return "/gestionnaire/avenants";
    if (
      type.includes("ECHEANCE") ||
      type.includes("RENOUVELLEMENT") ||
      type.includes("RESILIATION")
    ) {
      if (role === "GESTIONNAIRE")
        return contractId
          ? `/gestionnaire/contrats/${contractId}?notification=1`
          : "/gestionnaire/echeances";
      if (role === "ADMIN")
        return contractId
          ? `/admin/contrats?contratId=${contractId}`
          : "/admin/contrats";
      return contractId
        ? `/juridique/contrats?contratId=${contractId}`
        : "/juridique/contrats";
    }
    if (contractId) {
      if (role === "GESTIONNAIRE")
        return `/gestionnaire/contrats/${contractId}?notification=1`;
      if (role === "ADMIN") return `/admin/contrats?contratId=${contractId}`;
      if (role === "VALIDEUR")
        return `/valideur/contrats?contratId=${contractId}`;
      return `/juridique/contrats?contratId=${contractId}`;
    }
    return role === "GESTIONNAIRE"
      ? "/gestionnaire/notifications"
      : role === "ADMIN"
        ? "/admin/validations"
        : role === "VALIDEUR"
          ? "/valideur/notifications"
          : "/juridique/notifications";
  };

  const openNotification = async (notification) => {
    setNotificationOpen(false);
    try {
      await api.put(`/notifications/${notification.id}/lu`);
    } catch {
      /* La navigation reste possible si la mise à jour de lecture échoue. */
    }
    await loadNotifications();
    navigate(notificationPath(notification));
  };

  const loadNotifications = useCallback(async () => {
    if (!activeUser?.id) return;
    try {
      const { data } = await api.get(`/notifications/user/${activeUser.id}`);
      const list = Array.isArray(data) ? data : [];
      setLatestNotifications(list.filter((n) => !n.lu).slice(0, 5));
      setUnreadCount(list.filter((n) => !n.lu).length);
    } catch {
      /* Le bandeau ne doit pas bloquer l’espace de travail si l’API de notifications est indisponible. */
    }
  }, [activeUser?.id]);
  const updatePasswordResetCount = useCallback(
    (count) => setPasswordResetCount(count),
    [],
  );
  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 5000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);
  const openNotifications = () => {
    setNotificationOpen((open) => !open);
    if (!notificationOpen) loadNotifications();
  };

  return (
    <div className="clm-layout">
      {!menuClosed && window.innerWidth <= 800 && (
        <button
          type="button"
          className="sidebar-mobile-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setMenuClosed(true)}
        />
      )}
      <Sidebar
        isClosed={menuClosed}
        onNavigate={() => {
          if (window.innerWidth <= 800) setMenuClosed(true);
        }}
      />
      <main className="clm-main">
        {role === "ADMIN" && (
          <PasswordResetRequestsPopup
            adminId={activeUser?.id}
            open={passwordResetOpen}
            onClose={() => setPasswordResetOpen(false)}
            onCountChange={updatePasswordResetCount}
          />
        )}
        <header className="clm-topbar">
          <button
            type="button"
            className="clm-menu-toggle"
            onClick={() => setMenuClosed((v) => !v)}
            aria-label={menuClosed ? "Ouvrir le menu" : "Fermer le menu"}
          >
            <i
              className={`fa-solid ${menuClosed ? "fa-bars" : "fa-bars-staggered"}`}
              aria-hidden="true"
            />
          </button>
          <div className="clm-topbar-context">
            <span className="clm-topbar-eyebrow">PLATEFORME CLM · SPAT</span>
          </div>
          <div className="clm-topbar-actions">
            <div className="clm-notification-wrap">
              <button
                type="button"
                className="clm-notification-bell"
                onClick={openNotifications}
                aria-label="Afficher les notifications"
              >
                <i className="fa-regular fa-bell" />
                {unreadCount + (role === "ADMIN" ? passwordResetCount : 0) >
                  0 && (
                  <span>
                    {unreadCount + (role === "ADMIN" ? passwordResetCount : 0) >
                    99
                      ? "99+"
                      : unreadCount +
                        (role === "ADMIN" ? passwordResetCount : 0)}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className="clm-notification-popover">
                  <div className="clm-notification-popover-head">
                    <strong>Notifications non lues</strong>
                    <button
                      onClick={() => setNotificationOpen(false)}
                      aria-label="Fermer"
                    >
                      ×
                    </button>
                  </div>
                  {role === "ADMIN" && passwordResetCount > 0 && (
                    <button
                      className="clm-notification-item"
                      onClick={() => {
                        setNotificationOpen(false);
                        setPasswordResetOpen(true);
                      }}
                    >
                      <i className="fa-solid fa-key" />
                      <span>
                        <strong>Demandes de réinitialisation</strong>
                        <small>
                          {passwordResetCount} demande(s) de mot de passe oublié
                          en attente. Cliquez pour examiner.
                        </small>
                      </span>
                    </button>
                  )}
                  {latestNotifications.length
                    ? latestNotifications.map((n) => (
                        <button
                          className="clm-notification-item"
                          key={n.id}
                          onClick={() => openNotification(n)}
                        >
                          <i className="fa-solid fa-bell" />
                          <span>
                            <strong>{n.titre || "Notification CLM"}</strong>
                            <small>
                              {n.message ||
                                "Une nouvelle notification est disponible."}
                            </small>
                          </span>
                        </button>
                      ))
                    : passwordResetCount === 0 && (
                        <p className="clm-notification-empty">
                          Aucune notification non lue.
                        </p>
                      )}
                  <button
                    className="clm-notification-all"
                    onClick={() => {
                      setNotificationOpen(false);
                      navigate(
                        role === "GESTIONNAIRE"
                          ? "/gestionnaire/notifications"
                          : role === "ADMIN"
                            ? "/admin/validations"
                            : role === "VALIDEUR"
                              ? "/valideur/notifications"
                              : "/juridique/notifications",
                      );
                    }}
                  >
                    Voir le centre de notifications{" "}
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="clm-profile-button"
              onClick={() => navigate(profilePath)}
              aria-label="Accéder à mon profil"
            >
              <i className="fa-solid fa-circle-user" aria-hidden="true" />
              <span>Mon profil</span>
            </button>
            <button type="button" className="clm-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket" />{" "}
              <span>Déconnexion</span>
            </button>
          </div>
        </header>
        <section className="clm-content">
          <Outlet />
        </section>
        <footer className="clm-footer">
          <span>
            <b>SPAT</b> · Gestion du cycle de vie des contrats
          </span>
          <span>Plateforme interne sécurisée</span>
        </footer>
      </main>
    </div>
  );
}
