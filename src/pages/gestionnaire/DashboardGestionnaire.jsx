import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as svc from '../../services/contractService.js';
import '../role-dashboard.css';
import './ManagerPages.css';

const date = value => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR')
  : '—';
const money = (value, currency = 'Ar') => `${Number(value || 0).toLocaleString('fr-FR')} ${currency || 'Ar'}`;

const statusLabel = status => ({
  BROUILLON: 'Brouillon',
  EN_ATTENTE: 'En attente',
  EN_VALIDATION: 'En validation',
  ACTIF: 'Actif',
  APPROUVE: 'Approuvé',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  EXPIRE: 'Expiré',
})[status] || status || 'Non défini';

const statusClass = status => ['ACTIF', 'APPROUVE', 'VALIDE'].includes(status)
  ? 'good'
  : ['EN_ATTENTE', 'EN_VALIDATION'].includes(status)
    ? 'pending'
    : ['REJETE', 'EXPIRE'].includes(status)
      ? 'bad'
      : 'neutral';

export default function DashboardGestionnaire() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [contractData, notificationData] = await Promise.all([
        svc.getContracts(),
        user?.id ? svc.getNotifications(user.id) : Promise.resolve([]),
      ]);
      setContracts(Array.isArray(contractData) ? contractData : []);
      setNotifications(Array.isArray(notificationData) ? notificationData : []);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const active = contracts.filter(contract => ['ACTIF', 'APPROUVE', 'VALIDE'].includes(contract.statut));
  const waiting = contracts.filter(contract => ['EN_ATTENTE', 'EN_VALIDATION'].includes(contract.statut));
  const due = contracts.filter(contract => {
    if (!contract.dateFin) return false;
    const endDate = new Date(`${contract.dateFin}T23:59:59`);
    const remaining = endDate - new Date();
    return remaining >= 0 && remaining <= 30 * 86400000;
  });
  const recent = useMemo(
    () => [...contracts]
      .sort((a, b) => String(b.dateModification || b.dateCreation || '')
        .localeCompare(String(a.dateModification || a.dateCreation || '')))
      .slice(0, 6),
    [contracts],
  );
  const unread = notifications.filter(notification => !notification.lu).length;

  return (
    <div className="role-dashboard mgr-page">
      <section className="role-welcome">
        <div className="role-welcome-icon"><i className="fa-solid fa-file-signature" /></div>
        <div>
          <span>ESPACE GESTIONNAIRE</span>
          <h2>Bonjour {user?.prenom || 'Gestionnaire'}</h2>
          <p>Vue d’ensemble du portefeuille, des validations et des échéances.</p>
        </div>
        <button className="mgr-btn secondary" onClick={load} disabled={loading}>
          <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-rotate'}`} /> Actualiser
        </button>
      </section>

      {error && <div className="mgr-inline-error"><i className="fa-solid fa-circle-exclamation" />{error}</div>}

      <div className="mgr-kpis">
        <div><span>Total des contrats</span><strong>{loading ? '—' : contracts.length}</strong><small>portefeuille accessible</small></div>
        <div><span>Contrats actifs</span><strong>{loading ? '—' : active.length}</strong><small>en vigueur</small></div>
        <div><span>Validations en attente</span><strong>{loading ? '—' : waiting.length}</strong><small>à suivre</small></div>
        <div><span>Échéances à 30 jours</span><strong>{loading ? '—' : due.length}</strong><small>à surveiller</small></div>
      </div>

      <section className="mgr-panel">
        <div className="mgr-panel-title">
          <div><h3>Contrats récemment modifiés</h3><p>Les derniers dossiers mis à jour.</p></div>
          <Link className="mgr-contract-link" to="/gestionnaire/contrats">Tous les contrats <i className="fa-solid fa-arrow-right" /></Link>
        </div>
        {loading ? <div className="mgr-state"><i className="fa-solid fa-spinner fa-spin" /> Chargement…</div>
          : recent.length === 0 ? <div className="mgr-state">Aucun contrat disponible pour le moment.</div>
            : <div className="mgr-contract-cards">{recent.map(contract => (
              <article className="mgr-contract-card" key={contract.id}><header><span className="mgr-file-icon"><i className="fa-solid fa-file-contract"/></span><span className={`mgr-status ${statusClass(contract.statut)}`}>{statusLabel(contract.statut)}</span></header><Link className="mgr-contract-link" to={`/gestionnaire/contrats/${contract.id}`}>{contract.reference || `CLM-${contract.id}`}</Link><h3>{contract.objet || 'Objet non renseigné'}</h3><div className="mgr-contract-card-meta"><span><small>Service</small>{contract.service || '—'}</span><span><small>Montant</small>{money(contract.montant,contract.devise)}</span><span><small>Échéance</small>{date(contract.dateFin)}</span><span><small>Mis à jour</small>{date(contract.dateModification || contract.dateCreation)}</span></div><footer><small>Ouvrir le dossier</small><Link className="mgr-contract-link" to={`/gestionnaire/contrats/${contract.id}`}><i className="fa-solid fa-arrow-right"/></Link></footer></article>
            ))}</div>}
      </section>

      <section className="mgr-panel">
        <div className="mgr-panel-title">
          <div><h3>Notifications récentes</h3><p>{unread} non lue(s)</p></div>
          <Link className="mgr-contract-link" to="/gestionnaire/notifications">Tout voir <i className="fa-solid fa-arrow-right" /></Link>
        </div>
        {notifications.length === 0 ? <div className="mgr-state">Aucune notification à afficher.</div>
          : notifications.slice(0, 4).map(notification => (
            <div className="mgr-notification" key={notification.id}>
              <span className="mgr-notif-icon"><i className="fa-solid fa-bell" /></span>
              <div className="mgr-notif-body">
                <div className="mgr-notif-head"><strong>{notification.titre || 'Notification CLM'}</strong>{!notification.lu && <span className="mgr-unread-dot">Non lue</span>}</div>
                <p>{notification.message}</p>
                <small>{notification.dateCreation ? new Date(notification.dateCreation).toLocaleString('fr-FR') : 'Date inconnue'}</small>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
