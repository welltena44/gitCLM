import { useState } from "react";
import Pagination from "../../composants/Pagination.jsx";
import "./Validation.css";

const label = {
  EN_ATTENTE: "En attente",
  EN_VALIDATION: "En validation",
  APPROUVE: "Approuvé",
  REJETE: "Rejeté",
  MODIFICATION_DEMANDEE: "Modification demandée",
  A_VENIR: "À venir",
  NON_REQUISE: "Non requise",
};

const date = (value) =>
  value ? new Date(value).toLocaleString("fr-FR") : "—";

export default function ValidationCard({
  v,
  contract,
  amendment,
  documents,
  documentsLoading,
  isHistory,
  busy,
  comments,
  onCommentChange,
  onDecide,
  onDownload,
  onToggleDetails,
  selectedContractId,
}) {
  const [docError, setDocError] = useState("");

  const handleDownload = async (doc) => {
    setDocError("");
    try {
      await onDownload(doc);
    } catch (e) {
      setDocError(
        e.response?.data?.message ||
          "Impossible de télécharger la pièce jointe.",
      );
    }
  };

  return (
    <article
      className={`validation-card ${
        String(v.contratId) === selectedContractId ? "notification-target" : ""
      }`}
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
              : `${contract?.reference || `Contrat #${v.contratId}`} — ${
                  contract?.objet || "Dossier contractuel"
                }`}
          </h3>
        </div>
        <span className="validation-state">{label[v.decision]}</span>
      </header>
      {amendment && (
        <div className="validation-amendment-detail">
          <strong>Examen d’un avenant</strong>
          <p>
            {amendment.modifications ||
              amendment.description ||
              "Aucun détail complémentaire."}
          </p>
          <p>
            <span>Statut de l’avenant : </span>
            {label[amendment.statut] || amendment.statut || "En validation"}
            {amendment.cycleValidation ? ` · Cycle ${amendment.cycleValidation}` : ""}
          </p>
          <p>
            Montant : {amendment.montantAvant ?? "—"} →{" "}
            {amendment.montantApres ?? "—"} {contract?.devise || "Ar"}
            {amendment.dateFinApres
              ? ` · Nouvelle échéance : ${amendment.dateFinApres}`
              : ""}
          </p>
        </div>
      )}
      {contract && (
        <dl className="validation-details">
          <div>
            <dt>Montant</dt>
            <dd>
              {Number(contract.montant || 0).toLocaleString("fr-FR")}{" "}
              {contract.devise || "Ar"}
            </dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>{contract.service || "—"}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{contract.statut || "—"}</dd>
          </div>
          <div>
            <dt>Soumis le</dt>
            <dd>{date(v.dateSoumission)}</dd>
          </div>
        </dl>
      )}
      {contract && !isHistory && (
        <details
          className="validation-contract-detail"
          onToggle={(e) => {
            if (e.target.open && onToggleDetails && contract?.id) {
              onToggleDetails(contract.id);
            }
          }}
        >
          <summary>
            {amendment
              ? "Consulter le contrat d’origine et ses pièces"
              : "Consulter le dossier contractuel"}
          </summary>
          <div>
            <p>
              <strong>Description : </strong>
              {contract.description || "Aucune description renseignée."}
            </p>
            <p>
              <strong>Clauses clés : </strong>
              {contract.clauses || "Aucune clause clé renseignée."}
            </p>
            <p>
              <strong>Période : </strong> {contract.dateDebut || "—"} au{" "}
              {contract.dateFin || "—"} · Préavis :{" "}
              {contract.joursPreavis ?? 0} jour(s)
            </p>
            <h4>Pièces jointes</h4>
            {documentsLoading ? (
              <p>Chargement des pièces jointes…</p>
            ) : docError ? (
              <p className="validation-error">{docError}</p>
            ) : (documents[contract.id] || []).length ? (
              <Pagination items={documents[contract.id] || []}>
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
                        <button type="button" onClick={() => handleDownload(doc)}>
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
          <strong>Décision rendue : </strong>
          {label[v.decision] || v.decision}
          {v.dateValidation && <span> · {date(v.dateValidation)}</span>}
          {v.commentaire && <p>{v.commentaire}</p>}
        </div>
      ) : (
        <>
          <label className="validation-comment-label">
            Commentaire (facultatif)
            <textarea
              value={comments[v.id] || ""}
              onChange={(e) => onCommentChange(v.id, e.target.value)}
              rows="2"
              placeholder="Motif de la décision ou modifications attendues"
            />
          </label>
          <div className="validation-actions">
            <button
              disabled={busy === v.id}
              onClick={() => onDecide(v, "APPROUVE")}
            >
              Approuver
            </button>
            <button
              className="request"
              disabled={busy === v.id}
              onClick={() => onDecide(v, "MODIFICATION_DEMANDEE")}
            >
              Demander des modifications
            </button>
            <button
              className="reject"
              disabled={busy === v.id}
              onClick={() => onDecide(v, "REJETE")}
            >
              Rejeter
            </button>
          </div>
        </>
      )}
    </article>
  );
}