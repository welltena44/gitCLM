import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFeedback } from "../../composants/FeedbackContext.jsx";
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
    VALIDE: "Validé",
    APPROUVE: "Approuvé",
    ACTIF: "Actif",
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
    : ["EN_ATTENTE", "EN_VALIDATION"].includes(s)
      ? "pending"
      : ["REJETE", "EXPIRE", "RESILIE"].includes(s)
        ? "bad"
        : "neutral";
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
        <i className="fa-solid fa-spinner fa-spin" /> Chargement des données…
      </div>
    );
  if (error)
    return (
      <div className="mgr-state error">
        <i className="fa-solid fa-circle-exclamation" /> {error}
      </div>
    );
  if (empty)
    return (
      <div className="mgr-state">
        <i className="fa-regular fa-folder-open" /> Aucun résultat ne correspond
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
    [service, setService] = useState(""),
    [responsableId, setResponsableId] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [signatureStart, setSignatureStart] = useState(""),
    [signatureEnd, setSignatureEnd] = useState(""),
    [sort, setSort] = useState("dateModification"),
    [sortDirection, setSortDirection] = useState("desc"),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10);
  const [applied, setApplied] = useState({ q: "", status: "", typeId: "", service: "", responsableId: "", start: "", end: "", signatureStart: "", signatureEnd: "", sort: "dateModification", sortDirection: "desc" });
  const [parties, setParties] = useState([]),
    [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const { id } = useParams();
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
  const services = useMemo(
    () => [...new Set(contracts.map((c) => c.service).filter(Boolean))].sort(),
    [contracts],
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
          c.responsableNom,
          users.find((u) => String(u.id) === String(c.responsableId))?.nom,
          ...parties.filter((p) => String(p.contratId) === String(c.id)).map((p) => p.nom),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (!term || text.includes(term)) &&
          (!applied.status || c.statut === applied.status) &&
          (!applied.typeId || String(c.typeId) === applied.typeId) &&
          (!applied.service || c.service === applied.service) &&
          (!applied.responsableId || String(c.responsableId) === applied.responsableId) &&
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
  }, [contracts, parties, users, types, applied]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
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
  const reset = () => {
    setQ("");
    setStatus("");
    setTypeId("");
    setService("");
    setResponsableId("");
    setStart("");
    setEnd("");
    setSignatureStart("");
    setSignatureEnd("");
    setSort("dateModification");
    setSortDirection("desc");
    setApplied({ q: "", status: "", typeId: "", service: "", responsableId: "", start: "", end: "", signatureStart: "", signatureEnd: "", sort: "dateModification", sortDirection: "desc" });
    setPage(1);
  };
  const applyFilters = () => {
    setApplied({ q, status, typeId, service, responsableId, start, end, signatureStart, signatureEnd, sort, sortDirection });
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
          <h2>Mes contrats</h2>
          <p>Recherchez, filtrez et suivez les contrats de votre périmètre.</p>
        </div>
        <PageActions>
          <Button onClick={() => nav("/gestionnaire/nouveau")}>
            <i className="fa-solid fa-plus" /> Nouveau contrat
          </Button>
          <Button variant="secondary" onClick={exportCsv}>
            <i className="fa-solid fa-file-csv" /> Exporter CSV
          </Button>
          <Button variant="secondary" onClick={reload}>
            <i className="fa-solid fa-rotate" /> Actualiser
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
              filtered.filter((c) =>
                ["ACTIF", "APPROUVE", "VALIDE"].includes(c.statut),
              ).length
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
              <i className="fa-solid fa-filter" /> Recherche et filtres
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
              <i className="fa-solid fa-magnifying-glass" />
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
            <span>Service</span>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="">Tous les services</option>
              {services.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="mgr-field">
            <span>Responsable</span>
            <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
              <option value="">Tous les responsables</option>
              {[...new Map(users.filter((u) => contracts.some((c) => String(c.responsableId) === String(u.id))).map((u) => [u.id, u])).values()].map((u) => <option key={u.id} value={u.id}>{[u.prenom, u.nom].filter(Boolean).join(" ") || `Responsable #${u.id}`}</option>)}
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
            <Button onClick={applyFilters}><i className="fa-solid fa-filter" /> Appliquer</Button>
          </div>
        </div>
      </section>
      <section className="mgr-panel">
        <div className="mgr-panel-title">
          <div>
            <h3>Résultats</h3>
              <p>{filtered.length} contrat(s) correspondant à votre recherche{selectedIds.length ? ` · ${selectedIds.length} sélectionné(s)` : ""}</p>
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
            <div className="mgr-table-wrap">
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th><input aria-label="Sélectionner les contrats de cette page" type="checkbox" checked={visible.length > 0 && visible.every((c) => selectedIds.includes(c.id))} onChange={(e) => setSelectedIds((ids) => e.target.checked ? [...new Set([...ids, ...visible.map((c) => c.id)])] : ids.filter((id) => !visible.some((c) => c.id === id)))} /></th>
                    <th>Référence / objet</th>
                    <th>Type</th>
                    <th>Partenaire</th>
                    <th>Montant</th>
                    <th>Signature / fin</th>
                    <th>Statut</th>
                    <th>Service / responsable</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c.id}>
                      <td><input aria-label={`Sélectionner ${c.reference || c.objet}`} type="checkbox" checked={selectedIds.includes(c.id)} onChange={(e) => setSelectedIds((ids) => e.target.checked ? [...ids, c.id] : ids.filter((selectedId) => selectedId !== c.id))} /></td>
                      <td>
                        <button
                          className="mgr-contract-link"
                          onClick={() => nav(`/gestionnaire/contrats/${c.id}`)}
                        >
                          {c.reference || `CLM-${c.id}`}
                        </button>
                        <strong className="mgr-cell-title">{c.objet}</strong>
                        <small>Créé le {date(c.dateCreation)}</small>
                      </td>
                      <td>
                        <span>{types.find((t) => String(t.id) === String(c.typeId))?.nom || `Type #${c.typeId || "—"}`}</span>
                      </td>
                      <td>
                        {(parties.filter((p) => String(p.contratId) === String(c.id)).map((p) => p.nom).join(", ")) || "—"}
                      </td>
                      <td>{money(c.montant, c.devise)}</td>
                      <td>
                        <small>Signature : {date(c.dateSignature)}</small>
                        <small>Fin : {date(c.dateFin)}</small>
                      </td>
                      <td>
                        <span className={`mgr-status ${statusClass(c.statut)}`}>
                          {statusLabel(c.statut)}
                        </span>
                      </td>
                      <td>
                        <span>{c.service || "—"}</span>
                        <small>{[users.find((u) => String(u.id) === String(c.responsableId))?.prenom, users.find((u) => String(u.id) === String(c.responsableId))?.nom].filter(Boolean).join(" ") || c.responsableNom || (c.responsableId ? `Responsable #${c.responsableId}` : "—")}</small>
                      </td>
                      <td>
                        <div className="mgr-row-actions">
                          <button
                            title="Afficher"
                            onClick={() =>
                              nav(`/gestionnaire/contrats/${c.id}`)
                            }
                          >
                            <i className="fa-regular fa-eye" />
                          </button>
                          <button
                            title="Modifier"
                            onClick={() =>
                              nav(`/gestionnaire/contrats/${c.id}/modifier`)
                            }
                          >
                            <i className="fa-regular fa-pen-to-square" />
                          </button>
                          <button
                            title="Supprimer"
                            className="danger"
                            onClick={() => remove(c)}
                          >
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
  const [docs, setDocs] = useState([]),
    [parties, setParties] = useState([]),
    [amendments, setAmendments] = useState([]),
    [validations, setValidations] = useState([]),
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
  const load = useCallback(async () => {
    setDocsLoading(true);
    setDocsError("");
    try {
      const [d, p, a, v] = await Promise.all([
        svc.getDocuments(c.id),
        svc.getParties(c.id),
        svc.getAmendments(c.id),
        svc.getValidations(c.id),
      ]);
      setDocs(d || []);
      setParties(p || []);
      setAmendments(a || []);
      setValidations(v || []);
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
      await svc.uploadDocument(c.id, file, user?.id);
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
    try {
      const blob = await svc.downloadDocument(d.id);
      const extension = (d.type || d.nomFichier || "").toLowerCase();
      const imageType = extension.match(/(?:image\/)?(png|jpe?g|gif|webp)|\.(png|jpe?g|gif|webp)$/)?.[1];
      const mime = extension.includes("pdf") ? "application/pdf"
        : imageType ? `image/${imageType.replace("jpg", "jpeg")}`
          : "application/octet-stream";
      const url = URL.createObjectURL(new Blob([blob], { type: mime }));
      setPreview((previous) => {
        if (previous?.url) URL.revokeObjectURL(previous.url);
        return { url, mime, name: d.nomFichier || "Document" };
      });
    } catch (e) {
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
      await svc.createParty({ ...partyForm, contratId: c.id });
      setPartyForm({
        nom: "",
        type: "COCONTRACTANT",
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
      await svc.createAmendment({
        ...amendForm,
        contratId: c.id,
        creePar: user?.id,
        numero: Number(amendForm.numero),
        montantAvant:
          amendForm.montantAvant === "" ? null : Number(amendForm.montantAvant),
        montantApres:
          amendForm.montantApres === "" ? null : Number(amendForm.montantApres),
      });
      toast("Avenant créé.");
      load();
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
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <button
            className="mgr-back"
            onClick={() => nav("/gestionnaire/contrats")}
          >
            <i className="fa-solid fa-arrow-left" /> Retour aux contrats
          </button>
          <h2>{c.reference || `Contrat #${c.id}`}</h2>
          <p>{c.objet}</p>
        </div>
        <PageActions>
          <Button
            variant="secondary"
            onClick={() => nav(`/gestionnaire/contrats/${c.id}/modifier`)}
          >
            <i className="fa-regular fa-pen-to-square" /> Modifier
          </Button>
          <Button onClick={submitValidation}>
            <i className="fa-solid fa-paper-plane" /> Soumettre en validation
          </Button>
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
              ["Responsable", (() => { const person = users.find((u) => String(u.id) === String(c.responsableId)); return [person?.prenom, person?.nom].filter(Boolean).join(" ") || c.responsableNom || (c.responsableId ? `Responsable #${c.responsableId}` : "—"); })()],
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
              <p>
                PDF, Word et autres pièces justificatives (limite frontend : 15
                Mo).
              </p>
            </div>
            <label className="mgr-btn primary file-upload">
              <i className="fa-solid fa-upload" />
              {busy ? "Envoi…" : "Ajouter un document"}
              <input type="file" onChange={upload} disabled={busy} />
            </label>
          </div>
          {docsLoading ? (
            <LoadingOrEmpty loading />
          ) : docsError ? (
            <div className="mgr-inline-error">{docsError}</div>
          ) : docs.length === 0 ? (
            <LoadingOrEmpty empty />
          ) : (
            <div className="mgr-list">
              {docs.map((d) => (
                <div className="mgr-list-row" key={d.id}>
                  <span className="mgr-file-icon">
                    <i className="fa-regular fa-file-lines" />
                  </span>
                  <div className="mgr-list-main">
                    <strong>{d.nomFichier}</strong>
                    <small>
                      {d.type || "Document"} · Version {d.version || 1} ·{" "}
                      {date(d.dateImport)}
                    </small>
                  </div>
                  <PageActions>
                    <Button variant="secondary" onClick={() => openDocument(d)}>
                      <i className="fa-regular fa-eye" /> Ouvrir
                    </Button>
                    <Button variant="secondary" onClick={() => download(d)}>
                      <i className="fa-solid fa-download" /> Télécharger
                    </Button>
                    <Button
                      variant="danger-outline"
                      onClick={() => removeDoc(d)}
                    >
                      <i className="fa-regular fa-trash-can" />
                    </Button>
                  </PageActions>
                </div>
              ))}
            </div>
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
              </select>
            </label>
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
              <i className="fa-solid fa-plus" /> Ajouter
            </Button>
          </form>
          {parties.length === 0 ? (
            <LoadingOrEmpty empty />
          ) : (
            <div className="mgr-list">
              {parties.map((p) => (
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
                    <i className="fa-regular fa-trash-can" />
                  </Button>
                </div>
              ))}
            </div>
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
                <i className="fa-solid fa-plus" /> Créer l’avenant
              </Button>
            </div>
          </form>
          {amendments.map((a) => (
            <div className="mgr-timeline-item" key={a.id}>
              <strong>
                Avenant n°{a.numero} — {a.description}
              </strong>
              <small>
                {date(a.dateAvenant)} · Montant après :{" "}
                {money(a.montantApres, c.devise)}
              </small>
              <p>{a.modifications}</p>
            </div>
          ))}
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
              <i className="fa-solid fa-paper-plane" /> Générer le circuit
            </Button>
          </div>
          {validations.length === 0 ? (
            <LoadingOrEmpty empty />
          ) : (
            <div className="mgr-list">
              {validations.map((v) => (
                <div className="mgr-list-row" key={v.id}>
                  <span className="mgr-file-icon">
                    <i className="fa-solid fa-stamp" />
                  </span>
                  <div className="mgr-list-main">
                    <strong>
                      {v.etape || v.typeValidation || `Validation #${v.id}`}
                    </strong>
                    <small>
                      Valideur : {v.valideurId || "À attribuer"} ·{" "}
                      {date(v.dateDecision || v.dateCreation)}
                    </small>
                    <p>
                      {v.commentaire || v.decision || "En attente de décision"}
                    </p>
                  </div>
                  <span
                    className={`mgr-status ${statusClass(v.statut || v.decision)}`}
                  >
                    {statusLabel(v.statut || v.decision || "EN_ATTENTE")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {preview && <div className="mgr-preview-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) { URL.revokeObjectURL(preview.url); setPreview(null); } }}>
        <section className="mgr-preview-dialog" role="dialog" aria-modal="true" aria-label={`Aperçu : ${preview.name}`}>
          <header><strong>{preview.name}</strong><div className="mgr-actions">
            <a className="mgr-btn secondary" href={preview.url} target="_blank" rel="noreferrer"><i className="fa-solid fa-arrow-up-right-from-square" /> Ouvrir dans un nouvel onglet</a>
            <a className="mgr-btn secondary" href={preview.url} download={preview.name}><i className="fa-solid fa-download" /> Télécharger</a>
            <button className="mgr-preview-close" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} aria-label="Fermer l’aperçu">×</button>
          </div></header>
          {preview.mime === "application/pdf" ? <iframe title={`Aperçu ${preview.name}`} src={preview.url} /> : preview.mime.startsWith("image/") ? <img src={preview.url} alt={preview.name} /> : <div className="mgr-state">L’aperçu intégré est disponible pour les PDF et les images.</div>}
        </section>
      </div>}
    </div>
  );
}

export function ContractFormPage() {
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
    service: user?.service || "",
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
            service: c.service || "",
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
        <i className="fa-solid fa-spinner fa-spin" /> Chargement du formulaire…
      </div>
    );
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <button className="mgr-back" onClick={() => nav(-1)}>
            <i className="fa-solid fa-arrow-left" /> Retour
          </button>
          <h2>{editing ? "Modifier le contrat" : "Nouveau contrat"}</h2>
          <p>Renseignez les informations contractuelles requises.</p>
        </div>
      </div>
      {error && (
        <div className="mgr-inline-error">
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </div>
      )}
      <form className="mgr-panel mgr-contract-form" onSubmit={submit}>
        <div className="mgr-panel-title">
          <h3>
            <i className="fa-regular fa-file-lines" /> Informations générales
          </h3>
          <span className="mgr-required">* Champs obligatoires</span>
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
            <i className="fa-solid fa-coins" /> Conditions financières
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
            <i className="fa-regular fa-calendar" /> Dates et responsabilités
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
            <span>Service</span>
            <input
              value={form.service || ""}
              onChange={(e) => change("service", e.target.value)}
            />
          </label>
          <label className="mgr-field">
            <span>ID du responsable *</span>
            <input
              required
              type="number"
              min="1"
              value={form.responsableId}
              onChange={(e) => change("responsableId", e.target.value)}
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
          <label className="mgr-field">
            <span>Statut</span>
            <select
              value={form.statut || "BROUILLON"}
              onChange={(e) => change("statut", e.target.value)}
            >
              <option value="BROUILLON">Brouillon</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
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
            <i
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

export function ManagerValidationsPage() {
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, c] = await Promise.all([
        svc.getValidations(),
        svc.getContracts(),
      ]);
      setItems(v || []);
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
  const data = items.filter((v) => {
    const c = contracts.find((x) => String(x.id) === String(v.contratId));
    return (
      (!filter ||
        String(v.decision || v.statut || "EN_ATTENTE").toUpperCase() ===
          filter) &&
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
          <p>
            Suivez les circuits, décisions et éventuelles demandes de
            correction.
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          <i className="fa-solid fa-rotate" /> Actualiser
        </Button>
      </div>
      <section className="mgr-panel">
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche</span>
            <div className="mgr-search">
              <i className="fa-solid fa-magnifying-glass" />
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
          <div className="mgr-table-wrap">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Contrat</th>
                  <th>Étape / valideur</th>
                  <th>Décision</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((v) => {
                  const c = contracts.find(
                    (x) => String(x.id) === String(v.contratId),
                  );
                  return (
                    <tr key={v.id}>
                      <td>
                        <strong>
                          {c?.reference || `Contrat #${v.contratId || "—"}`}
                        </strong>
                        <small>{c?.objet || "Objet indisponible"}</small>
                      </td>
                      <td>
                        {v.etape || `Validation #${v.id}`}
                        <small>
                          {v.valideurId
                            ? `Valideur #${v.valideurId}`
                            : "Valideur à attribuer"}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`mgr-status ${statusClass(String(v.decision || v.statut || "EN_ATTENTE").toUpperCase())}`}
                        >
                          {statusLabel(
                            String(
                              v.decision || v.statut || "EN_ATTENTE",
                            ).toUpperCase(),
                          )}
                        </span>
                      </td>
                      <td>{v.commentaire || "—"}</td>
                      <td>{date(v.dateDecision || v.dateCreation)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function ManagerAmendmentsPage() {
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [q, setQ] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
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
          <p>
            Retrouvez les modifications contractuelles et leur contrat
            d’origine.
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          <i className="fa-solid fa-rotate" /> Actualiser
        </Button>
      </div>
      <section className="mgr-panel">
        <label className="mgr-field">
          <span>Recherche par numéro, description ou référence</span>
          <div className="mgr-search">
            <i className="fa-solid fa-magnifying-glass" />
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
          <div className="mgr-table-wrap">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>Avenant</th>
                  <th>Contrat d’origine</th>
                  <th>Date</th>
                  <th>Montant après</th>
                  <th>Modifications</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => {
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
                      <td>{a.modifications || a.description || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function ManagerDocumentsPage() {
  const [items, setItems] = useState([]),
    [contracts, setContracts] = useState([]),
    [q, setQ] = useState(""),
    [type, setType] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const { toast } = useFeedback();
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
          <p>Recherchez les pièces déposées dans vos dossiers contractuels.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          <i className="fa-solid fa-rotate" /> Actualiser
        </Button>
      </div>
      <section className="mgr-panel">
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche</span>
            <div className="mgr-search">
              <i className="fa-solid fa-magnifying-glass" />
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
                {data.map((d) => {
                  const c = contracts.find(
                    (x) => String(x.id) === String(d.contratId),
                  );
                  return (
                    <tr key={d.id}>
                      <td>
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
                          <i className="fa-solid fa-download" /> Télécharger
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function ManagerNotificationsPage() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const [items, setItems] = useState([]),
    [filter, setFilter] = useState("all"),
    [q, setQ] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!user?.id) {
      setError("Identifiant utilisateur indisponible.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await svc.getNotifications(user.id);
      setItems(data || []);
      setError("");
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  useEffect(() => {
    load();
  }, [load]);
  const data = items.filter(
    (n) =>
      (filter === "all" ||
        (filter === "unread" && !n.lu) ||
        (filter === "read" && n.lu)) &&
      (!q ||
        `${n.titre || ""} ${n.message || ""} ${n.type || ""}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  const mark = async (n) => {
    toast("Mise à jour de la notification…", "info");
    try {
      await svc.markNotificationRead(n.id);
      setItems((old) =>
        old.map((x) => (x.id === n.id ? { ...x, lu: true } : x)),
      );
      toast("Notification marquée comme lue.", "success");
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  const remove = async (n) => {
    if (
      !(await confirm({
        title: "Supprimer la notification ?",
        message: "Cette notification sera retirée de votre liste.",
        confirmLabel: "Supprimer",
        danger: true,
      }))
    )
      return;
    toast("Suppression de la notification en cours…", "info");
    try {
      await svc.deleteNotification(n.id);
      setItems((old) => old.filter((x) => x.id !== n.id));
      toast("Notification supprimée.");
    } catch (e) {
      toast(errMessage(e), "error");
    }
  };
  return (
    <div className="mgr-page">
      <div className="mgr-page-head">
        <div>
          <h2>Centre de notifications</h2>
          <p>
            Les informations importantes de vos contrats, validations et
            échéances.
          </p>
        </div>
        <Button variant="secondary" onClick={load}>
          <i className="fa-solid fa-rotate" /> Actualiser
        </Button>
      </div>
      <div className="mgr-kpis">
        <div>
          <span>Total</span>
          <strong>{items.length}</strong>
          <small>notifications</small>
        </div>
        <div>
          <span>Non lues</span>
          <strong>{items.filter((n) => !n.lu).length}</strong>
          <small>à consulter</small>
        </div>
        <div>
          <span>Lues</span>
          <strong>{items.filter((n) => n.lu).length}</strong>
          <small>déjà consultées</small>
        </div>
      </div>
      <section className="mgr-panel">
        <div className="mgr-filter-grid">
          <label className="mgr-field wide">
            <span>Recherche</span>
            <div className="mgr-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher dans les notifications…"
              />
            </div>
          </label>
          <label className="mgr-field">
            <span>Afficher</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </label>
        </div>
        <LoadingOrEmpty
          loading={loading}
          error={error}
          empty={!loading && !data.length}
        />
        <div className="mgr-notifications">
          {data.map((n) => (
            <article
              key={n.id}
              className={`mgr-notification ${n.lu ? "read" : ""}`}
            >
              <span
                className={`mgr-notif-icon ${String(n.type).toLowerCase()}`}
              >
                <i
                  className={`fa-solid ${String(n.type).toUpperCase().includes("VALID") ? "fa-clipboard-check" : String(n.type).toUpperCase().includes("ECHEANCE") ? "fa-calendar-days" : "fa-bell"}`}
                />
              </span>
              <div className="mgr-notif-body">
                <div className="mgr-notif-head">
                  <strong>{n.titre || "Notification CLM"}</strong>
                  {!n.lu && <span className="mgr-unread-dot">Non lue</span>}
                </div>
                <p>{n.message}</p>
                <small>
                  {n.type || "Information"} ·{" "}
                  {n.dateCreation
                    ? new Date(n.dateCreation).toLocaleString("fr-FR")
                    : "Date inconnue"}
                </small>
                {n.contratId && (
                  <Link
                    to={`/gestionnaire/contrats/${n.contratId}`}
                    className="mgr-contract-link"
                  >
                    Ouvrir le contrat{" "}
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </Link>
                )}
              </div>
              <div className="mgr-notif-actions">
                {!n.lu && (
                  <button title="Marquer comme lue" onClick={() => mark(n)}>
                    <i className="fa-solid fa-check" />
                  </button>
                )}
                <button title="Supprimer" onClick={() => remove(n)}>
                  <i className="fa-regular fa-trash-can" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
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
              <i className="fa-solid fa-floppy-disk" />
              {saving ? "Enregistrement…" : "Enregistrer le profil"}
            </Button>
          </div>
        </form>
        <p className="mgr-profile-note">
          <i className="fa-solid fa-shield-halved" /> Le mot de passe n’est pas
          modifiable depuis cette page. Une fonctionnalité dédiée de changement
          de mot de passe doit être reliée au mécanisme d’authentification du
          backend.
        </p>
      </section>
    </div>
  );
}
