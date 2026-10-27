import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getContracts,
  getContractTypes,
  getValidations,
  getAmendments,
  getParties,
  getDocuments,
  downloadDocument,
} from "../../services/contractService.js";
import EngagementDashboard from "../EngagementDashboard.jsx";
import "./LegalPages.css";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("fr-FR") : "—";
const money = (value, currency = "Ar") =>
  value == null
    ? "—"
    : `${Number(value).toLocaleString("fr-FR")} ${currency || "Ar"}`;
const err = (e) =>
  e?.response?.data?.message ||
  e?.message ||
  "Impossible de charger les données.";

// Détermine la classe visuelle d’un statut. Cette fonction est partagée par le tableau de bord et les listes juridiques.
const getStatusClass = (status) =>
  ["ACTIF", "APPROUVE", "VALIDE", "SIGNE"].includes(
    String(status).toUpperCase(),
  )
    ? "good"
    : ["EN_ATTENTE", "EN_VALIDATION"].includes(String(status).toUpperCase())
      ? "pending"
      : ["REJETE", "EXPIRE"].includes(String(status).toUpperCase())
        ? "bad"
        : "neutral";

// Prépare un aperçu structuré des snapshots de contrat archivés.
function versionRecap(content) {
  if (!content) return [];
  let value = content;
  if (typeof content === "string") {
    try {
      value = JSON.parse(content);
    } catch {
      return [["Résumé", content]];
    }
  }
  if (typeof value !== "object" || Array.isArray(value))
    return [["Résumé", String(value)]];
  return Object.entries(value)
    .slice(0, 10)
    .map(([key, item]) => [
      key.replace(/([A-Z])/g, " $1"),
      typeof item === "object" && item !== null
        ? JSON.stringify(item, null, 2)
        : String(item ?? "—"),
    ]);
}

