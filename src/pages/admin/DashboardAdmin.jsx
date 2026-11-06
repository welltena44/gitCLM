import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import "./DashboardAdmin.css";

const asArray = (value) => (Array.isArray(value) ? value : []);
const statusOf = (value) => String(value || "").toUpperCase();

export default function DashboardAdmin() {
  const [data, setData] = useState({ contracts: [], users: [], validations: [], types: [], resetRequests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const requests = await Promise.allSettled([
      api.get("/contrats"),
      api.get("/utilisateurs"),
      api.get("/validations"),
      api.get("/types-contrat/actifs"),
      api.get("/admin/password-reset-requests"),
      api.get("/contrats/sans-regles"),
    ]);
    const values = requests.map((result) =>
      result.status === "fulfilled" ? asArray(result.value.data) : null,
    );
    setData({
      contracts: values[0] || [],
      users: values[1] || [],
      validations: values[2] || [],
      types: values[3] || [],
      resetRequests: values[4] || [],
      sansRegles: values[5] || [],
    });
    if (requests.some((result) => result.status === "rejected")) {
      setError("Certaines données n’ont pas pu être chargées. Vérifiez les autorisations ADMIN et la disponibilité de l’API.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    const contracts = data.contracts;
    const pendingValidations = data.validations.filter((item) =>
      ["EN_ATTENTE", "EN_VALIDATION"].includes(statusOf(item.decision || item.statut)),
    );
    const inactiveUsers = data.users.filter((item) => item.actif === false).length;
    const draftContracts = contracts.filter((item) => statusOf(item.statut) === "BROUILLON").length;
    const activeContracts = contracts.filter((item) => ["ACTIF", "APPROUVE", "VALIDE", "SIGNE"].includes(statusOf(item.statut))).length;
    const sansRegles = data.sansRegles || [];
    return { pendingValidations, inactiveUsers, draftContracts, activeContracts, sansRegles };
  }, [data]);

  return (
    <main className="admin-home">
      <header className="admin-home-heading">
        <div>
          <span className="admin-home-eyebrow">ESPACE ADMINISTRATEUR</span>
          <h2><i className="fa-solid fa-gauge-high" aria-hidden="true" /> Tableau de bord ADMIN</h2>
          <p>Suivi des comptes, des circuits de validation et des opérations à traiter.</p>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          <i className="fa-solid fa-rotate" aria-hidden="true" /> Actualiser
        </button>
      </header>

      {error && <p className="admin-home-error" role="alert">{error}</p>}
      {loading ? <p className="admin-home-state">Chargement des indicateurs…</p> : (
        <>
          <section className="admin-home-metrics" aria-label="Indicateurs administratifs">
            <article><span>Contrats actifs</span><strong>{metrics.activeContracts}</strong></article>
            <article><span>Validations en attente</span><strong>{metrics.pendingValidations.length}</strong></article>
            <article><span>Demandes de réinitialisation</span><strong>{data.resetRequests.length}</strong></article>
            <article><span>Comptes désactivés</span><strong>{metrics.inactiveUsers}</strong></article>
          </section>

          <section className="admin-home-columns">
            <div className="admin-home-panel">
              <h3><i className="fa-solid fa-list-check" aria-hidden="true" /> Actions à suivre</h3>
              <ul className="admin-home-actions">
                <li><span>{data.resetRequests.length} demande(s) de réinitialisation à traiter</span><Link to="/admin/notifications">Consulter</Link></li>
                <li><span>{metrics.pendingValidations.length} validation(s) en attente</span><Link to="/admin/validations">Voir les validations</Link></li>
                <li><span>{metrics.draftContracts} contrat(s) au statut brouillon</span><Link to="/admin/contrats">Consulter les contrats</Link></li>
                <li><span>{metrics.inactiveUsers} compte(s) désactivé(s)</span><Link to="/admin/users">Gérer les utilisateurs</Link></li>
                <li><span>{metrics.sansRegles.length} contrat(s) sans règles de validation</span><Link to="/admin/contrats">Configurer les seuils</Link></li>
              </ul>
            </div>
            <div className="admin-home-panel">
              <h3><i className="fa-solid fa-screwdriver-wrench" aria-hidden="true" /> Administration</h3>
              <div className="admin-home-links">
                <Link to="/admin/users"><i className="fa-solid fa-users" aria-hidden="true" /> Utilisateurs <small>{data.users.length}</small></Link>
                <Link to="/admin/types-contrat"><i className="fa-solid fa-folder-tree" aria-hidden="true" /> Types de contrat <small>{data.types.length}</small></Link>
                <Link to="/admin/regles"><i className="fa-solid fa-scale-balanced" aria-hidden="true" /> Règles de validation</Link>
                <Link to="/admin/alertes"><i className="fa-solid fa-bell" aria-hidden="true" /> Paramètres des alertes</Link>
                <Link to="/admin/journaux"><i className="fa-solid fa-clipboard-list" aria-hidden="true" /> Journaux d’audit</Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
