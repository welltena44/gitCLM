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


export function ManagerAmendmentsPage() {
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [q, setQ] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [autoRefresh, setAutoRefresh] = useState(false),
    [bulkResubmitting, setBulkResubmitting] = useState(false);
  const { toast, confirm } = useFeedback();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        svc.getAmendments(),
        svc.getContracts(),
      ]);
      setItems(a || []);
      setContracts(c || []);
      setError("");
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => load(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);
  const bulkResubmit = async () => {
    const toResubmit = items.filter((a) => a.statut === "MODIFICATION_DEMANDEE");
    if (!toResubmit.length) { toast("Aucun avenant à corriger.", "info"); return; }
    if (!(await confirm({ title: "Resoumettre en masse ?", message: "Resoumettre tous les avenants en demande de modification ?", confirmLabel: "Resoumettre" }))) return;
    setBulkResubmitting(true);
    try {
      for (const a of toResubmit) {
        try { await svc.resubmitAmendment(a.id); } catch (e) {}
      }
      await load();
      toast(toResubmit.length + " avenant(s) resoumis.", "success");
    } catch (e) { toast(errMessage(e), "error"); }
    finally { setBulkResubmitting(false); }
  };
  const data = items.filter(
    (a) =>
      !q ||
      `${a.numero} ${a.description} ${contracts.find((c) => String(c.id) === String(a.contratId))?.reference || ""}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <h2>Mes avenants</h2>
        </div>
        <Button variant="secondary" onClick={load}>
          <InlineIcon className="fa-solid fa-rotate" /> Actualiser
        </Button>
        <label className="mgr-btn secondary" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ display: "none" }} />
          <InlineIcon className={`fa-solid ${autoRefresh ? "fa-bell" : "fa-bell-slash"}`} /> Auto-rafraîchissement
        </label>
        <Button variant="primary" onClick={bulkResubmit} disabled={bulkResubmitting}>
          <InlineIcon className="fa-solid fa-arrows-rotate" /> Resoumettre tout
        </Button>
      </div>
      <section className="mgr-panel">
        <label className="mgr-field">
          <span>Recherche par numéro, description ou référence</span>
          <div className="mgr-search">
            <InlineIcon className="fa-solid fa-magnifying-glass" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un avenant…"
            />
          </div>
        </label>
        <LoadingOrEmpty
          loading={loading}
          error={error}
          empty={!loading && !data.length}
        />
        {data.length > 0 && (
          <Pagination items={data} resetKey={q}>
            {(visibleRows) => (
          <div className="mgr-table-wrap">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Avenant</th>
                  <th>Contrat d’origine</th>
                  <th>Date</th>
                  <th>Montant après</th>
                  <th>Statut / cycle</th>
                  <th>Modifications</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((a) => {
                  const c = contracts.find(
                    (x) => String(x.id) === String(a.contratId),
                  );
                  return (
                    <tr key={a.id}>
                      <td>
                        <strong>Avenant n°{a.numero}</strong>
                        <small>#{a.id}</small>
                      </td>
                      <td>
                        <Link
                          className="mgr-contract-link"
                          to={`/gestionnaire/contrats/${a.contratId}`}
                        >
                          {c?.reference || `Contrat #${a.contratId}`}
                        </Link>
                        <small>{c?.objet || ""}</small>
                      </td>
                      <td>{date(a.dateAvenant)}</td>
                      <td>{money(a.montantApres, c?.devise)}</td>
                      <td>
                        <span className={`mgr-amendment-status ${statusClass(a.statut)}`}>
                          {statusLabel(a.statut || "EN_ATTENTE")}
                        </span>
                        <small>Cycle {a.cycleValidation || 1}</small>
                        {a.statut === "MODIFICATION_DEMANDEE" && (
                          <button
                            type="button"
                            className="mgr-link-button"
                            onClick={async () => {
                              try {
                                await svc.resubmitAmendment(a.id);
                                await load();
                              } catch (error) {
                                setError(errMessage(error));
                              }
                            }}
                          >Resoumettre</button>
                        )}
                      </td>
                      <td>{a.modifications || a.description || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            )}
          </Pagination>
        )}
      </section>
    </div>
  );
}

export default ManagerAmendmentsPage;