function useLegalData() {
  const [data, setData] = useState({
    contracts: [],
    types: [],
    rules: [],
    validations: [],
    versions: [],
    amendments: [],
    users: [],
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const jobs = [
      getContracts(),
      getContractTypes(),
      api.get("/regles-validation").then((r) => r.data),
      getValidations(),
      api.get("/versions-contrat").then((r) => r.data),
      getAmendments(),
      api.get("/utilisateurs").then((r) => r.data),
    ];
    const results = await Promise.allSettled(jobs);
    const keys = [
      "contracts",
      "types",
      "rules",
      "validations",
      "versions",
      "amendments",
      "users",
    ];
    const next = {};
    results.forEach((r, i) => {
      next[keys[i]] =
        r.status === "fulfilled" && Array.isArray(r.value) ? r.value : [];
    });
    setData(next);
    const failure = results.find((r) => r.status === "rejected");
    if (failure) setError(err(failure.reason));
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { data, loading, error, load };
}

function LegalFrame({
  title,
  description,
  loading,
  error,
  onRefresh,
  children,
}) {
  return (
    <main className="legal-page">
      <header className="legal-page-head">
        <div>
          <p className="legal-eyebrow">ESPACE JURIDIQUE · CONSULTATION</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button className="legal-refresh" onClick={onRefresh}>
          <i className="fa-solid fa-rotate" /> Actualiser
        </button>
      </header>
      {loading ? (
        <p className="legal-state">Chargement des données…</p>
      ) : error ? (
        <p className="legal-state error">{error}</p>
      ) : (
        children
      )}
    </main>
  );
}

function LegalReviewDialog({
  validation,
  contract,
  busy,
  onDecide,
  allowDecision,
  typeName,
  onClose,
}) {
  const [details, setDetails] = useState({
    parties: [],
    documents: [],
    loading: true,
    error: "",
  });
  const [comment, setComment] = useState(""),
    [commentError, setCommentError] = useState(""),
    [downloadBusy, setDownloadBusy] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getParties(validation.contratId),
      getDocuments(validation.contratId),
    ]).then(([parties, documents]) => {
      if (!active) return;
      const failed =
        parties.status === "rejected" || documents.status === "rejected";
      setDetails({
        parties:
          parties.status === "fulfilled" && Array.isArray(parties.value)
            ? parties.value
            : [],
        documents:
          documents.status === "fulfilled" && Array.isArray(documents.value)
            ? documents.value
            : [],
        loading: false,
        error: failed
          ? "Certaines informations complémentaires n’ont pas pu être chargées."
          : "",
      });
    });
    return () => {
      active = false;
    };
  }, [validation.contratId]);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const download = async (document) => {
    setDownloadBusy(document.id);
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.nomFichier || "document-contrat";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setDetails((current) => ({
        ...current,
        error: "Le téléchargement du document a échoué.",
      }));
    } finally {
      setDownloadBusy(null);
    }
  };
  const decide = (decision) => {
    if (decision === "MODIFICATION_DEMANDEE" && !comment.trim()) {
      setCommentError(
        "Le commentaire est obligatoire pour justifier la demande de modification.",
      );
      return;
    }
    setCommentError("");
    onDecide(validation, decision, comment.trim());
  };
  return (
    <div
      className="legal-review-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="legal-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-review-title"
      >
        <header className="legal-review-header">
          <div>
            <span className="legal-eyebrow">DOSSIER SOUMIS À VALIDATION</span>
            <h2 id="legal-review-title">
              {contract?.reference || `Contrat #${validation.contratId}`}
            </h2>
            <p>{contract?.objet || "Objet non renseigné"}</p>
          </div>
          <button
            type="button"
            className="legal-review-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>
        <div className="legal-review-body">
          <div className="legal-review-summary">
            <div>
              <small>Type de contrat</small>
              <strong>{typeName || "—"}</strong>
            </div>
            <div>
              <small>Montant</small>
              <strong>{money(contract?.montant, contract?.devise)}</strong>
            </div>
            <div>
              <small>Statut</small>
              <strong>{contract?.statut || "EN_VALIDATION"}</strong>
            </div>
            <div>
              <small>Service</small>
              <strong>{contract?.service || "—"}</strong>
            </div>
            <div>
              <small>Date de début</small>
              <strong>{formatDate(contract?.dateDebut)}</strong>
            </div>
            <div>
              <small>Date de fin</small>
              <strong>{formatDate(contract?.dateFin)}</strong>
            </div>
            <div>
              <small>Date de signature</small>
              <strong>{formatDate(contract?.dateSignature)}</strong>
            </div>
            <div>
              <small>Durée / préavis</small>
              <strong>
                {contract?.dureeMois ? `${contract.dureeMois} mois` : "—"} /{" "}
                {contract?.joursPreavis ?? 0} jour(s)
              </strong>
            </div>
            <div>
              <small>Renouvellement automatique</small>
              <strong>
                {contract?.renouvellementAutomatique ? "Oui" : "Non"}
              </strong>
            </div>
            <div>
              <small>Demande reçue le</small>
              <strong>{formatDate(validation.dateSoumission)}</strong>
            </div>
            <div className="wide">
              <small>Description</small>
              <p>{contract?.description || "Aucune description renseignée."}</p>
            </div>
            <div className="wide">
              <small>Clauses</small>
              <p>{contract?.clauses || "Aucune clause renseignée."}</p>
            </div>
          </div>
          <section className="legal-review-section">
            <h3>Parties prenantes</h3>
            {details.loading ? (
              <p>Chargement…</p>
            ) : details.parties.length ? (
              <div className="legal-review-parties">
                {details.parties.map((p) => (
                  <article key={p.id}>
                    <strong>{p.nom}</strong>
                    <span>{p.type || "Partie"}</span>
                    <small>
                      {p.email || "Sans email"} ·{" "}
                      {p.telephone || "Sans téléphone"}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <p>Aucune partie prenante enregistrée.</p>
            )}
          </section>
          <section className="legal-review-section">
            <h3>Pièces jointes</h3>
            {details.loading ? (
              <p>Chargement…</p>
            ) : details.documents.length ? (
              <ul className="legal-doc-list">
                {details.documents.map((d) => (
                  <li key={d.id}>
                    <span>
                      <i className="fa-regular fa-file-pdf" />{" "}
                      {d.nomFichier || d.categorie || "Document"}
                      <small>{d.type || d.categorie || "Pièce jointe"}</small>
                    </span>
                    <button
                      type="button"
                      disabled={downloadBusy === d.id}
                      onClick={() => download(d)}
                    >
                      <i className="fa-solid fa-download" />{" "}
                      {downloadBusy === d.id
                        ? "Téléchargement…"
                        : "Télécharger"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun document joint.</p>
            )}
          </section>
          {details.error && (
            <p className="legal-state error">{details.error}</p>
          )}
          {allowDecision ? (
            <label className="legal-decision-comment">
              Commentaire de décision
              <textarea
                rows="3"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setCommentError("");
                }}
                placeholder="Obligatoire pour justifier une demande de modification; facultatif sinon."
              />
            </label>
          ) : (
            <p className="legal-assigned">
              Cette demande est attribuée à un autre compte Juridique; vous
              pouvez consulter le dossier en lecture seule.
            </p>
          )}
          {commentError && (
            <p className="legal-state error" role="alert">
              {commentError}
            </p>
          )}
        </div>
        <footer className="legal-review-footer">
          {allowDecision ? (
            <div className="legal-card-actions">
              <button
                className="approve"
                disabled={busy}
                onClick={() => decide("APPROUVE")}
              >
                <i className="fa-solid fa-check" /> Approuver
              </button>
              <button
                className="request"
                disabled={busy}
                onClick={() => decide("MODIFICATION_DEMANDEE")}
              >
                <i className="fa-solid fa-pen" /> Demander correction
              </button>
              <button
                className="reject"
                disabled={busy}
                onClick={() => decide("REJETE")}
              >
                <i className="fa-solid fa-xmark" /> Rejeter
              </button>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="legal-review-close-text"
            onClick={onClose}
          >
            Fermer
          </button>
        </footer>
      </section>
    </div>
  );
}

function LegalDashboard({ data, loading, error, load }) {
  return (
    <EngagementDashboard
      role="JURIDIQUE"
      contracts={data.contracts}
      types={data.types}
      validations={data.validations}
      users={data.users}
      loading={loading}
      error={error}
      onRefresh={load}
    />
  );
}

function LegalRules({ data, loading, error, load }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetRuleId = searchParams.get("regleId");
  const emptyForm = { montantMinimum: "", montantMaximum: "" };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const openEdit = (rule) => {
    setForm({
      montantMinimum: rule.montantMinimum ?? 0,
      montantMaximum: rule.montantMaximum ?? "",
    });
    setEditing(rule.id);
    setShowForm(true);
    setActionError("");
  };
  useEffect(() => {
    if (!targetRuleId || loading) return;
    const rule = data.rules.find((item) => String(item.id) === targetRuleId);
    if (!rule) return;
    setForm({
      montantMinimum: rule.montantMinimum ?? "",
      montantMaximum: rule.montantMaximum ?? "",
    });
    setEditing(rule.id);
    setShowForm(true);
    setActionError("");
    setSearchParams(
      (current) => {
        current.delete("regleId");
        return current;
      },
      { replace: true },
    );
  }, [targetRuleId, loading, data.rules, setSearchParams]);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    const payload = {
      ...form,
      montantMinimum: Number(form.montantMinimum),
      montantMaximum:
        form.montantMaximum === "" ? null : Number(form.montantMaximum),
    };
    try {
      if (editing == null) await api.post("/regles-validation", payload);
      else await api.put(`/regles-validation/${editing}`, payload);
      setEditing(null);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e) {
      setActionError(err(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <LegalFrame
      title="Seuils de validation"
      description="Définissez les bornes financières des circuits créés par l’Administrateur. Toute modification attend sa confirmation."
      loading={loading}
      error={error}
      onRefresh={load}
    >
      {actionError && (
        <p className="legal-state error" role="alert">
          {actionError}
        </p>
      )}
      <section className="legal-panel">
        <div className="legal-panel-head">
          <h3>Circuits à paramétrer</h3>
        </div>
        <p className="legal-rule-help">
          Sélectionnez une règle créée par l’Administrateur pour définir ou
          modifier son seuil. Une modification doit être confirmée par
          l’Administrateur avant de s’appliquer.
        </p>
        <div className="legal-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Niveau</th>
                <th>Rôle requis</th>
                <th>Montant minimum</th>
                <th>Montant maximum</th>
                <th>État</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rules.map((r) => (
                <tr
                  key={r.id}
                  className={
                    String(r.id) === targetRuleId ? "notification-target" : ""
                  }
                >
                  <td>
                    {data.types.find(
                      (t) => String(t.id) === String(r.typeContratId),
                    )?.nom || "Tous les types"}
                  </td>
                  <td>{r.niveau}</td>
                  <td>
                    <span className="legal-tag">{r.roleRequis}</span>
                  </td>
                  <td>
                    {r.statut === "EN_ATTENTE_SEUIL"
                      ? "À définir"
                      : money(r.montantMinimum)}
                  </td>
                  <td>
                    {r.statut === "EN_ATTENTE_SEUIL"
                      ? "À définir"
                      : r.montantMaximum == null
                        ? "Sans plafond"
                        : money(r.montantMaximum)}
                  </td>
                  <td>
                    {r.statut === "ACTIVE"
                      ? "Confirmé"
                      : r.statut === "EN_ATTENTE_CONFIRMATION"
                        ? "En attente de confirmation Admin"
                        : "À définir par le Juridique"}
                  </td>
                  <td>
                    <div className="legal-row-actions">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        aria-label={`Définir ou modifier le seuil de la règle ${r.id}`}
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.rules.length && (
            <p className="legal-empty">
              Aucun circuit n’a encore été créé par l’Administrateur.
            </p>
          )}
        </div>
      </section>
      {showForm && (
        <div className="legal-rule-overlay">
          <form className="legal-rule-form" onSubmit={save}>
            <h3>
              {editing == null
                ? "Définir le seuil"
                : "Définir ou modifier le seuil"}
            </h3>
            <div className="legal-rule-fields">
              <label>
                Montant minimum
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.montantMinimum}
                  onChange={(e) =>
                    setForm({ ...form, montantMinimum: e.target.value })
                  }
                />
              </label>
              <label>
                Montant maximum
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Sans plafond"
                  value={form.montantMaximum}
                  onChange={(e) =>
                    setForm({ ...form, montantMaximum: e.target.value })
                  }
                />
              </label>
            </div>
            {actionError && (
              <p className="legal-state error" role="alert">
                {actionError}
              </p>
            )}
            <div className="legal-rule-actions">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                  setShowForm(false);
                  setActionError("");
                }}
              >
                Annuler
              </button>
              <button type="submit" disabled={saving}>
                {saving
                  ? "Enregistrement…"
                  : editing == null
                    ? "Créer la règle"
                    : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </LegalFrame>
  );
}

export default function LegalPages() {
  const { pathname, search } = useLocation();
  const { data, loading, error, load } = useLegalData();
  const requestedContractId = new URLSearchParams(search).get("contratId");
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [busyDecision, setBusyDecision] = useState(null);
  const [decisionError, setDecisionError] = useState("");
  const [selectedValidation, setSelectedValidation] = useState(null);
  // Contrat sélectionné dans le tableau du portefeuille juridique.
  const [selectedContract, setSelectedContract] = useState(null);
  useEffect(() => {
    if (pathname === "/juridique/contrats" && requestedContractId) {
      setSelectedContract(
        data.contracts.find(
          (contract) => String(contract.id) === requestedContractId,
        ) || null,
      );
    }
  }, [pathname, requestedContractId, data.contracts]);
  useEffect(() => {
    if (
      pathname !== "/juridique/validations" ||
      !requestedContractId ||
      loading
    )
      return;
    const validation = data.validations.find(
      (item) =>
        String(item.contratId) === requestedContractId &&
        item.decision === "EN_ATTENTE",
    );
    if (validation) setSelectedValidation(validation);
  }, [pathname, requestedContractId, loading, data.validations]);
  // Ferme le panneau de détail avec Escape, comme les autres dialogues.
  useEffect(() => {
    if (!selectedContract) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedContract(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedContract]);
  const contractsById = useMemo(
    () => new Map(data.contracts.map((c) => [String(c.id), c])),
    [data.contracts],
  );
  const decide = async (validation, decision, commentaire = "") => {
    setBusyDecision(validation.id);
    setDecisionError("");
    try {
      await api.post(`/validations/${validation.id}/decider`, {
        decision,
        commentaire,
      });
      setSelectedValidation(null);
      await load();
    } catch (e) {
      setDecisionError(err(e));
    } finally {
      setBusyDecision(null);
    }
  };
  if (pathname === "/juridique" || pathname === "/juridique/")
    return <LegalDashboard {...{ data, loading, error, load }} />;
  if (pathname === "/juridique/contrats") {
    // Recherche textuelle dans le portefeuille, puis affichage sous forme de liste.
    const list = data.contracts.filter((c) =>
      `${c.reference || ""} ${c.objet || ""} ${c.service || ""} ${c.statut || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    return (
      <LegalFrame
        title="Portefeuille des contrats"
        description="Recherchez un dossier et ouvrez-le pour consulter ses détails."
        loading={loading}
        error={error}
        onRefresh={load}
      >
        <input
          className="legal-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Référence, objet, service ou statut"
          aria-label="Rechercher un contrat"
        />
        <div className="legal-table-wrap legal-contract-list-wrap">
          <table className="legal-contract-list">
            <thead>
              <tr>
                <th>Référence / objet</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Service</th>
                <th>Responsable (matricule)</th>
                <th>Montant</th>
                <th>Fin du contrat</th>
                <th>Consulter</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  className={`legal-contract-row ${String(c.id) === requestedContractId ? "notification-target" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ouvrir le contrat ${c.reference || c.id}`}
                  onClick={() => setSelectedContract(c)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedContract(c);
                    }
                  }}
                >
                  <td>
                    <strong>{c.reference || `Contrat #${c.id}`}</strong>
                    <small>{c.objet || "Objet non renseigné"}</small>
                  </td>
                  <td>
                    {data.types.find((t) => String(t.id) === String(c.typeId))
                      ?.nom || "Type non renseigné"}
                  </td>
                  <td>
                    <span
                      className={`legal-status ${getStatusClass(c.statut)}`}
                    >
                      {c.statut || "Non défini"}
                    </span>
                  </td>
                  <td>{c.service || "—"}</td>
                  <td>
                    {data.users.find(
                      (user) => String(user.id) === String(c.responsableId),
                    )?.matricule || "—"}
                  </td>
                  <td>{money(c.montant, c.devise)}</td>
                  <td>{formatDate(c.dateFin)}</td>
                  <td>
                    <button
                      type="button"
                      className="legal-open-contract"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedContract(c);
                      }}
                    >
                      Détails <i className="fa-solid fa-arrow-right" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && (
            <p className="legal-empty">
              Aucun contrat ne correspond à la recherche.
            </p>
          )}
        </div>
        {selectedContract && (
          <div
            className="legal-contract-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setSelectedContract(null);
            }}
          >
            <section
              className="legal-contract-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={`Détails du contrat ${selectedContract.reference || selectedContract.id}`}
            >
              <header>
                <div>
                  <span className="legal-eyebrow">DOSSIER CONTRACTUEL</span>
                  <h2>
                    {selectedContract.reference ||
                      `Contrat #${selectedContract.id}`}
                  </h2>
                  <p>{selectedContract.objet || "Objet non renseigné"}</p>
                </div>
                <button
                  type="button"
                  className="legal-review-close"
                  aria-label="Fermer les détails"
                  onClick={() => setSelectedContract(null)}
                >
                  ×
                </button>
              </header>
              <div className="legal-contract-dialog-body">
                <dl className="legal-contract-detail-grid">
                  <div>
                    <dt>Statut</dt>
                    <dd>{selectedContract.statut || "—"}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>
                      {data.types.find(
                        (t) => String(t.id) === String(selectedContract.typeId),
                      )?.nom || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Montant</dt>
                    <dd>
                      {money(selectedContract.montant, selectedContract.devise)}
                    </dd>
                  </div>
                  <div>
                    <dt>Service</dt>
                    <dd>{selectedContract.service || "—"}</dd>
                  </div>
                  <div>
                    <dt>Responsable (matricule)</dt>
                    <dd>
                      {data.users.find(
                        (user) =>
                          String(user.id) ===
                          String(selectedContract.responsableId),
                      )?.matricule || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Date de début</dt>
                    <dd>{formatDate(selectedContract.dateDebut)}</dd>
                  </div>
                  <div>
                    <dt>Date de fin</dt>
                    <dd>{formatDate(selectedContract.dateFin)}</dd>
                  </div>
                  <div>
                    <dt>Date de signature</dt>
                    <dd>{formatDate(selectedContract.dateSignature)}</dd>
                  </div>
                  <div>
                    <dt>Renouvellement automatique</dt>
                    <dd>
                      {selectedContract.renouvellementAutomatique
                        ? "Oui"
                        : "Non"}
                    </dd>
                  </div>
                  <div>
                    <dt>Préavis</dt>
                    <dd>{selectedContract.joursPreavis ?? 0} jour(s)</dd>
                  </div>
                  <div className="wide">
                    <dt>Description</dt>
                    <dd>
                      {selectedContract.description ||
                        "Aucune description renseignée."}
                    </dd>
                  </div>
                  <div className="wide">
                    <dt>Clauses</dt>
                    <dd>
                      {selectedContract.clauses || "Aucune clause renseignée."}
                    </dd>
                  </div>
                </dl>
              </div>
              <footer>
                <button
                  type="button"
                  className="legal-review-close-text"
                  onClick={() => setSelectedContract(null)}
                >
                  Fermer
                </button>
              </footer>
            </section>
          </div>
        )}
      </LegalFrame>
    );
  }
  if (pathname === "/juridique/regles")
    return <LegalRules {...{ data, loading, error, load }} />;
  if (pathname === "/juridique/validations") {
    const pendingLegal = data.validations.filter(
      (v) => v.roleRequis === "JURIDIQUE" && v.decision === "EN_ATTENTE",
    );
    const assignedToMe = (v) =>
      v.valideurId == null || String(v.valideurId) === String(user?.id);
    return (
      <LegalFrame
        title="Contrats à approuver"
        description="Consultez le dossier complet avant de rendre votre décision Juridique."
        loading={loading}
        error={error}
        onRefresh={load}
      >
        {decisionError && (
          <p className="legal-state error" role="alert">
            {decisionError}
          </p>
        )}
        <section className="legal-panel legal-pending-panel">
          <div className="legal-panel-head">
            <div>
              <h3>En attente de votre approbation</h3>
              <p>{pendingLegal.length} dossier(s) à traiter</p>
            </div>
          </div>
          <div className="legal-table-wrap legal-incoming-table">
            <table>
              <thead>
                <tr>
                  <th>Référence / objet</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Service</th>
                  <th>Début / fin</th>
                  <th>Reçue le</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {pendingLegal.map((v) => {
                  const c = contractsById.get(String(v.contratId));
                  return (
                    <tr
                      key={v.id}
                      className={`legal-incoming-row ${String(v.contratId) === requestedContractId ? "notification-target" : ""}`}
                      tabIndex={0}
                      role="button"
                      onClick={() => setSelectedValidation(v)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedValidation(v);
                        }
                      }}
                    >
                      <td>
                        <strong>
                          {c?.reference || `Contrat #${v.contratId}`}
                        </strong>
                        <small>{c?.objet || "Objet non renseigné"}</small>
                      </td>
                      <td>
                        {data.types.find(
                          (t) => String(t.id) === String(c?.typeId),
                        )?.nom || "—"}
                      </td>
                      <td>{money(c?.montant, c?.devise)}</td>
                      <td>{c?.service || "—"}</td>
                      <td>
                        {formatDate(c?.dateDebut)} / {formatDate(c?.dateFin)}
                      </td>
                      <td>{formatDate(v.dateSoumission)}</td>
                      <td>
                        <span className="legal-status pending">
                          Niveau {v.niveau} · Ouvrir
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!pendingLegal.length && (
              <p className="legal-empty">
                Aucun contrat n’attend actuellement votre approbation.
              </p>
            )}
          </div>
        </section>
        {selectedValidation && (
          <LegalReviewDialog
            key={selectedValidation.id}
            validation={selectedValidation}
            contract={contractsById.get(String(selectedValidation.contratId))}
            typeName={
              data.types.find(
                (t) =>
                  String(t.id) ===
                  String(
                    contractsById.get(String(selectedValidation.contratId))
                      ?.typeId,
                  ),
              )?.nom
            }
            busy={busyDecision === selectedValidation.id}
            onDecide={decide}
            allowDecision={
              user?.role === "JURIDIQUE" && assignedToMe(selectedValidation)
            }
            onClose={() => setSelectedValidation(null)}
          />
        )}
        <section className="legal-panel">
          <div className="legal-panel-head">
            <div>
              <h3>Historique des validations</h3>
              <p>Historique des étapes juridiques visibles par votre rôle.</p>
            </div>
          </div>
          <div className="legal-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Contrat</th>
                  <th>Étape</th>
                  <th>Rôle requis</th>
                  <th>Matricule demandeur</th>
                  <th>Matricule valideur</th>
                  <th>Décision</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.validations.map((v) => {
                  const c = contractsById.get(String(v.contratId));
                  return (
                    <tr
                      key={`history-${v.id}`}
                      className={
                        String(v.contratId) === requestedContractId
                          ? "notification-target"
                          : ""
                      }
                    >
                      <td>
                        <strong>
                          {c?.reference || `Contrat #${v.contratId}`}
                        </strong>
                        <small>{c?.objet}</small>
                      </td>
                      <td>{v.etape || `Étape ${v.niveau || "—"}`}</td>
                      <td>{v.roleRequis || "—"}</td>
                      <td>
                        {data.users.find(
                          (person) =>
                            String(person.id) === String(v.demandeurId),
                        )?.matricule || "—"}
                      </td>
                      <td>
                        {data.users.find(
                          (person) =>
                            String(person.id) === String(v.valideurId),
                        )?.matricule || "—"}
                      </td>
                      <td>
                        <span
                          className={`legal-status ${getStatusClass(v.decision || v.statut)}`}
                        >
                          {v.decision || v.statut || "EN_ATTENTE"}
                        </span>
                      </td>
                      <td>{v.commentaire || "—"}</td>
                      <td>
                        {formatDate(v.dateValidation || v.dateSoumission)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!data.validations.length && (
              <p className="legal-empty">Aucune validation enregistrée.</p>
            )}
          </div>
        </section>
      </LegalFrame>
    );
  }
  if (pathname === "/juridique/versions")
    return (
      <LegalFrame
        title="Versions et avenants"
        description="Traçabilité des versions et modifications associées aux contrats."
        loading={loading}
        error={error}
        onRefresh={load}
      >
        <div className="legal-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contrat</th>
                <th>Version</th>
                <th>Date</th>
                <th>Matricule créateur</th>
                <th>Avenant</th>
                <th>Contenu archivé</th>
              </tr>
            </thead>
            <tbody>
              {data.versions.map((v) => {
                const c = contractsById.get(String(v.contratId));
                return (
                  <tr key={v.id}>
                    <td>
                      <strong>
                        {c?.reference || `Contrat #${v.contratId}`}
                      </strong>
                      <small>{c?.objet}</small>
                    </td>
                    <td>v{v.version}</td>
                    <td>{formatDate(v.dateCreation)}</td>
                    <td>
                      {data.users.find(
                        (person) => String(person.id) === String(v.creePar),
                      )?.matricule || "—"}
                    </td>
                    <td>{v.avenantId ? `Avenant #${v.avenantId}` : "—"}</td>
                    <td>
                      <details className="legal-version-recap">
                        <summary>Consulter le récapitulatif</summary>
                        <div className="legal-version-recap-grid">
                          {versionRecap(v.contenu).map(([label, value]) => (
                            <div key={label}>
                              <small>{label}</small>
                              <strong>{value || "—"}</strong>
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!data.versions.length && (
            <p className="legal-empty">Aucune version archivée.</p>
          )}
        </div>
        <h3 className="legal-subtitle">Avenants</h3>
        <div className="legal-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Contrat</th>
                <th>Date</th>
                <th>Modifications</th>
                <th>Montant après</th>
              </tr>
            </thead>
            <tbody>
              {data.amendments.map((a) => (
                <tr key={a.id}>
                  <td>{a.numero || `#${a.id}`}</td>
                  <td>
                    {contractsById.get(String(a.contratId))?.reference ||
                      `Contrat #${a.contratId}`}
                  </td>
                  <td>{formatDate(a.dateAvenant)}</td>
                  <td>{a.modifications || a.description || "—"}</td>
                  <td>
                    {money(
                      a.montantApres,
                      contractsById.get(String(a.contratId))?.devise,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.amendments.length && (
            <p className="legal-empty">Aucun avenant enregistré.</p>
          )}
        </div>
      </LegalFrame>
    );
  return null;
}
