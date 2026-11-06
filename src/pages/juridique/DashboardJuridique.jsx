import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import "../role-dashboard.css";
import "./JuridiqueDashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [validations, setValidations] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [validationResponse, contractResponse] = await Promise.all([
        api.get("/validations"),
        api.get("/contrats"),
      ]);
      setValidations(Array.isArray(validationResponse.data) ? validationResponse.data : []);
      setContracts(Array.isArray(contractResponse.data) ? contractResponse.data : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Impossible de charger les validations à examiner.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = validations.filter((validation) =>
    validation.roleRequis === "JURIDIQUE" &&
    validation.decision === "EN_ATTENTE" &&
    (validation.valideurId == null || String(validation.valideurId) === String(user?.id)),
  );

  return (
    <div className="role-dashboard legal-dashboard">
      <section className="role-welcome">
        <div className="role-welcome-icon">
          <i className="fa-solid fa-scale-balanced" aria-hidden="true" />
        </div>
        <div>
          <span>ESPACE JURIDIQUE / ACHATS</span>
          <h2>Bienvenue dans votre espace juridique / achats</h2>
          <p>Suivez les validations qui attendent votre examen.</p>
        </div>
        <button className="legal-dashboard-refresh" type="button" onClick={load} disabled={loading}>
          <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-rotate"}`} aria-hidden="true" />
          Actualiser
        </button>
      </section>

      {error && <p className="legal-state error" role="alert">{error}</p>}

      <section className="legal-dashboard-panel">
        <header>
          <div>
            <h3>Validations à examiner</h3>
            <p>{loading ? "Chargement…" : `${pending.length} dossier(s) à traiter`}</p>
          </div>
          <Link to="/juridique/validations">
            Ouvrir toutes les validations <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </header>
        {loading ? (
          <p className="legal-state">Chargement des validations…</p>
        ) : pending.length ? (
          <div className="legal-dashboard-list">
            {pending.slice(0, 6).map((validation) => {
              const contract = contracts.find((item) => String(item.id) === String(validation.contratId));
              return (
                <Link
                  className="legal-dashboard-item"
                  key={validation.id}
                  to={`/juridique/validations?contratId=${validation.contratId}`}
                >
                  <span className="legal-dashboard-item-icon">
                    <i className="fa-solid fa-file-signature" aria-hidden="true" />
                  </span>
                  <span className="legal-dashboard-item-copy">
                    <strong>{contract?.reference || `Contrat #${validation.contratId}`}</strong>
                    <small>{contract?.objet || "Dossier contractuel"}</small>
                  </span>
                  <span className="legal-dashboard-level">Niveau {validation.niveau}</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="legal-empty">Aucune validation n’attend actuellement votre examen.</p>
        )}
      </section>
    </div>
  );
}
