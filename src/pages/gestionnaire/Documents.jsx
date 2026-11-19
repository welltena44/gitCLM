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


export function ManagerDocumentsPage() {
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [q, setQ] = useState(""),
    [type, setType] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [autoRefresh, setAutoRefresh] = useState(false),
    [bulkDeleting, setBulkDeleting] = useState(false);
  const { toast, confirm } = useFeedback();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        api.get("/documents").then((r) => r.data),
        svc.getContracts(),
      ]);
      setItems(d || []);
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
  const bulkDeleteSelected = async () => {
    const selected = items.filter((d) => d._selected);
    if (!selected.length) { toast("Aucun document sélectionné.", "info"); return; }
    if (!(await confirm({ title: "Suppression en masse ?", message: "Supprimer les documents sélectionnés ?", confirmLabel: "Supprimer", danger: true }))) return;
    setBulkDeleting(true);
    try {
      for (const d of selected) {
        try { await svc.deleteDocument(d.id); } catch (e) {}
      }
      await load();
      toast("Documents supprimés.", "success");
    } catch (e) { toast(errMessage(e), "error"); }
    finally { setBulkDeleting(false); }
  };
  const data = items.filter((d) => {
    const c = contracts.find((x) => String(x.id) === String(d.contratId));
    return (
      (!type ||
        String(d.type || "")
          .toLowerCase()
          .includes(type.toLowerCase())) &&
      (!q ||
        `${d.nomFichier || ""} ${c?.reference || ""} ${c?.objet || ""}`
          .toLowerCase()
          .includes(q.toLowerCase()))
    );
  });
  const download = async (d) => {
    try {
      const blob = await svc.downloadDocument(d.id);
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = d.nomFichier || "document";
      a.click();
      URL.revokeObjectURL(u);
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <h2>Documents contractuels</h2>
        </div>
        <Button variant="secondary" onClick={load}>
          <InlineIcon className="fa-solid fa-rotate" /> Actualiser
        </Button>
        <label className="mgr-btn secondary" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ display: "none" }} />
          <InlineIcon className={`fa-solid ${autoRefresh ? "fa-bell" : "fa-bell-slash"}`} /> Auto-rafraîchissement
        </label>
        <Button variant="danger" onClick={bulkDeleteSelected} disabled={bulkDeleting}>
          <InlineIcon className="fa-solid fa-trash" /> Supprimer la sélection
        </Button>
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
                placeholder="Nom du fichier, référence du contrat…"
              />
            </div>
          </label>
          <label className="mgr-field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous les types</option>
              {[...new Set(items.map((d) => d.type).filter(Boolean))].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <LoadingOrEmpty
          loading={loading}
          error={error}
          empty={!loading && !data.length}
        />
        {data.length > 0 && (
          <Pagination items={data} resetKey={`${q}:${type}`}>
            {(visibleRows) => (
          <div className="mgr-table-wrap">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Contrat</th>
                  <th>Type / version</th>
                  <th>Date d’ajout</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((d) => {
                  const c = contracts.find(
                    (x) => String(x.id) === String(d.contratId),
                  );
                  return (
                    <tr key={d.id}>
                      <td>
                        <input type="checkbox" checked={!!d._selected} onChange={(e) => setItems((old) => old.map((x) => x.id === d.id ? { ...x, _selected: e.target.checked } : x))} style={{ marginRight: "0.5rem" }} />
                        <strong>{d.nomFichier}</strong>
                      </td>
                      <td>
                        <Link
                          className="mgr-contract-link"
                          to={`/gestionnaire/contrats/${d.contratId}`}
                        >
                          {c?.reference || `Contrat #${d.contratId}`}
                        </Link>
                        <small>{c?.objet || ""}</small>
                      </td>
                      <td>
                        {d.type || "—"}
                        <small>Version {d.version || 1}</small>
                      </td>
                      <td>{date(d.dateImport)}</td>
                      <td>
                        <Button variant="secondary" onClick={() => download(d)}>
                          <InlineIcon className="fa-solid fa-download" /> Télécharger
                        </Button>
                      </td>
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

export default ManagerDocumentsPage;
