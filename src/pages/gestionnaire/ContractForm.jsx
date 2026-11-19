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


export function ContractFormPage() {
  const [analyzing, setAnalyzing] = useState(false);
    const handleAutoFill = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ""; // permet de réimporter le même fichier
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast("Seuls les fichiers PDF sont pris en charge.", "warning");
      return;
    }
    setAnalyzing(true);
    toast("Lecture du PDF en cours…", "info");
    try {
      const { champs, typeId } = await svc.autoAnalyzeDocument(file);
      const valeurs = {
        reference: champs.reference,
        objet: champs.objet,
        description: champs.description,
        montant: champs.montant,
        devise: champs.devise,
        dateDebut: champs.dateDebut,
        dateFin: champs.dateFin,
        dureeMois: champs.dureeMois,
        joursPreavis: champs.joursPreavis,
        renouvellementAutomatique: champs.renouvellementAutomatique,
        clauses: champs.clauses,
        typeId: typeId == null ? null : String(typeId),
      };
      const renseignes = Object.entries(valeurs).filter(
        ([, v]) => v !== null && v !== undefined && v !== "",
      );
      // Seuls les champs réellement trouvés dans le PDF écrasent le formulaire.
      setForm((prev) => ({ ...prev, ...Object.fromEntries(renseignes) }));
      if (renseignes.length === 0) {
        toast("Aucune information n'a pu être extraite de ce PDF.", "warning");
      } else {
        toast(
          `${renseignes.length} champ(s) pré-rempli(s) : vérifiez-les avant d'enregistrer.`,
        );
      }
      (champs.avertissements || []).slice(0, 3).forEach((m) => toast(m, "warning"));
    } catch (err) {
      toast(errMessage(err), "error");
    } finally {
      setAnalyzing(false);
    }
  };
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    reference: "",
    objet: "",
    description: "",
    clauses: "",
    montant: "",
    devise: "Ar",
    dateSignature: "",
    dateDebut: "",
    dateFin: "",
    dureeMois: "",
    statut: "BROUILLON",
    renouvellementAutomatique: false,
    joursPreavis: 30,
    responsableId: user?.id || "",
    typeId: "",
    creePar: user?.id || "",
  });
  useEffect(() => {
    (async () => {
      try {
        const ts = await svc.getContractTypes();
        setTypes(ts || []);
        if (editing) {
          const c = await svc.getContract(id);
          setForm((old) => ({
            ...old,
            ...c,
            montant: c.montant ?? "",
            dateSignature: c.dateSignature || "",
            dateDebut: c.dateDebut || "",
            dateFin: c.dateFin || "",
            dureeMois: c.dureeMois ?? "",
            typeId: c.typeId ?? "",
            responsableId: c.responsableId ?? user?.id ?? "",
          }));
        }
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, editing, user?.id]);
  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut) {
      setError("La date de fin doit être postérieure à la date de début.");
      return;
    }
    if (
      !(await confirm({
        title: editing ? "Confirmer la modification" : "Confirmer la création",
        message: editing
          ? "Enregistrer les modifications de ce contrat ?"
          : "Créer ce contrat avec les informations saisies ?",
        confirmLabel: editing ? "Enregistrer" : "Créer le contrat",
      }))
    )
      return;
    toast(
      editing
        ? "Modification du contrat en cours…"
        : "Création du contrat en cours…",
      "info",
    );
    setSaving(true);
    try {
      const payload = {
        ...form,
        montant: Number(form.montant),
        typeId: Number(form.typeId),
        responsableId: Number(form.responsableId),
        creePar: Number(user?.id || form.creePar || 0),
        dureeMois: form.dureeMois === "" ? null : Number(form.dureeMois),
        joursPreavis: Number(form.joursPreavis || 0),
        renouvellementAutomatique: Boolean(form.renouvellementAutomatique),
      };
      const saved = editing
        ? await svc.updateContract(id, payload)
        : await svc.createContract(payload);
      toast(
        editing ? "Contrat modifié avec succès." : "Contrat créé avec succès.",
      );
      nav(`/gestionnaire/contrats/${saved.id}`, { replace: true });
    } catch (e) {
      setError(errMessage(e));
      toast(errMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <div className="mgr-state">
        <InlineIcon className="fa-solid fa-spinner fa-spin" /> Chargement du formulaire…
      </div>
    );
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <button className="mgr-back" onClick={() => nav(-1)}>
            <InlineIcon className="fa-solid fa-arrow-left" /> Retour
          </button>
          <h2>{editing ? "Modifier le contrat" : "Nouveau contrat"}</h2>
        </div>
      </div>
      {error && (
        <div className="mgr-inline-error">
          <InlineIcon className="fa-solid fa-circle-exclamation" />
          {error}
        </div>
      )}
      <form className="mgr-panel mgr-contract-form" onSubmit={submit}>
        <div className="mgr-panel-title">
          <h3>
            <InlineIcon className="fa-regular fa-file-lines" /> Informations générales
          </h3>
          <span className="mgr-required">* Champs obligatoires</span>
        </div>
        <div style={{ background: "rgba(59, 130, 246, 0.08)", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px dashed #3b82f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <strong style={{ color: "#1e40af", display: "block", marginBottom: "0.25rem" }}><InlineIcon className="fa-solid fa-wand-magic-sparkles" /> Assistant IA / OCR de Pré-remplissage</strong>
            <span style={{ fontSize: "0.85rem", color: "#4b5563" }}>Importez le PDF du contrat pour extraire automatiquement la référence, l’objet, le montant et les conditions.</span>
          </div>
          <label className="mgr-btn secondary" style={{ cursor: "pointer", margin: 0 }}>
            {analyzing ? <><InlineIcon className="fa-solid fa-spinner fa-spin" /> Analyse...</> : <><InlineIcon className="fa-solid fa-file-import" /> Importer PDF & Auto-remplir</>}
            <input type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={handleAutoFill} disabled={analyzing} />
          </label>
        </div>
        <div className="mgr-form-grid">
          <label className="mgr-field">
            <span>Référence *</span>
            <input
              required
              maxLength="50"
              value={form.reference || ""}
              onChange={(e) => change("reference", e.target.value)}
              placeholder="CLM-2026-001"
            />
          </label>
          <label className="mgr-field">
            <span>Type de contrat *</span>
            <select
              required
              value={form.typeId}
              onChange={(e) => change("typeId", e.target.value)}
            >
              <option value="">Sélectionner un type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom || t.libelle || t.designation || `Type ${t.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="mgr-field wide">
            <span>Objet du contrat *</span>
            <input
              required
              maxLength="255"
              value={form.objet || ""}
              onChange={(e) => change("objet", e.target.value)}
              placeholder="Objet principal du contrat"
            />
          </label>
          <label className="mgr-field wide">
            <span>Description</span>
            <textarea
              rows="3"
              value={form.description || ""}
              onChange={(e) => change("description", e.target.value)}
            />
          </label>
        </div>
        <div className="mgr-panel-title">
          <h3>
            <InlineIcon className="fa-solid fa-coins" /> Conditions financières
          </h3>
        </div>
        <div className="mgr-form-grid">
          <label className="mgr-field">
            <span>Montant *</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.montant}
              onChange={(e) => change("montant", e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>Devise *</span>
            <select
              value={form.devise || "Ar"}
              onChange={(e) => change("devise", e.target.value)}
            >
              <option value="Ar">Ariary (Ar)</option>
              <option value="MGA">MGA</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="mgr-field wide">
            <span>Clauses / conditions</span>
            <textarea
              rows="3"
              value={form.clauses || ""}
              onChange={(e) => change("clauses", e.target.value)}
            />
          </label>
        </div>
        <div className="mgr-panel-title">
          <h3>
            <InlineIcon className="fa-regular fa-calendar" /> Dates du contrat
          </h3>
        </div>
        <div className="mgr-form-grid">
          <label className="mgr-field">
            <span>Date de signature</span>
            <input
              type="date"
              value={form.dateSignature || ""}
              onChange={(e) => change("dateSignature", e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>Date de début *</span>
            <input
              required
              type="date"
              value={form.dateDebut || ""}
              onChange={(e) => change("dateDebut", e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>Date de fin *</span>
            <input
              required
              type="date"
              min={form.dateDebut || undefined}
              value={form.dateFin || ""}
              onChange={(e) => change("dateFin", e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>Durée (mois)</span>
            <input
              type="number"
              min="1"
              value={form.dureeMois}
              onChange={(e) => change("dureeMois", e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>Service du responsable</span>
            <input
              value={user?.service || ""}
              readOnly
              placeholder="À renseigner dans votre profil"
            />
          </label>
          <label className="mgr-field">
            <span>Préavis (jours)</span>
            <input
              type="number"
              min="0"
              value={form.joursPreavis}
              onChange={(e) => change("joursPreavis", e.target.value)}
            />
          </label>
          <label className="mgr-check wide">
            <input
              type="checkbox"
              checked={Boolean(form.renouvellementAutomatique)}
              onChange={(e) =>
                change("renouvellementAutomatique", e.target.checked)
              }
            />
            <span>Renouvellement automatique prévu au contrat</span>
          </label>
        </div>
        <div className="mgr-form-actions">
          <Button type="button" variant="secondary" onClick={() => nav(-1)}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            <InlineIcon
              className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`}
            />
            {saving
              ? "Enregistrement…"
              : editing
                ? "Enregistrer les modifications"
                : "Créer le contrat"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ContractFormPage;
