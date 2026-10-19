import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext.jsx";
import "./WorkspaceLayout.css";
import { useFeedback } from "../composants/FeedbackContext.jsx";
import api from "../services/api.js";

const pageTitles = {
  "/admin": ["Tableau de bord", "Vue d’ensemble de l’activité CLM"],
  "/admin/users": ["Gestion des utilisateurs", "Comptes, rôles et accès à la plateforme"],
  "/admin/types-contrat": ["Types de contrat", "Référentiel des catégories de contrats"],
  "/admin/regles": ["Règles de validation", "Seuils et circuits de validation"],
  "/admin/alertes": ["Paramètres des alertes", "Configuration des notifications et échéances"],
  "/admin/validations": ["Validations", "Vue globale des décisions de validation"],
  "/admin/versions": ["Versions des contrats", "Historique des versions conservées"],
  "/admin/journaux": ["Journaux d’audit", "Traçabilité des actions effectuées"],
  "/gestionnaire": ["Tableau de bord", "Vue d’ensemble de votre activité contractuelle"],
  "/gestionnaire/contrats": ["Mes contrats", "Consultez et suivez les contrats de votre périmètre"],
  "/gestionnaire/nouveau": ["Nouveau contrat", "Préparez une nouvelle fiche contractuelle"],
  "/gestionnaire/validations": ["Suivi des validations", "Suivez les décisions et les demandes de correction"],
  "/gestionnaire/avenants": ["Mes avenants", "Suivi des modifications contractuelles"],
  "/gestionnaire/documents": ["Documents", "Documents associés à vos contrats"],
  "/gestionnaire/echeances": ["Échéances et alertes", "Anticipez les fins de contrat et les dates de préavis"],
  "/gestionnaire/notifications": ["Notifications", "Informations importantes sur vos contrats"],
  "/gestionnaire/profil": ["Mon profil", "Informations du compte connecté"],
  "/valideur": ["Tableau de bord", "Vue d’ensemble de vos validations"],
  "/valideur/validations": ["Mes validations", "Décisions qui vous sont attribuées"],
  "/valideur/contrats": ["Contrats à examiner", "Contrats nécessitant votre avis"],
  "/valideur/notifications": ["Notifications", "Alertes liées à vos validations"],
  "/valideur/profil": ["Mon profil", "Informations du compte connecté"],
  "/juridique": ["Tableau de bord", "Vue d’ensemble juridique des contrats"],
  "/juridique/contrats": ["Tous les contrats", "Consultation du portefeuille contractuel"],
  "/juridique/regles": ["Règles et seuils", "Consultation des règles de validation"],
  "/juridique/validations": ["Suivi des validations", "Avancement des circuits de validation"],
  "/juridique/versions": ["Versions des contrats", "Historique des modifications contractuelles"],
  "/juridique/notifications": ["Notifications", "Alertes et échéances contractuelles"],
  "/juridique/profil": ["Mon profil", "Informations du compte connecté"],
};

const roleNames = {
  ADMIN: "Administration",
  GESTIONNAIRE: "Gestionnaire",
  VALIDEUR: "Valideur",
  JURIDIQUE: "Juridique / Achats",
};

