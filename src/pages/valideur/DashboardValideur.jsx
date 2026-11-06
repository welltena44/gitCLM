import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import validationService from "../../services/validationService.js";
import Pagination from "../../composants/Pagination.jsx";
import DashboardBarChart from "../DashboardBarChart.jsx";
import "../role-dashboard.css";
import "./Validation.css";

export default function DashboardValideur() {
  const { user } = useAuth();
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");

  useEffect(() => {
    Promise.all([validationService.list(), api.get("/contrats")])
      .then(([v, c]) => {
        setItems(v.data || []);
        setContracts(c.data || []);
      })
      .catch(() =>
        setError("Impossible de charger votre activité de validation."),
      )
      .finally(() => setLoading(false));
  }, []);

  const canExamine = (validation) =>
    validation.roleRequis === "VALIDEUR" &&
    (validation.valideurId == null || String(validation.valideurId) === String(user?.id));
  const finalDecisions = ["APPROUVE", "REJETE", "MODIFICATION_DEMANDEE"];
  const pending = items.filter((v) => v.decision === "EN_ATTENTE" && canExamine(v));
  const decisions = items.filter((v) => finalDecisions.includes(v.decision) && canExamine(v));

  const decisionLabels = {
    EN_ATTENTE: "En attente",
    APPROUVE: "Approuvées",
    REJETE: "Rejetées",
    MODIFICATION_DEMANDEE: "Modifications demandées",
  };

  const decisionCounts = Array.from(
    items.filter((validation) => canExamine(validation) && (validation.decision === "EN_ATTENTE" || finalDecisions.includes(validation.decision))).reduce((counts, validation) => {
      const decision = String(validation.decision || "NON_DEFINIE").toUpperCase();
      const label = decisionLabels[decision] || decision.replaceAll("_", " ");
      counts.set(label, (counts.get(label) || 0) + 1);
      return counts;
    }, new Map()),
  ).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "fr"));

  return (
    <div className="role-dashboard validation-dashboard">
      <header className="validation-dashboard-heading">
        <div>
          <span className="role-welcome-eyebrow">ESPACE VALIDEUR</span>
          <h2>
            <i className="fa-solid fa-clipboard-check page-title-icon" />
            Tableau de bord
          </h2>
          <p>Vue d'ensemble de votre activité de validation.</p>
        </div>
      </header>
      {error && <p role="alert" className="validation-error">{error}</p>}
      <div className="validation-kpis">
        <article><span>À traiter</span><strong>{pending.length}</strong></article>
        <article><span>Décisions rendues</span><strong>{decisions.length}</strong></article>
        <article><span>Contrats suivis</span><strong>{new Set(items.filter(canExamine).map((v) => v.contratId)).size}</strong></article>
      </div>
      <DashboardBarChart title="Décisions de validation" rows={decisionCounts} emptyLabel="Aucune validation." />
      <section className="validation-panel">
        <header>
          <div>
            <h3>Demandes en attente</h3>
            <p>Les validations qui attendent votre décision.</p>
          </div>
          <Link to="/valideur/contrats">Ouvrir la file <i className="fa-solid fa-arrow-right" /></Link>
        </header>
        {loading ? <p className="validation-empty">Chargement des validations…</p> : pending.length ? (
          <Pagination items={pending}>
            {(visibleItems) => (
              <div className="validation-list">
                {visibleItems.map((v) => {
                  const c = contracts.find((x) => String(x.id) === String(v.contratId));
                  return (
                    <Link className="validation-pending-link" key={v.id} to={`/valideur/contrats?contratId=${v.contratId}`}>
                      <span className="validation-pending-copy">
                        <strong>{c?.reference || `Contrat #${v.contratId}`}</strong>
                        <small>{c?.objet || "Dossier contractuel"}</small>
                      </span>
                      <span className="validation-pending-meta">{c ? `${Number(c.montant || 0).toLocaleString("fr-FR")} ${c.devise || "Ar"}` : `Niveau ${v.niveau}`}</span>
                      <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            )}
          </Pagination>
        ) : <p className="validation-empty">Aucune demande en attente.</p>}
      </section>
    </div>
  );
}
