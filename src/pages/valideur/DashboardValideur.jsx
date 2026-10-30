import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import Pagination from "../../composants/Pagination.jsx";
import DashboardBarChart from "../DashboardBarChart.jsx";
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
  const upcoming = pending;
  const decisionLabels = {
    EN_ATTENTE: "En attente",
    APPROUVE: "Approuvées",
    VALIDE: "Validées",
    REJETE: "Rejetées",
    MODIFICATION_DEMANDEE: "Modifications demandées",
  };
  const decisionCounts = Array.from(
    mine.reduce((counts, validation) => {
      const decision = String(validation.decision || "NON_DEFINIE").toUpperCase();
      const label = decisionLabels[decision] || decision.replaceAll("_", " ");
      counts.set(label, (counts.get(label) || 0) + 1);
      return counts;
    }, new Map()),
  ).sort(
    (left, right) =>
      right[1] - left[1] || left[0].localeCompare(right[0], "fr"),
  );
  return (
    <div className="role-dashboard validation-dashboard">
      <header className="validation-dashboard-heading">
        <h2>
          <i
            className="fa-solid fa-clipboard-check page-title-icon"
            aria-hidden="true"
          />
          Tableau de bord
        </h2>
      </header>
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
      <DashboardBarChart
        title="Décisions de validation"
        rows={decisionCounts}
        emptyLabel="Aucune validation à représenter."
      />
      <section className="validation-panel">
        <header>
          <div>
            <h3>Demandes en attente</h3>
            <p>Les validations qui attendent votre décision.</p>
          </div>
          <Link to="/valideur/contrats">
            Ouvrir la file <i className="fa-solid fa-arrow-right" />
          </Link>
        </header>
        {upcoming.length ? (
          <Pagination items={upcoming}>
            {(visibleItems) => (
          <div className="validation-list">
            {visibleItems.map((v) => {
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
            )}
          </Pagination>
        ) : (
          <p className="validation-empty">Aucune demande en attente.</p>
        )}
      </section>
    </div>
  );
}