export default function WorkspaceLayout() {
  const [menuClosed, setMenuClosed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState([]);
  const location = useLocation();
  const page = useMemo(() => pageTitles[location.pathname] || ["Espace CLM", "Gestion du cycle de vie des contrats"], [location.pathname]);
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || localStorage.getItem("utilisateur") || "{}"); }
    catch { return {}; }
  }, []);
  const activeUser = user || storedUser;
  const role = activeUser?.role || "ADMIN";
  const matricule = activeUser?.matricule || activeUser?.id || "Indisponible";

  const handleLogout = async () => {
    const ok = await confirm({ title: "Confirmer la déconnexion", message: "Voulez-vous vraiment fermer votre session CLM ? Les modifications non enregistrées pourraient être perdues.", confirmLabel: "Se déconnecter", danger: true });
    if (!ok) return;
    if (typeof logout === "function") logout();
    localStorage.removeItem("user");
    localStorage.removeItem("utilisateur");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const loadNotifications = useCallback(async () => {
    if (!activeUser?.id) return;
    try { const { data } = await api.get(`/notifications/user/${activeUser.id}`); const list = Array.isArray(data) ? data : []; setLatestNotifications(list.filter(n => !n.lu).slice(0, 5)); setUnreadCount(list.filter(n => !n.lu).length); } catch { /* Le bandeau ne doit pas bloquer l’espace de travail si l’API de notifications est indisponible. */ }
  }, [activeUser?.id]);
  useEffect(() => { loadNotifications(); const timer = window.setInterval(loadNotifications, 60000); return () => window.clearInterval(timer); }, [loadNotifications]);
  const openNotifications = async () => { setNotificationOpen(v => !v); await loadNotifications(); };

  return (
    <div className="clm-layout">
      <Sidebar isClosed={menuClosed} onNavigate={() => { if (window.innerWidth <= 800) setMenuClosed(true); }} />
      <main className="clm-main">
        <header className="clm-topbar">
          <button type="button" className="clm-menu-toggle" onClick={() => setMenuClosed(v => !v)} aria-label={menuClosed ? "Ouvrir le menu" : "Fermer le menu"}>
            <i className={`fa-solid ${menuClosed ? "fa-bars" : "fa-bars-staggered"}`} aria-hidden="true" />
          </button>
          <div className="clm-topbar-context">
            <span className="clm-topbar-eyebrow">PLATEFORME CLM · SPAT</span>
            <strong>{page[0]}</strong>
          </div>
          <div className="clm-topbar-actions">
            <div className="clm-notification-wrap"><button type="button" className="clm-notification-bell" onClick={openNotifications} aria-label="Afficher les notifications"><i className="fa-regular fa-bell" />{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>{notificationOpen && <div className="clm-notification-popover"><div className="clm-notification-popover-head"><strong>Notifications non lues</strong><button onClick={() => setNotificationOpen(false)} aria-label="Fermer">×</button></div>{latestNotifications.length ? latestNotifications.map(n => <button className="clm-notification-item" key={n.id} onClick={() => { setNotificationOpen(false); navigate(role === "GESTIONNAIRE" ? "/gestionnaire/notifications" : role === "ADMIN" ? "/admin/alertes" : role === "VALIDEUR" ? "/valideur/notifications" : "/juridique/notifications"); }}><i className="fa-solid fa-bell"/><span><strong>{n.titre || "Notification CLM"}</strong><small>{n.message || "Une nouvelle notification est disponible."}</small></span></button>) : <p className="clm-notification-empty">Aucune notification non lue.</p>}<button className="clm-notification-all" onClick={() => { setNotificationOpen(false); navigate(role === "GESTIONNAIRE" ? "/gestionnaire/notifications" : role === "ADMIN" ? "/admin/alertes" : role === "VALIDEUR" ? "/valideur/notifications" : "/juridique/notifications"); }}>Voir le centre de notifications <i className="fa-solid fa-arrow-right"/></button></div>}</div>
            <div className="clm-session">
              <i className="fa-solid fa-circle-user" aria-hidden="true" />
              <span><strong>{matricule === "Indisponible" ? roleNames[role] : `Matricule : ${matricule}`}</strong><small>{roleNames[role] || role}</small></span>
            </div>
            <button type="button" className="clm-logout" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket" /> <span>Déconnexion</span></button>
          </div>
        </header>
        <section className="clm-content">
          <div className="clm-page-heading">
            <div><span className="clm-page-kicker">ESPACE {roleNames[role]?.toUpperCase() || role}</span><h1>{page[0]}</h1><p>{page[1]}</p></div>
          </div>
          <Outlet />
        </section>
        <footer className="clm-footer"><span><b>SPAT</b> · Gestion du cycle de vie des contrats</span><span>Plateforme interne sécurisée</span></footer>
      </main>
    </div>
  );
}
