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


export function ManagerValidationsPage() {
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [users, setUsers] = useState([]),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [autoRefresh, setAutoRefresh] = useState(false);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetContractId = searchParams.get("contratId");
  const [busyDecision, setBusyDecision] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, c, directory] = await Promise.all([
        svc.getValidations(),
        svc.getContracts(),
        api.get("/utilisateurs").then(response => response.data),
      ]);
      setItems(v || []);
      setContracts(c || []);
      setUsers(directory || []);
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
  const decide = async (item, decision) => {
    setBusyDecision(item.id);
    try { await api.post(`/validations/${item.id}/decider`, { decision, commentaire: "" }); await load(); }
    catch (e) { setError(errMessage(e)); }
    finally { setBusyDecision(null); }
  };
  const data = items.filter((v) => {
    const c = contracts.find((x) => String(x.id) === String(v.contratId));
    return (
      (!filter ||
        String(v.decision || "EN_ATTENTE").toUpperCase() ===
          filter) &&
      (!targetContractId || String(v.contratId) === targetContractId) &&
      (!q ||
        `${c?.reference || ""} ${c?.objet || ""} ${v.commentaire || ""} ${v.id || ""}`
          .toLowerCase()
          .includes(q.toLowerCase()))
    );
  });
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <h2>Suivi des validations</h2>
        </div>
        <Button variant="secondary" onClick={load}>
          <InlineIcon className="fa-solid fa-rotate" /> Actualiser
        </Button>
        <label className="mgr-btn secondary" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ display: "none" }} />
          <InlineIcon className={`fa-solid ${autoRefresh ? "fa-bell" : "fa-bell-slash"}`} /> Auto-rafraîchissement
        </label>
      </div>
      <section className="mgr-panel">
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche</span>
            <div className="mgr-search">
              <InlineIcon className="fa-solid fa-magnifying-glass" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Référence, contrat, commentaire…"
              />
            </div>
          </label>
          <label className="mgr-field">
            <span>Décision</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Toutes</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="APPROUVE">Approuvée</option>
              <option value="REJETE">Rejetée</option>
              <option value="CORRECTION">À corriger</option>
            </select>
          </label>
        </div>
        <LoadingOrEmpty
          loading={loading}
          error={error}
          empty={!loading && !data.length}
        />
        {!loading && data.length > 0 && (
          <Pagination
            items={data}
            resetKey={`${q}:${filter}:${targetContractId || ""}`}
          >
            {(visibleRows) => (
          <div className="mgr-table-wrap">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Contrat</th>
                  <th>Étape / valideur</th>
                  <th>Décision</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((v) => {
                  const c = contracts.find(
                    (x) => String(x.id) === String(v.contratId),
                  );
                  const validator = users.find(
                    (person) => String(person.id) === String(v.valideurId),
                  );
                  const validatorName = validator
                    ? validator.matricule ||
                      [validator.prenom, validator.nom].filter(Boolean).join(" ") ||
                      `Compte #${validator.id}`
                    : v.valideurId
                      ? `Compte #${v.valideurId}`
                      : `À attribuer · ${v.roleRequis || "rôle non précisé"}`;
                  return (
                    <tr key={v.id} className={String(v.contratId) === targetContractId ? "notification-target" : ""}>
                      <td>
                        <strong>
                          {c?.reference || `Contrat #${v.contratId || "—"}`}
                        </strong>
                        <small>{c?.objet || "Objet indisponible"}</small>
                      </td>
                      <td>
                        {v.etape || `${v.roleRequis || "Validation"} — niveau ${v.niveau ?? "—"}`}
                        <small>{validatorName}</small>
                      </td>
                      <td>
                        <span
                          className={`mgr-status ${statusClass(String(v.decision || "EN_ATTENTE").toUpperCase())}`}
                        >
                          {statusLabel(
                            String(
                              v.decision || "EN_ATTENTE",
                            ).toUpperCase(),
                          )}
                        </span>
                      </td>
                      <td>{v.commentaire || "—"}</td>
                      <td>{date(v.dateValidation || v.dateSoumission)}</td>
                      <td>{v.decision === "EN_ATTENTE" && v.valideurId == null && user?.role === v.roleRequis ? <div className="mgr-row-actions"><button title="Approuver" disabled={busyDecision === v.id} onClick={() => decide(v, "APPROUVE")}><InlineIcon className="fa-solid fa-check"/></button><button title="Demander une modification" disabled={busyDecision === v.id} onClick={() => decide(v, "MODIFICATION_DEMANDEE")}><InlineIcon className="fa-solid fa-pen"/></button><button title="Rejeter" className="danger" disabled={busyDecision === v.id} onClick={() => decide(v, "REJETE")}><InlineIcon className="fa-solid fa-xmark"/></button></div> : "—"}</td>
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

export default ManagerValidationsPage;
