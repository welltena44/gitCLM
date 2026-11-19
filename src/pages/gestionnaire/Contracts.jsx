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


export function ContractsPage() {
  const [contracts, setContracts] = useState([]),
    [types, setTypes] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [typeId, setTypeId] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [signatureStart, setSignatureStart] = useState(""),
    [signatureEnd, setSignatureEnd] = useState(""),
    [sort, setSort] = useState("dateModification"),
    [sortDirection, setSortDirection] = useState("desc"),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10);
  const [applied, setApplied] = useState({ q: "", status: "", typeId: "", start: "", end: "", signatureStart: "", signatureEnd: "", sort: "dateModification", sortDirection: "desc" });
  const [parties, setParties] = useState([]),
    [users, setUsers] = useState([]);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const openedFromNotification = searchParams.get("notification") === "1";
  const nav = useNavigate();
  const { toast, confirm } = useFeedback();
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cs, ts] = await Promise.all([
        svc.getContracts(),
        svc.getContractTypes(),
      ]);
      const [partiesResult, usersResult] = await Promise.allSettled([
        api.get("/parties-contrat").then((r) => r.data),
        api.get("/utilisateurs").then((r) => r.data),
      ]);
      setContracts(Array.isArray(cs) ? cs : []);
      setTypes(Array.isArray(ts) ? ts : []);
      setParties(partiesResult.status === "fulfilled" && Array.isArray(partiesResult.value) ? partiesResult.value : []);
      setUsers(usersResult.status === "fulfilled" && Array.isArray(usersResult.value) ? usersResult.value : []);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  const selected = useMemo(
    () => contracts.find((c) => String(c.id) === String(id)),
    [contracts, id],
  );
  const filtered = useMemo(() => {
    const term = applied.q.trim().toLowerCase();
    return contracts
      .filter((c) => {
        const text = [
          c.reference,
          c.objet,
          types.find((t) => String(t.id) === String(c.typeId))?.nom,
          c.description,
          c.service,
          ...parties.filter((p) => String(p.contratId) === String(c.id)).map((p) => p.nom),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (!term || text.includes(term)) &&
          (!applied.status || c.statut === applied.status) &&
          (!applied.typeId || String(c.typeId) === applied.typeId) &&
          (!applied.start || String(c.dateFin || "") >= applied.start) &&
          (!applied.end || String(c.dateFin || "") <= applied.end) &&
          (!applied.signatureStart || String(c.dateSignature || "") >= applied.signatureStart) &&
          (!applied.signatureEnd || String(c.dateSignature || "") <= applied.signatureEnd)
        );
      })
      .sort((a, b) => {
        const x = a[applied.sort] ?? "",
          y = b[applied.sort] ?? "";
        const order = applied.sort === "montant"
          ? Number(x) - Number(y)
          : String(x).localeCompare(String(y), undefined, { numeric: true });
        return applied.sortDirection === "asc" ? order : -order;
      });
  }, [contracts, parties, types, applied]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Empêche de rester sur une page vide après un filtre ou une suppression.
  useEffect(() => { setPage(current => Math.min(current, pages)); }, [pages]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const remove = async (c) => {
    if (
      !(await confirm({
        title: "Supprimer ce contrat ?",
        message: `Le contrat ${c.reference} — ${c.objet} sera supprimé. Cette action peut être irréversible.`,
        confirmLabel: "Supprimer",
        danger: true,
      }))
    )
      return;
    toast("Suppression du contrat en cours…", "info");
    try {
      await svc.deleteContract(c.id);
      toast("Le contrat a été supprimé.");
      if (id === String(c.id)) nav("/gestionnaire/contrats");
      reload();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const renew = async (c) => {
    const today = new Date();
    const dateDebut = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    let defaultFin = "";
    if (c.dureeMois) {
      const d = new Date(dateDebut + "T00:00:00");
      d.setMonth(d.getMonth() + c.dureeMois);
      defaultFin = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    const dateFin = window.prompt(
      "Nouvelle date de fin pour le contrat " + c.reference + " (AAAA-MM-JJ) :",
      defaultFin,
    );
    if (!dateFin) return;
    if (!(await confirm({
      title: "Renouveler ce contrat ?",
      message: "Le contrat " + c.reference + " sera réactivé du " + dateDebut + " au " + dateFin + ".",
      confirmLabel: "Renouveler",
    }))) return;
    try {
      await svc.renewContract(c.id, dateDebut, dateFin);
      toast("Contrat renouvelé.");
      reload();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const reset = () => {
    setQ("");
    setStatus("");
    setTypeId("");
    setStart("");
    setEnd("");
    setSignatureStart("");
    setSignatureEnd("");
    setSort("dateModification");
    setSortDirection("desc");
    setApplied({ q: "", status: "", typeId: "", start: "", end: "", signatureStart: "", signatureEnd: "", sort: "dateModification", sortDirection: "desc" });
    setPage(1);
  };
  const applyFilters = () => {
    setApplied({ q, status, typeId, start, end, signatureStart, signatureEnd, sort, sortDirection });
    setPage(1);
  };
  const exportCsv = () => {
    const cols = [
      "reference",
      "objet",
      "statut",
      "service",
      "montant",
      "devise",
      "dateSignature",
      "dateDebut",
      "dateFin",
    ];
    const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [
      cols.join(";"),
      ...filtered.map((c) => cols.map((k) => esc(c[k])).join(";")),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "contrats-clm.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Export CSV généré à partir des résultats filtrés.");
  };
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <span className="mgr-page-eyebrow">ESPACE GESTIONNAIRE</span>
          <h2>Mes contrats</h2>
        </div>
        <PageActions>
          <Button onClick={() => nav("/gestionnaire/nouveau")}>
            <InlineIcon className="fa-solid fa-plus" /> Nouveau contrat
          </Button>
          <Button variant="secondary" onClick={exportCsv}>
            <InlineIcon className="fa-solid fa-file-csv" /> Exporter CSV
          </Button>
          <Button variant="secondary" onClick={reload}>
            <InlineIcon className="fa-solid fa-rotate" /> Actualiser
          </Button>
        </PageActions>
      </div>
      <div className="mgr-kpis">
        <div>
          <span>Total filtré</span>
          <strong>{filtered.length}</strong>
          <small>contrats</small>
        </div>
        <div>
          <span>Actifs</span>
          <strong>
            {
              filtered.filter(isActiveContract).length
            }
          </strong>
          <small>en vigueur</small>
        </div>
        <div>
          <span>En attente</span>
          <strong>
            {
              filtered.filter((c) =>
                ["EN_ATTENTE", "EN_VALIDATION"].includes(c.statut),
              ).length
            }
          </strong>
          <small>de validation</small>
        </div>
        <div>
          <span>Échéances à 30 jours</span>
          <strong>
            {
              filtered.filter(
                (c) =>
                  !isTerminated(c) &&
                  c.dateFin &&
                  new Date(`${c.dateFin}T00:00:00`) - new Date() <=
                    30 * 86400000 &&
                  new Date(`${c.dateFin}T23:59:59`) >= new Date(),
              ).length
            }
          </strong>
          <small>à surveiller</small>
        </div>
      </div>
      <section className="mgr-panel">
        <div className="mgr-panel-title">
          <div>
            <h3>
              <InlineIcon className="fa-solid fa-filter" /> Recherche et filtres
            </h3>
            <p>Combinez plusieurs critères pour affiner les résultats.</p>
          </div>
          <Button variant="link" onClick={reset}>
            Réinitialiser
          </Button>
        </div>
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche libre</span>
            <div className="mgr-search">
              <InlineIcon className="fa-solid fa-magnifying-glass" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Référence, objet, service, partenaire…"
              />
            </div>
          </label>
          <label className="mgr-field">
            <span>Statut</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              {[...new Set(contracts.map((c) => c.statut).filter(Boolean))].sort().map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="mgr-field">
            <span>Type de contrat</span>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              <option value="">Tous les types</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom || t.libelle || t.designation || `Type ${t.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="mgr-field">
            <span>Signature à partir du</span>
            <input type="date" value={signatureStart} onChange={(e) => setSignatureStart(e.target.value)} />
          </label>
          <label className="mgr-field">
            <span>Signature jusqu’au</span>
            <input type="date" value={signatureEnd} onChange={(e) => setSignatureEnd(e.target.value)} />
          </label>
          <label className="mgr-field">
            <span>Fin à partir du</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>Fin jusqu’au</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>Trier par</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="dateModification">Dernière modification</option>
              <option value="dateCreation">Date de création</option>
              <option value="dateFin">Date de fin</option>
              <option value="reference">Référence</option>
              <option value="montant">Montant</option>
            </select>
          </label>
          <label className="mgr-field">
            <span>Ordre</span>
            <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)}>
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </label>
          <div className="mgr-filter-actions">
            <Button onClick={applyFilters}><InlineIcon className="fa-solid fa-filter" /> Appliquer</Button>
          </div>
        </div>
      </section>
      <section className="mgr-panel">
        <div className="mgr-panel-title">
          <div>
            <h3>Résultats</h3>
              <p>{filtered.length} contrat(s) correspondant à votre recherche</p>
          </div>
          <label className="mgr-page-size">
            Lignes{" "}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </label>
        </div>
        <LoadingOrEmpty
          loading={loading}
          error={error}
          empty={!loading && !error && !visible.length}
        />
        {!loading && !error && visible.length > 0 && (
          <>
            {/* Les contrats restent dans une liste compacte ; le clic ouvre le détail. */}
            <div className="mgr-table-wrap">
              <table className="mgr-table mgr-contract-list-table">
                <thead>
                  <tr>
                    <th>Référence / objet</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Service / responsable</th>
                    <th>Montant</th>
                    <th>Signature / fin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => {
                    // Résout les informations liées pour éviter de les répéter dans la vue.
                    const typeName = types.find((t) => String(t.id) === String(c.typeId))?.nom || `Type #${c.typeId || "—"}`;
                    const manager = users.find((u) => String(u.id) === String(c.responsableId));
                    const managerMatricule = manager?.matricule || "—";
                    const partner = parties.filter((p) => String(p.contratId) === String(c.id)).map((p) => p.nom).filter(Boolean).join(", ");
                    const openDetails = () => nav(`/gestionnaire/contrats/${c.id}`);
                    return (
                      <tr className="mgr-contract-row" key={c.id} tabIndex={0} role="button"
                        aria-label={`Afficher le contrat ${c.reference || c.id}`}
                        onClick={openDetails}
                        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetails(); } }}>
                        <td>
                          <strong>{c.reference || `CLM-${c.id}`}</strong>
                          <small className="mgr-cell-title">{c.objet || "Objet non renseigné"}</small>
                          {partner && <small>Partie prenante : {partner}</small>}
                        </td>
                        <td>{typeName}</td>
                        <td><span className={`mgr-status ${statusClass(c.statut)}`}>{statusLabel(c.statut)}</span></td>
                        <td>{c.service || "—"}<small>Matricule : {managerMatricule}</small></td>
                        <td><strong>{money(c.montant, c.devise)}</strong></td>
                        <td>{date(c.dateSignature)}<small>Fin : {date(c.dateFin)}</small></td>
                        <td>
                          <div className="mgr-row-actions">
                            <button type="button" title="Afficher le contrat" aria-label="Afficher le contrat" onClick={(event) => { event.stopPropagation(); openDetails(); }}><InlineIcon className="fa-regular fa-eye"/></button>
                            {c.statut === "EXPIRE" && <button type="button" title="Renouveler le contrat" aria-label={"Renouveler le contrat " + c.reference} onClick={(event) => { event.stopPropagation(); renew(c); }}><InlineIcon className="fa-solid fa-rotate"/></button>}
                            <button type="button" title="Modifier" aria-label="Modifier le contrat" onClick={(event) => { event.stopPropagation(); nav(`/gestionnaire/contrats/${c.id}/modifier`); }}><InlineIcon className="fa-regular fa-pen-to-square"/></button>
                            <button type="button" title="Supprimer" aria-label="Supprimer le contrat" className="danger" onClick={(event) => { event.stopPropagation(); remove(c); }}><InlineIcon className="fa-regular fa-trash-can"/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mgr-pagination">
              <span>
                Affichage {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filtered.length)} sur{" "}
                {filtered.length}
              </span>
              <div>
                <Button
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <span>
                  Page {page} / {pages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
      {id && selected && <div className="mgr-detail-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) nav("/gestionnaire/contrats"); }}>
        <aside className="mgr-detail-drawer" role="dialog" aria-modal="true" aria-label={`Détail du contrat ${selected.reference || selected.id}`}>
          {openedFromNotification && <p className="mgr-notification-target"><InlineIcon className="fa-solid fa-bell"/> Contrat signalé par une notification</p>}
          <ContractDetails contract={selected} onRefresh={reload} types={types} users={users} />
        </aside>
      </div>}
    </div>
  );
}

function ContractDetails({ contract: c, onRefresh, types = [], users = [] }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [tab, setTab] = useState("resume");
  const [docCategory, setDocCategory] = useState("JUSTIFICATIF");
  const [documentName, setDocumentName] = useState(`Document — ${c.reference || `CLM-${c.id}`}`);
  const [docs, setDocs] = useState([]),
    [parties, setParties] = useState([]),
    [partyRoles, setPartyRoles] = useState([]),
    [amendments, setAmendments] = useState([]),
    [validations, setValidations] = useState([]),
    [obligations, setObligations] = useState([]),
    [docsLoading, setDocsLoading] = useState(true),
    [docsError, setDocsError] = useState(""),
    [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [partyForm, setPartyForm] = useState({
    nom: "",
    type: "COCONTRACTANT",
    email: "",
    telephone: "",
  });
  const [amendForm, setAmendForm] = useState({
    numero: 1,
    description: "",
    modifications: "",
    dateAvenant: new Date().toISOString().slice(0, 10),
    montantAvant: c.montant || "",
    montantApres: "",
    dateFinAvant: c.dateFin || "",
    dateFinApres: "",
  });
  const [obligationForm, setObligationForm] = useState({
    titre: "",
    description: "",
    echeance: "",
  });
  const load = useCallback(async () => {
    setDocsLoading(true);
    setDocsError("");
    try {
      const [d, p, a, v, o] = await Promise.all([
        svc.getDocuments(c.id),
        svc.getParties(c.id),
        svc.getAmendments(c.id),
        svc.getValidations(c.id),
        api.get(`/contrats/${c.id}/obligations`).then((response) => response.data),
      ]);
      setDocs(d || []);
      setParties(p || []);
      try {
        const allParties = await api.get("/parties-contrat").then((response) => response.data);
        setPartyRoles(
          [...new Set((allParties || []).map((party) => party.type).filter(Boolean))]
            .filter((role) => !["COCONTRACTANT", "FOURNISSEUR", "CLIENT", "PARTENAIRE", "SOUS-TRAITANT"].includes(role))
            .sort((a, b) => a.localeCompare(b, "fr")),
        );
      } catch {
        // Les rôles prédéfinis et ceux du contrat courant restent disponibles.
      }
      setAmendments(a || []);
      setValidations(v || []);
      setObligations(o || []);
    } catch (e) {
      setDocsError(errMessage(e));
      toast(errMessage(e), "error");
    } finally {
      setDocsLoading(false);
    }
  }, [c.id, toast]);
  useEffect(() => {
    load();
  }, [load]);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast("Le fichier dépasse la limite de 15 Mo.", "warning");
      return;
    }
    toast("Ajout du document en cours…", "info");
    setBusy(true);
    try {
      const uploaded = await svc.uploadDocument(c.id, file, user?.id, docCategory);
      const uploadedDocument = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (uploadedDocument?.id && documentName.trim()) {
        await svc.renameDocument(uploadedDocument.id, { nomFichier: documentName.trim() });
      }
      toast("Document ajouté au contrat.");
      await load();
    } catch (ex) {
      toast(errMessage(ex), "error");
    } finally {
      setBusy(false);
    }
  };
  const download = async (d) => {
    try {
      const blob = await svc.downloadDocument(d.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.nomFichier || `document-${d.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const openDocument = async (d) => {
    const tab = window.open("about:blank", "_blank");
    if (!tab) { toast("Autorisez les fenêtres pop-up pour ouvrir le document.", "warning"); return; }
    try {
      const blob = await svc.downloadDocument(d.id);
      const url = URL.createObjectURL(blob);
      tab.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      tab.close();
      toast(errMessage(e), "error");
    }
  };
  const removeDoc = async (d) => {
    if (
      !(await confirm({
        title: "Supprimer ce document ?",
        message: `Le fichier « ${d.nomFichier} » sera supprimé.`,
        confirmLabel: "Supprimer",
        danger: true,
      }))
    )
      return;
    toast("Suppression du document en cours…", "info");
    try {
      await svc.deleteDocument(d.id);
      toast("Document supprimé.");
      load();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const saveParty = async (e) => {
    e.preventDefault();
    toast("Ajout de la partie en cours…", "info");
    try {
      const { typePersonnalise, ...party } = partyForm;
      await svc.createParty({
        ...party,
        type: party.type === "AUTRE" ? typePersonnalise.trim() : party.type,
        contratId: c.id,
      });
      setPartyForm({
        nom: "",
        type: "COCONTRACTANT",
        typePersonnalise: "",
        email: "",
        telephone: "",
      });
      toast("Partie ajoutée au contrat.");
      load();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const removeParty = async (p) => {
    if (
      !(await confirm({
        title: "Retirer cette partie ?",
        message: `Retirer ${p.nom} de ce contrat ?`,
        confirmLabel: "Retirer",
        danger: true,
      }))
    )
      return;
    toast("Suppression de la partie en cours…", "info");
    try {
      await svc.deleteParty(p.id);
      toast("Partie retirée.");
      load();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const saveAmend = async (e) => {
    e.preventDefault();
    toast("Création de l’avenant en cours…", "info");
    try {
      const created = await svc.createAmendment({
        ...amendForm,
        contratId: c.id,
        creePar: user?.id,
        numero: Number(amendForm.numero),
        montantAvant:
          amendForm.montantAvant === "" ? null : Number(amendForm.montantAvant),
        montantApres:
          amendForm.montantApres === "" ? null : Number(amendForm.montantApres),
      });
      // Le backend soumet automatiquement l’avenant au circuit configuré.
      toast(created?.statut === "EN_VALIDATION"
        ? "Avenant créé et transmis au circuit de validation. Le contrat reste inchangé dans l’attente des approbations."
        : "Avenant créé. Vérifiez son statut avant toute modification du contrat.");
      setAmendForm((previous) => ({
        ...previous,
        numero: Number(previous.numero) + 1,
        description: "",
        modifications: "",
        montantApres: "",
        dateFinApres: "",
      }));
      await load();
      await onRefresh();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const submitValidation = async () => {
    if (
      !(await confirm({
        title: "Soumettre en validation ?",
        message: `Un circuit de validation va être généré pour ${c.reference}. Vérifiez que les informations et documents sont complets.`,
        confirmLabel: "Soumettre",
      }))
    )
      return;
    try {
      await svc.generateValidations(c.id, user?.id);
      toast("Le circuit de validation a été généré.");
      await load();
      await onRefresh();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const saveObligation = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post(`/contrats/${c.id}/obligations`, obligationForm);
      setObligationForm({ titre: "", description: "", echeance: "" });
      toast("Obligation ajoutée au contrat.");
      await load();
    } catch (e) {
      toast(errMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const updateObligation = async (obligation, action) => {
    const closing = action === "cloturer";
    if (!(await confirm({
      title: closing ? "Clôturer cette obligation ?" : "Annuler cette obligation ?",
      message: `« ${obligation.titre} » sera ${closing ? "marquée comme terminée" : "annulée"}.`,
      confirmLabel: closing ? "Clôturer" : "Annuler l’obligation",
      danger: !closing,
    }))) return;
    try {
      await api.put(`/obligations/${obligation.id}/${action}`);
      toast(closing ? "Obligation clôturée." : "Obligation annulée.");
      await load();
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const sign = async () => {
    if (!docs.some(d => d.categorie === "CONTRAT_SIGNE")) { setTab("documents"); toast("Ajoutez le PDF du contrat signé avant de confirmer la signature externe.", "warning"); return; }
    try {
      await svc.signContract(c.id);
      toast("Contrat marqué comme signé.");
      await onRefresh();
    } catch (e) { toast(errMessage(e), "error"); }
  };
  const terminate = async () => {
    if (obligations.some((obligation) => obligation.statut === "EN_COURS")) {
      setTab("obligations");
      toast("Clôturez ou annulez les obligations en cours avant de résilier.", "warning");
      return;
    }
    if (!(await confirm({ title: "Résilier ce contrat ?", message: `Le contrat ${c.reference} passera au statut résilié.`, confirmLabel: "Résilier", danger: true }))) return;
    try { await svc.terminateContract(c.id); toast("Contrat marqué comme résilié."); await onRefresh(); }
    catch (e) { toast(errMessage(e), "error"); }
  };
  return (
    <div className={`mgr-page mgr-contract-details${c.statut === "BROUILLON" ? " is-draft" : ""}`}>
      <div className="mgr-page-head">
        <div>
          <button
            className="mgr-back"
            onClick={() => nav("/gestionnaire/contrats")}
          >
            <InlineIcon className="fa-solid fa-arrow-left" /> Retour aux contrats
          </button>
          <h2>{c.reference || `Contrat #${c.id}`}</h2>
          <p>{c.objet}</p>
        </div>
        <PageActions>
          <Button
            variant="secondary"
            onClick={() => nav(`/gestionnaire/contrats/${c.id}/modifier`)}
          >
            <InlineIcon className="fa-regular fa-pen-to-square" /> Modifier
          </Button>
          {c.statut === "APPROUVE" ? <Button onClick={sign}><InlineIcon className="fa-solid fa-file-signature" /> Confirmer la signature externe</Button> : ["BROUILLON", "EN_ATTENTE", "REJETE"].includes(c.statut) ? <Button onClick={submitValidation}><InlineIcon className="fa-solid fa-paper-plane" /> Soumettre en validation</Button> : null}
          {["SIGNE", "ACTIF"].includes(c.statut) && <Button variant="danger-outline" onClick={terminate}><InlineIcon className="fa-solid fa-ban" /> Résilier</Button>}
        </PageActions>
      </div>
      <div className="mgr-detail-summary">
        <div>
          <span>Statut</span>
          <strong>
            <span className={`mgr-status ${statusClass(c.statut)}`}>
              {statusLabel(c.statut)}
            </span>
          </strong>
        </div>
        <div>
          <span>Montant</span>
          <strong>{money(c.montant, c.devise)}</strong>
        </div>
        <div>
          <span>Date de début</span>
          <strong>{date(c.dateDebut)}</strong>
        </div>
        <div>
          <span>Date de fin</span>
          <strong>{date(c.dateFin)}</strong>
        </div>
        <div>
          <span>Service</span>
          <strong>{c.service || "—"}</strong>
        </div>
      </div>
      <div className="mgr-tabs">
        {[
          ["resume", "Résumé"],
          ["documents", `Documents (${docs.length})`],
          ["parties", `Parties (${parties.length})`],
          ["avenants", `Avenants (${amendments.length})`],
          ["obligations", `Obligations (${obligations.filter((item) => item.statut === "EN_COURS").length})`],
          ["validations", `Validations (${validations.length})`],
        ].map(([v, l]) => (
          <button
            key={v}
            className={tab === v ? "active" : ""}
            onClick={() => setTab(v)}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "resume" && (
        <section className="mgr-panel">
          <div className="mgr-panel-title">
            <h3>Informations contractuelles</h3>
          </div>
          <div className="mgr-detail-grid">
            {[
              ["Référence", c.reference],
              ["Objet", c.objet],
              ["Description", c.description],
              ["Type", types.find((t) => String(t.id) === String(c.typeId))?.nom || (c.typeId ? `Type #${c.typeId}` : "—")],
              ["Responsable (matricule)", users.find((person) => String(person.id) === String(c.responsableId))?.matricule || "—"],
              ["Service", c.service],
              ["Date de signature", date(c.dateSignature)],
              ["Date de début", date(c.dateDebut)],
              ["Date de fin", date(c.dateFin)],
              ["Durée (mois)", c.dureeMois],
              [
                "Renouvellement automatique",
                c.renouvellementAutomatique ? "Oui" : "Non",
              ],
              ["Préavis (jours)", c.joursPreavis],
              ["Clauses", c.clauses],
            ].map(([l, v]) => (
              <div key={l}>
                <small>{l}</small>
                <p>{v ?? "—"}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "documents" && (
        <section className="mgr-panel">
          <div className="mgr-panel-title">
            <div>
              <h3>Documents contractuels</h3>
              <p>Pièces justificatives et exemplaire signé (limite : 15 Mo).</p>
            </div>
            <div className="mgr-document-upload-controls">
              <label className="mgr-document-name-field">
                <span>Nom du document</span>
                <input value={documentName} onChange={(e) => setDocumentName(e.target.value)} disabled={busy} />
              </label>
              <select aria-label="Catégorie du document" value={docCategory} onChange={e => setDocCategory(e.target.value)} disabled={busy} style={{ marginRight: 8, padding: 9, borderRadius: 8 }}><option value="JUSTIFICATIF">Pièce justificative</option>{c.statut === "APPROUVE" && <option value="CONTRAT_SIGNE">Contrat signé (PDF)</option>}</select>
              <label className="mgr-btn primary file-upload"><InlineIcon className="fa-solid fa-upload" />{busy ? "Envoi…" : "Ajouter un document"}<input type="file" accept={docCategory === "CONTRAT_SIGNE" ? ".pdf,application/pdf" : undefined} onChange={upload} disabled={busy || !documentName.trim()} /></label>
            </div>
          </div>
          {docsLoading ? (
            <LoadingOrEmpty loading />
          ) : docsError ? (
            <div className="mgr-inline-error">{docsError}</div>
          ) : docs.length === 0 ? (
            <LoadingOrEmpty empty />
          ) : (
            <Pagination items={docs} resetKey={c.id}>
              {(visibleDocuments) => (
            <div className="mgr-list">
              {visibleDocuments.map((d) => (
                <div className="mgr-list-row" key={d.id}>
                  <span className="mgr-file-icon">
                    <InlineIcon className="fa-regular fa-file-lines" />
                  </span>
                  <div className="mgr-list-main">
                    <strong>{d.nomFichier}</strong>
                    <small>
                      {d.categorie === "CONTRAT_SIGNE" ? "Contrat signé" : "Pièce justificative"} · {d.type || "Document"} · Version {d.version || 1} ·{" "}
                      {date(d.dateImport)}
                    </small>
                  </div>
                  <PageActions>
                    <Button variant="secondary" onClick={() => openDocument(d)}>
                      <InlineIcon className="fa-regular fa-eye" /> Ouvrir
                    </Button>
                    <Button variant="secondary" onClick={() => download(d)}>
                      <InlineIcon className="fa-solid fa-download" /> Télécharger
                    </Button>
                    <Button
                      variant="danger-outline"
                      onClick={() => removeDoc(d)}
                    >
                      <InlineIcon className="fa-regular fa-trash-can" />
                    </Button>
                  </PageActions>
                </div>
              ))}
            </div>
              )}
            </Pagination>
          )}
        </section>
      )}
      {tab === "parties" && (
        <section className="mgr-panel">
          <div className="mgr-panel-title">
            <div>
              <h3>Parties au contrat</h3>
              <p>Cocontractants et contacts associés.</p>
            </div>
          </div>
          <form className="mgr-inline-form" onSubmit={saveParty}>
            <label className="mgr-field">
              <span>Nom / organisation *</span>
              <input
                required
                value={partyForm.nom}
                onChange={(e) =>
                  setPartyForm({ ...partyForm, nom: e.target.value })
                }
              />
            </label>
            <label className="mgr-field">
              <span>Rôle</span>
              <select
                value={partyForm.type}
                onChange={(e) =>
                  setPartyForm({ ...partyForm, type: e.target.value })
                }
              >
                <option>COCONTRACTANT</option>
                <option>FOURNISSEUR</option>
                <option>CLIENT</option>
                <option>PARTENAIRE</option>
                <option>SOUS-TRAITANT</option>
                {partyRoles
                  .filter((role) => role !== "AUTRE")
                  .map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                <option value="AUTRE">Autre</option>
              </select>
            </label>
            {partyForm.type === "AUTRE" && (
              <label className="mgr-field">
                <span>Précisez le rôle *</span>
                <input
                  required
                  maxLength="100"
                  value={partyForm.typePersonnalise || ""}
                  onChange={(e) =>
                    setPartyForm({ ...partyForm, typePersonnalise: e.target.value })
                  }
                  placeholder="Saisir le rôle"
                />
              </label>
            )}
            <label className="mgr-field">
              <span>Email</span>
              <input
                type="email"
                value={partyForm.email}
                onChange={(e) =>
                  setPartyForm({ ...partyForm, email: e.target.value })
                }
              />
            </label>
            <label className="mgr-field">
              <span>Téléphone</span>
              <input
                value={partyForm.telephone}
                onChange={(e) =>
                  setPartyForm({ ...partyForm, telephone: e.target.value })
                }
              />
            </label>
            <Button type="submit">
              <InlineIcon className="fa-solid fa-plus" /> Ajouter
            </Button>
          </form>
          {parties.length === 0 ? (
            <LoadingOrEmpty empty />
          ) : (
            <Pagination items={parties} resetKey={c.id}>
              {(visibleParties) => (
            <div className="mgr-list">
              {visibleParties.map((p) => (
                <div className="mgr-list-row" key={p.id}>
                  <span className="mgr-avatar">
                    {(p.nom || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="mgr-list-main">
                    <strong>{p.nom}</strong>
                    <small>
                      {p.type || "Partie"} · {p.email || "Sans email"} ·{" "}
                      {p.telephone || "Sans téléphone"}
                    </small>
                  </div>
                  <Button
                    variant="danger-outline"
                    onClick={() => removeParty(p)}
                  >
                    <InlineIcon className="fa-regular fa-trash-can" />
                  </Button>
                </div>
              ))}
            </div>
              )}
            </Pagination>
          )}
        </section>
      )}
      {tab === "avenants" && (
        <section className="mgr-panel">
          <div className="mgr-panel-title">
            <div>
              <h3>Avenants du contrat</h3>
              <p>
                Conservez les modifications contractuelles avec leur date et
                leur justification.
              </p>
            </div>
          </div>
          <form className="mgr-form-grid" onSubmit={saveAmend}>
            <label className="mgr-field">
              <span>Numéro d’avenant *</span>
              <input
                required
                type="number"
                min="1"
                value={amendForm.numero}
                onChange={(e) =>
                  setAmendForm({ ...amendForm, numero: e.target.value })
                }
              />
            </label>
            <label className="mgr-field">
              <span>Date de l’avenant *</span>
              <input
                required
                type="date"
                value={amendForm.dateAvenant}
                onChange={(e) =>
                  setAmendForm({ ...amendForm, dateAvenant: e.target.value })
                }
              />
            </label>
            <label className="mgr-field wide">
              <span>Description *</span>
              <input
                required
                value={amendForm.description}
                onChange={(e) =>
                  setAmendForm({ ...amendForm, description: e.target.value })
                }
              />
            </label>
            <label className="mgr-field wide">
              <span>Modifications détaillées</span>
              <textarea
                rows="3"
                value={amendForm.modifications}
                onChange={(e) =>
                  setAmendForm({ ...amendForm, modifications: e.target.value })
                }
              />
            </label>
            <label className="mgr-field">
              <span>Montant après avenant</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amendForm.montantApres}
                onChange={(e) =>
                  setAmendForm({ ...amendForm, montantApres: e.target.value })
                }
              />
            </label>
            <label className="mgr-field">
              <span>Nouvelle date de fin</span>
              <input
                type="date"
                value={amendForm.dateFinApres}
                onChange={(e) =>
                  setAmendForm({ ...amendForm, dateFinApres: e.target.value })
                }
              />
            </label>
            <div className="mgr-form-actions">
              <Button type="submit">
                <InlineIcon className="fa-solid fa-plus" /> Créer l’avenant
              </Button>
            </div>
          </form>
          <Pagination items={amendments} resetKey={c.id}>
            {(visibleAmendments) => visibleAmendments.map((a) => (
            <div className="mgr-timeline-item" key={a.id}>
              <strong>
                Avenant n°{a.numero} — {a.description}
              </strong>
              <small>
                {date(a.dateAvenant)} · Montant après :{" "}
                {money(a.montantApres, c.devise)}
              </small>
              <p className={`mgr-amendment-status ${statusClass(a.statut)}`}>
                Statut : <strong>{statusLabel(a.statut || "EN_ATTENTE")}</strong>
                {a.cycleValidation ? ` · Cycle ${a.cycleValidation}` : ""}
              </p>
              <p>{a.modifications}</p>
              {a.statut === "MODIFICATION_DEMANDEE" && String(a.creePar) === String(user?.id) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!(await confirm({
                      title: "Resoumettre cet avenant ?",
                      message: "Après vos corrections, l’avenant sera soumis à un nouveau cycle de validation.",
                      confirmLabel: "Resoumettre",
                    }))) return;
                    try {
                      await svc.resubmitAmendment(a.id);
                      toast("Avenant resoumis au circuit de validation.");
                      await load();
                    } catch (error) {
                      toast(errMessage(error), "error");
                    }
                  }}
                >
                  <InlineIcon className="fa-solid fa-rotate-right" /> Resoumettre après correction
                </Button>
              )}
            </div>
            ))}
          </Pagination>
        </section>
      )}
      {tab === "obligations" && (
        <section className="mgr-panel">
          <div className="mgr-panel-title">
            <div>
              <h3>Obligations contractuelles</h3>
              <p>
                Suivez les engagements à terminer avant la clôture ou la
                résiliation du contrat.
              </p>
            </div>
          </div>
          <form className="mgr-form-grid" onSubmit={saveObligation}>
            <label className="mgr-field">
              <span>Obligation *</span>
              <input
                required
                value={obligationForm.titre}
                onChange={(event) =>
                  setObligationForm({
                    ...obligationForm,
                    titre: event.target.value,
                  })
                }
                placeholder="Ex. remettre les livrables finaux"
              />
            </label>
            <label className="mgr-field">
              <span>Échéance</span>
              <input
                type="date"
                value={obligationForm.echeance}
                onChange={(event) =>
                  setObligationForm({
                    ...obligationForm,
                    echeance: event.target.value,
                  })
                }
              />
            </label>
            <label className="mgr-field wide">
              <span>Description</span>
              <textarea
                rows="3"
                value={obligationForm.description}
                onChange={(event) =>
                  setObligationForm({
                    ...obligationForm,
                    description: event.target.value,
                  })
                }
              />
            </label>
            <div className="mgr-form-actions">
              <Button type="submit" disabled={busy}>
                <InlineIcon className="fa-solid fa-plus" /> Ajouter l’obligation
              </Button>
            </div>
          </form>
          {docsError ? (
            <div className="mgr-inline-error">{docsError}</div>
          ) : obligations.length === 0 ? (
            <LoadingOrEmpty empty />
          ) : (
            <Pagination items={obligations} resetKey={c.id}>
              {(visibleObligations) => (
                <div className="mgr-list">
                  {visibleObligations.map((obligation) => (
                    <div className="mgr-list-row" key={obligation.id}>
                      <span className="mgr-file-icon">
                        <InlineIcon className="fa-solid fa-list-check" />
                      </span>
                      <div className="mgr-list-main">
                        <strong>{obligation.titre}</strong>
                        <small>
                          Échéance : {date(obligation.echeance)} · Créée le{" "}
                          {date(obligation.dateCreation)}
                        </small>
                        {obligation.description && <p>{obligation.description}</p>}
                      </div>
                      <span
                        className={`mgr-status ${statusClass(obligation.statut)}`}
                      >
                        {obligation.statut === "EN_COURS"
                          ? "En cours"
                          : obligation.statut === "TERMINEE"
                            ? "Terminée"
                            : obligation.statut === "ANNULEE"
                              ? "Annulée"
                              : obligation.statut}
                      </span>
                      {obligation.statut === "EN_COURS" && (
                        <PageActions>
                          <Button
                            variant="secondary"
                            onClick={() => updateObligation(obligation, "cloturer")}
                          >
                            <InlineIcon className="fa-solid fa-check" /> Clôturer
                          </Button>
                          <Button
                            variant="danger-outline"
                            onClick={() => updateObligation(obligation, "annuler")}
                          >
                            <InlineIcon className="fa-solid fa-ban" /> Annuler
                          </Button>
                        </PageActions>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Pagination>
          )}
        </section>
      )}
      {tab === "validations" && (
        <section className="mgr-panel">
          <div className="mgr-panel-title">
            <div>
              <h3>Historique des validations</h3>
              <p>État et décisions connus pour ce contrat.</p>
            </div>
            <Button onClick={submitValidation}>
              <InlineIcon className="fa-solid fa-paper-plane" /> Générer le circuit
            </Button>
          </div>
          {validations.length === 0 ? (
            <LoadingOrEmpty empty />
          ) : (
            <Pagination items={validations} resetKey={c.id}>
              {(visibleValidations) => (
            <div className="mgr-list">
              {visibleValidations.map((v) => (
                <div className="mgr-list-row" key={v.id}>
                  <span className="mgr-file-icon">
                    <InlineIcon className="fa-solid fa-stamp" />
                  </span>
                  <div className="mgr-list-main">
                    <strong>
                      {v.etape || `${v.roleRequis || "Validation"} — niveau ${v.niveau ?? "—"}`}
                    </strong>
                    <small>
                      Valideur : {v.valideurId || "À attribuer"} ·{" "}
                      {date(v.dateValidation || v.dateSoumission)}
                    </small>
                    <p>
                      {v.commentaire || v.decision || "En attente de décision"}
                    </p>
                  </div>
                  <span
                    className={`mgr-status ${statusClass(v.decision)}`}
                  >
                    {statusLabel(v.decision || "EN_ATTENTE")}
                  </span>
                </div>
              ))}
            </div>
              )}
            </Pagination>
          )}
        </section>
      )}
      {preview && <div className="mgr-preview-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) { URL.revokeObjectURL(preview.url); setPreview(null); } }}>
        <section className="mgr-preview-dialog" role="dialog" aria-modal="true" aria-label={`Aperçu : ${preview.name}`}>
          <header><strong>{preview.name}</strong><div className="mgr-actions">
            <a className="mgr-btn secondary" href={preview.url} target="_blank" rel="noreferrer"><InlineIcon className="fa-solid fa-arrow-up-right-from-square" /> Ouvrir dans un nouvel onglet</a>
            <a className="mgr-btn secondary" href={preview.url} download={preview.name}><InlineIcon className="fa-solid fa-download" /> Télécharger</a>
            <button className="mgr-preview-close" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} aria-label="Fermer l’aperçu">×</button>
          </div></header>
          {preview.mime === "application/pdf" ? <iframe title={`Aperçu ${preview.name}`} src={preview.url} /> : preview.mime.startsWith("image/") ? <img src={preview.url} alt={preview.name} /> : <div className="mgr-state">L’aperçu intégré est disponible pour les PDF et les images.</div>}
        </section>
      </div>}
    </div>
  );
}

export default ContractsPage;
