import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../../services/api.js";
import validationService from "../../services/validationService.js";
import Pagination from "../../composants/Pagination.jsx";
import ValidationCard from "./ValidationCard.jsx";
import { useFeedback } from "../../composants/FeedbackContext.jsx";

const label = {
  EN_ATTENTE: "En attente",
  EN_VALIDATION: "En validation",
  APPROUVE: "Approuvé",
  REJETE: "Rejeté",
  MODIFICATION_DEMANDEE: "Modification demandée",
};
const finalDecisions = new Set([
  "APPROUVE",
  "REJETE",
  "MODIFICATION_DEMANDEE",
]);

const normalizeSearch = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_-]+/g, " ")
    .toLocaleLowerCase("fr");

export default function Validation() {
  const { user } = useAuth();
  const location = useLocation();
  const isHistory = location.pathname.endsWith("/validations");
  const [searchParams] = useSearchParams();
  const selectedContractId = searchParams.get("contratId");
  const [validations, setValidations] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [documents, setDocuments] = useState({});
  const [docsLoading, setDocsLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [comments, setComments] = useState({});
  const [query, setQuery] = useState("");
  const { toast, confirm, dismissToast } = useFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [v, c, a] = await Promise.all([
        validationService.list(),
        api.get("/contrats"),
        api.get("/avenants"),
      ]);
      setValidations(Array.isArray(v.data) ? v.data : []);
      setContracts(Array.isArray(c.data) ? c.data : []);
      setAmendments(Array.isArray(a.data) ? a.data : []);
    } catch (e) {
      setError(e.response?.data?.message || "Impossible de charger les validations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const inbox = useMemo(
    () =>
      validations.filter(
        (v) =>
          v.roleRequis === user?.role &&
          (v.valideurId == null || String(v.valideurId) === String(user?.id)) &&
          (isHistory ? finalDecisions.has(v.decision) : v.decision === "EN_ATTENTE") &&
          (!selectedContractId || String(v.contratId) === selectedContractId),
      ),
    [validations, selectedContractId, isHistory, user?.id, user?.role],
  );

  const filteredInbox = useMemo(() => {
    const search = normalizeSearch(query.trim());
    if (!search) return inbox;
    return inbox.filter((v) => {
      const c = contracts.find((x) => String(x.id) === String(v.contratId));
      const a = v.avenantId ? amendments.find((x) => String(x.id) === String(v.avenantId)) : null;
      return normalizeSearch(
        [c?.reference, c?.objet, a?.numero, a?.description, v.commentaire, label[v.decision]]
          .filter(Boolean)
          .join(" ")
      ).includes(search);
    });
  }, [inbox, contracts, amendments, query]);

  const loadDocuments = async (contratId) => {
    if (documents[contratId] || docsLoading[contratId]) return;
    setDocsLoading((prev) => ({ ...prev, [contratId]: true }));
    try {
      const res = await api.get(`/contrats/${contratId}/documents`);
      setDocuments((prev) => ({ ...prev, [contratId]: res.data || [] }));
    } catch {
      toast("Impossible de charger les pièces jointes.", "error");
    } finally {
      setDocsLoading((prev) => ({ ...prev, [contratId]: false }));
    }
  };

  const download = async (doc) => {
    const response = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.nomFichier || `document-${doc.id}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const decide = async (v, decision) => {
    if (decision === "MODIFICATION_DEMANDEE" && !(comments[v.id] || "").trim()) {
      toast("Un commentaire est obligatoire pour demander des modifications.", "warning");
      return;
    }
    const actionLabels = {
      APPROUVE: "Approuver",
      REJETE: "Rejeter",
      MODIFICATION_DEMANDEE: "Demander des modifications",
    };
    const confirmationTitles = {
      APPROUVE: "Confirmer l’approbation",
      REJETE: "Confirmer le rejet",
      MODIFICATION_DEMANDEE: "Confirmer la demande de modification",
    };
    const message = decision === "APPROUVE"
      ? "Confirmez-vous l’approbation de cette étape du contrat ?"
      : decision === "REJETE"
        ? "Confirmez-vous le rejet de ce contrat ? Cette décision sera enregistrée dans son historique."
        : "Confirmez-vous la demande de modification ? Votre commentaire sera transmis au gestionnaire.";
    const ok = await confirm({
      title: confirmationTitles[decision],
      message,
      confirmLabel: actionLabels[decision],
      danger: decision !== "APPROUVE",
    });
    if (!ok) return;

    setBusy(v.id);
    const progressToast = toast("Enregistrement de votre décision…", "info", "Traitement en cours");
    try {
      await validationService.decide(v.id, {
        decision,
        commentaire: comments[v.id] || "",
      });
      dismissToast(progressToast);
      const successMessage = decision === "APPROUVE"
        ? "Approbation enregistrée avec succès."
        : decision === "REJETE"
          ? "Rejet enregistré avec succès."
          : "Demande de modification enregistrée avec succès.";
      toast(successMessage, "success", "Décision confirmée");
      await load();
    } catch (e) {
      dismissToast(progressToast);
      toast(e.response?.data?.message || "Erreur lors de l'enregistrement.", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="validation-inbox">
      <div className="validation-inbox-toolbar">
        <div>
          <span className="role-welcome-eyebrow">ESPACE VALIDEUR</span>
          <h2>{isHistory ? "Mes validations" : "Contrats à examiner"}</h2>
          <p>Traitez les validations en attente ou consultez votre historique.</p>
        </div>
        <button onClick={load} disabled={loading}>Actualiser</button>
      </div>
      <label className="validation-search">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." />
      </label>
      {loading ? <p>Chargement…</p> : filteredInbox.length === 0 ? <p>Aucune validation.</p> : (
        <Pagination items={filteredInbox}>
          {(visible) => visible.map((v) => (
            <ValidationCard
              key={v.id}
              v={v}
              contract={contracts.find((c) => String(c.id) === String(v.contratId))}
              amendment={v.avenantId ? amendments.find((a) => String(a.id) === String(v.avenantId)) : null}
              documents={documents}
              documentsLoading={docsLoading[v.contratId]}
              onToggleDetails={loadDocuments}
              isHistory={isHistory}
              busy={busy}
              comments={comments}
              onCommentChange={(id, val) => setComments((p) => ({ ...p, [id]: val }))}
              onDecide={decide}
              onDownload={download}
              selectedContractId={selectedContractId}
            />
          ))}
        </Pagination>
      )}
    </div>
  );
}
