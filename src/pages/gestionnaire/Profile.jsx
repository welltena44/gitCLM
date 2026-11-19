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


export function ManagerProfilePage() {
  const { user, loginUser } = useAuth();
  const { toast, confirm } = useFeedback();
  const [form, setForm] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    service: user?.service || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (
      !(await confirm({
        title: "Enregistrer le profil ?",
        message:
          "Confirmez-vous la mise à jour de vos informations personnelles ?",
        confirmLabel: "Enregistrer",
      }))
    )
      return;
    toast("Mise à jour du profil en cours…", "info");
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(`/utilisateurs/${user.id}/profil`, form);
      const updated = { ...user, ...data };
      loginUser(updated);
      setForm({
        nom: updated.nom || "",
        prenom: updated.prenom || "",
        email: updated.email || "",
        service: updated.service || "",
      });
      toast("Profil mis à jour et e-mail de notification envoyé.");
    } catch (e) {
      const msg = errMessage(e);
      setError(msg);
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <h2>Mon profil</h2>
          <p>Consultez et mettez à jour les informations de votre compte.</p>
        </div>
      </div>
      <section className="mgr-panel mgr-profile-panel">
        <div className="mgr-profile-banner">
          <span className="mgr-profile-avatar">
            {`${form.prenom?.[0] || ""}${form.nom?.[0] || ""}`.toUpperCase() ||
              "U"}
          </span>
          <div>
            <h3>
              {form.prenom} {form.nom}
            </h3>
            <p>
              {user?.role || "Utilisateur"} · Matricule{" "}
              {user?.matricule || user?.id || "—"}
            </p>
          </div>
        </div>
        {error && <div className="mgr-inline-error">{error}</div>}
        <form onSubmit={submit} className="mgr-form-grid">
          <label className="mgr-field">
            <span>Nom *</span>
            <input
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </label>
          <label className="mgr-field">
            <span>Prénom *</span>
            <input
              required
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
            />
          </label>
          <label className="mgr-field">
            <span>Email *</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="mgr-field">
            <span>Service</span>
            <input
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            />
          </label>
          <div className="mgr-form-actions">
            <Button type="submit" disabled={saving}>
              <InlineIcon className="fa-solid fa-floppy-disk" />
              {saving ? "Enregistrement…" : "Enregistrer le profil"}
            </Button>
          </div>
        </form>
        <p className="mgr-profile-note">
          <InlineIcon className="fa-solid fa-shield-halved" /> Le mot de passe n’est pas
          modifiable depuis cette page. 
        </p>
      </section>
    </div>
  );
}

export default ManagerProfilePage;
