import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../../services/api.js";
import Pagination from "../../composants/Pagination.jsx";

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
const date = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "—");
const normalizeSearch = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .toLocaleLowerCase("fr");
export default function Validation() {
  const { user } = useAuth();
  const location = useLocation();
  const isHistory = location.pathname.endsWith("/validations");
  const [searchParams] = useSearchParams();
  const selectedContractId = searchParams.get("contratId");
  const [validations, setValidations] = useState([]),
    [contracts, setContracts] = useState([]),
    [amendments, setAmendments] = useState([]),
    [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(null),
    [comments, setComments] = useState({}),
    [query, setQuery] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [v, c, a] = await Promise.all([
        api.get("/validations"),
        api.get("/contrats"),
        api.get("/avenants"),
      ]);
      const rows = Array.isArray(v.data) ? v.data : [];
      setValidations(rows);
      setContracts(Array.isArray(c.data) ? c.data : []);
      setAmendments(Array.isArray(a.data) ? a.data : []);
      const ids = [
        ...new Set(
          rows
            .filter((x) => x.decision === "EN_ATTENTE")
            .map((x) => x.contratId),
        ),
      ];
      const docs = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await api.get(`/contrats/${id}/documents`);
            return [id, response.data || []];
          } catch {
            return [id, []];
          }
        }),
      );
      setDocuments(Object.fromEntries(docs));
    } catch (e) {
      setError(
        e.response?.data?.message || "Impossible de charger les validations.",
      );
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
          (isHistory
            ? finalDecisions.has(v.decision)
            : v.decision === "EN_ATTENTE") &&
          (!v.valideurId || String(v.valideurId) === String(user?.id)) &&
          (!selectedContractId || String(v.contratId) === selectedContractId),
      ),
    [validations, user?.id, selectedContractId, isHistory],
  );
  const contractFor = (id) =>
    contracts.find((c) => String(c.id) === String(id));
  const amendmentFor = (id) =>
    amendments.find((a) => String(a.id) === String(id));
  const filteredInbox = useMemo(() => {
    const search = normalizeSearch(query.trim());
    if (!search) return inbox;
    return inbox.filter((validation) => {
      const contract = contracts.find(
        (item) => String(item.id) === String(validation.contratId),
      );
      const amendment = amendmentFor(validation.avenantId);
      return normalizeSearch(
        [
          contract?.reference,
          amendment?.numero,
          amendment?.description,
          amendment?.modifications,
          amendment?.statut,
          contract?.objet,
          contract?.service,
          contract?.statut,
          label[validation.decision] || validation.decision,
          validation.commentaire,
          validation.niveau,
          validation.cycle,
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(search);
    });
  }, [inbox, contracts, amendments, query]);
  const download = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.nomFichier || `document-${doc.id}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Impossible de télécharger la pièce jointe.",
      );
    }
  };
  const decide = async (row, decision) => {
    if (!user?.id) {
      setError("Votre session ne contient pas l’identifiant du valideur.");
      return;
    }
    setBusy(row.id);
    setError("");
    try {
      await api.post(`/validations/${row.id}/decider`, {
        valideurId: user.id,
        decision,
        commentaire: comments[row.id] || "",
      });
      await load();
    } catch (e) {
      setError(
        e.response?.data?.message || "La décision n’a pas pu être enregistrée.",
      );
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="validation-inbox">
      <div className="validation-inbox-toolbar">
        <div>
          <h2>
            <i
              className={`fa-solid ${isHistory ? "fa-clipboard-check" : "fa-file-circle-exclamation"} page-title-icon`}
              aria-hidden="true"
            />
            {isHistory ? "Mes validations" : "Contrats à examiner"}
          </h2>
          <p>
            {isHistory
              ? "Historique des décisions rendues sur les contrats qui vous sont attribués."
              : "Examinez le dossier puis approuvez, rejetez ou demandez une modification."}
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          Actualiser
        </button>
      </div>
      {error && (
        <p className="validation-error" role="alert">
          {error}
        </p>
      )}
      {selectedContractId && !isHistory && (
        <p className="validation-target-notice">
          <i className="fa-solid fa-bell" /> Contrat signalé par une
          notification
        </p>
      )}
      <label className="validation-search">
        <span>Rechercher dans les validations</span>
        <div>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Référence, objet, service, statut, commentaire…"
            aria-label="Rechercher dans les validations"
          />
        </div>
      </label>
      {loading ? (
        <p>Chargement des demandes…</p>
      ) : filteredInbox.length === 0 ? (
        <p className="validation-empty">
          {inbox.length
            ? "Aucune validation ne correspond à cette recherche."
            : isHistory
              ? "Aucune décision rendue ne vous est attribuée."
              : "Aucune validation en attente ne vous est attribuée."}
        </p>
      ) : (
        <Pagination
          items={filteredInbox}
          resetKey={`${isHistory}:${selectedContractId || ""}:${query}`}
        >
          {(visibleInbox) => visibleInbox.map((v) => {
          const c = contractFor(v.contratId);
          const amendment = v.avenantId ? amendmentFor(v.avenantId) : null;
          return (
            <article
              className={`validation-card ${String(v.contratId) === selectedContractId ? "notification-target" : ""}`}
              key={v.id}
            >
              <header>
                <div>
                  <span className="validation-kicker">
                    Niveau {v.niveau} · Cycle {v.cycle}
                  </span>
                  <h3>
                    {amendment
                      ? `Avenant n°${amendment.numero} — ${amendment.description}`
                      : `${c?.reference || `Contrat #${v.contratId}`} — ${c?.objet || "Dossier contractuel"}`}
                  </h3>
                </div>
                <span className="validation-state">{label[v.decision]}</span>
              </header>
              {amendment && (
                <div className="validation-amendment-detail">
                  <strong>Examen d’un avenant</strong>
                  <p>{amendment.modifications || amendment.description || "Aucun détail complémentaire."}</p>
                  <p>
                    <span>Statut de l’avenant : {label[amendment.statut] || amendment.statut || "En validation"}</span>
                    {amendment.cycleValidation ? ` · Cycle ${amendment.cycleValidation}` : ""}
                  </p>
                  <p>
                    Montant : {amendment.montantAvant ?? "—"} → {amendment.montantApres ?? "—"} {c?.devise || "Ar"}
                    {amendment.dateFinApres ? ` · Nouvelle échéance : ${amendment.dateFinApres}` : ""}
                  </p>
                </div>
              )}
              {c && (
                <dl className="validation-details">
                  <div>
                    <dt>Montant</dt>
                    <dd>
                      {Number(c.montant || 0).toLocaleString("fr-FR")}{" "}
                      {c.devise || "Ar"}
                    </dd>
                  </div>
                  <div>
                    <dt>Service</dt>
                    <dd>{c.service || "—"}</dd>
                  </div>
                  <div>
                    <dt>Statut</dt>
                    <dd>{c.statut || "—"}</dd>
                  </div>
                  <div>
                    <dt>Soumis le</dt>
                    <dd>{date(v.dateSoumission)}</dd>
                  </div>
                </dl>
              )}
              {c && !isHistory && (
                <details className="validation-contract-detail">
                  <summary>{amendment ? "Consulter le contrat d’origine et ses pièces" : "Consulter le dossier contractuel"}</summary>
                  <div>
                    <p>
                      <strong>Description :</strong>{" "}
                      {c.description || "Aucune description renseignée."}
                    </p>
                    <p>
                      <strong>Clauses clés :</strong>{" "}
                      {c.clauses || "Aucune clause clé renseignée."}
                    </p>
                    <p>
                      <strong>Période :</strong> {c.dateDebut || "—"} au{" "}
                      {c.dateFin || "—"} · Préavis : {c.joursPreavis ?? 0}{" "}
                      jour(s)
                    </p>
                    <h4>Pièces jointes</h4>
                    {(documents[c.id] || []).length ? (
                      <Pagination
                        items={documents[c.id] || []}
                        resetKey={c.id}
                      >
                        {(visibleDocuments) => (
                      <ul className="validation-documents">
                        {visibleDocuments.map((doc) => (
                          <li key={doc.id}>
                            <span>
                              {doc.nomFichier}{" "}
                              <small>
                                (
                                {doc.categorie === "CONTRAT_SIGNE"
                                  ? "Contrat signé"
                                  : "Justificatif"}
                                )
                              </small>
                            </span>
                            <button type="button" onClick={() => download(doc)}>
                              Télécharger
                            </button>
                          </li>
                        ))}
                      </ul>
                        )}
                      </Pagination>
                    ) : (
                      <p>Aucune pièce jointe disponible.</p>
                    )}
                  </div>
                </details>
              )}
              {isHistory ? (
                <div className="validation-history-result">
                  <strong>Décision rendue :</strong>{" "}
                  {label[v.decision] || v.decision}
                  {v.dateValidation && (
                    <span> · {date(v.dateValidation)}</span>
                  )}
                  {v.commentaire && <p>{v.commentaire}</p>}
                </div>
              ) : (
                <>
                  <label className="validation-comment-label">
                    Commentaire (facultatif)
                    <textarea
                      value={comments[v.id] || ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [v.id]: e.target.value,
                        }))
                      }
                      rows="2"
                      placeholder="Motif de la décision ou modifications attendues"
                    />
                  </label>
                  <div className="validation-actions">
                    <button
                      disabled={busy === v.id}
                      onClick={() => decide(v, "APPROUVE")}
                    >
                      Approuver
                    </button>
                    <button
                      className="request"
                      disabled={busy === v.id}
                      onClick={() => decide(v, "MODIFICATION_DEMANDEE")}
                    >
                      Demander des modifications
                    </button>
                    <button
                      className="reject"
                      disabled={busy === v.id}
                      onClick={() => decide(v, "REJETE")}
                    >
                      Rejeter
                    </button>
                  </div>
                </>
              )}
            </article>
          );
          })}
        </Pagination>
      )}
    </div>
  );
}
