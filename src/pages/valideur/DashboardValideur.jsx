import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import "../role-dashboard.css";
import "./Validation.css";

export default function DashboardValideur() {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/validations"), api.get("/contrats")])
      .then(([v, c]) => {
        setItems(v.data || []);
        setContracts(c.data || []);
      })
      .catch(() =>
        setError("Impossible de charger votre activité de validation."),
      );
  }, []);
  const mine = items.filter(
    (v) => !v.valideurId || String(v.valideurId) === String(user?.id),
  );
  const pending = mine.filter((v) => v.decision === "EN_ATTENTE");
  const decisions = mine.filter((v) => v.decision !== "EN_ATTENTE");
  const upcoming = pending.slice(0, 5);
  return (
    <div className="role-dashboard validation-dashboard">
      
      {error && (
        <p role="alert" className="validation-error">
          {error}
        </p>
      )}
      <div className="validation-kpis">
        <article>
          <span>À traiter</span>
          <strong>{pending.length}</strong>
        </article>
        <article>
          <span>Décisions rendues</span>
          <strong>{decisions.length}</strong>
        </article>
        <article>
          <span>Contrats suivis</span>
          <strong>{new Set(mine.map((v) => v.contratId)).size}</strong>
        </article>
      </div>
      <section className="validation-panel">
        <header>
          <div>
            <h3>Demandes en attente</h3>
            <p>Les validations qui attendent votre décision.</p>
          </div>
          <Link to="/valideur/validations">
            Ouvrir la file <i className="fa-solid fa-arrow-right" />
          </Link>
        </header>
        {upcoming.length ? (
          <div className="validation-list">
            {upcoming.map((v) => {
              const c = contracts.find(
                (x) => String(x.id) === String(v.contratId),
              );
              return (
                <div key={v.id}>
                  <span>
                    <strong>{c?.reference || `Contrat #${v.contratId}`}</strong>
                    <small>{c?.objet || "Dossier contractuel"}</small>
                  </span>
                  <span>
                    {c
                      ? `${Number(c.montant || 0).toLocaleString("fr-FR")} ${c.devise || "Ar"}`
                      : `Niveau ${v.niveau}`}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="validation-empty">Aucune demande en attente.</p>
        )}
      </section>
    </div>
  );
}
