import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api.js";

const date = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "—");
const decisions = {
  EN_ATTENTE: "En attente",
  A_VENIR: "À venir",
  NON_REQUISE: "Non requise",
  APPROUVE: "Approuvé",
  REJETE: "Rejeté",
  MODIFICATION_DEMANDEE: "Modification demandée",
};
export default function ValidationsPage() {
  const [searchParams] = useSearchParams();
  const targetContractId = searchParams.get("contratId");
  const [rows, setRows] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      Promise.all([
        api.get("/validations"),
        api.get("/contrats"),
        api.get("/utilisateurs"),
      ])
        .then(([v, c, u]) => {
          setRows(v.data || []);
          setContracts(c.data || []);
          setUsers(u.data || []);
        })
        .catch(() =>
          setError("Impossible de charger l’historique des validations."),
        ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  const name = (id) =>
    users.find((u) => String(u.id) === String(id))?.matricule || "—";
  const contract = (id) => contracts.find((c) => String(c.id) === String(id));
  const displayedRows = targetContractId
    ? [
        ...rows.filter((row) => String(row.contratId) === targetContractId),
        ...rows.filter((row) => String(row.contratId) !== targetContractId),
      ]
    : rows;
  const search = query.trim().toLocaleLowerCase("fr");
  const filteredRows = displayedRows.filter((row) => {
    const linkedContract = contract(row.contratId);
    return (
      !search ||
      [
        linkedContract?.reference,
        linkedContract?.objet,
        row.contratId,
        name(row.demandeurId),
        name(row.valideurId),
        decisions[row.decision] || row.decision,
        row.niveau,
        row.cycle,
        row.commentaire,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(search)
    );
  });
  return (
    <div className="admin-data-page">
      <div className="admin-data-toolbar">
        <div>
          <h2>
            <i
              className="fa-solid fa-clipboard-check page-title-icon"
              aria-hidden="true"
            />
            Historique des validations
          </h2>
          <p>Consultation des décisions prises par les valideurs.</p>
        </div>
        <span>{filteredRows.length} décision(s)</span>
      </div>
      {targetContractId && (
        <p className="admin-info-panel">
          <i className="fa-solid fa-bell" />
          <span>
            Validations du contrat{" "}
            <strong>
              {contract(targetContractId)?.reference || `#${targetContractId}`}
            </strong>{" "}
            affichées en premier.
          </span>
        </p>
      )}
      <label className="audit-search">
        Rechercher
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Référence, matricule, décision, commentaire…"
          aria-label="Rechercher dans l’historique des validations"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Contrat</th>
              <th>Matricule demandeur</th>
              <th>Matricule valideur</th>
              <th>Niveau / cycle</th>
              <th>Décision</th>
              <th>Soumis le</th>
              <th>Traité le</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((v) => {
              const c = contract(v.contratId);
              return (
                <tr
                  key={v.id}
                  className={
                    String(v.contratId) === targetContractId
                      ? "notification-target"
                      : ""
                  }
                >
                  <td>
                    {c ? (
                      <>
                        <strong>{c.reference}</strong>
                        <small>{c.objet}</small>
                      </>
                    ) : (
                      `Contrat #${v.contratId}`
                    )}
                  </td>
                  <td>{name(v.demandeurId)}</td>
                  <td>{name(v.valideurId)}</td>
                  <td>
                    {v.niveau} / {v.cycle}
                  </td>
                  <td>
                    <span
                      className={`admin-decision ${v.decision === "EN_ATTENTE" ? "pending" : v.decision === "APPROUVE" ? "approved" : "rejected"}`}
                    >
                      {decisions[v.decision] || v.decision}
                    </span>
                  </td>
                  <td>{date(v.dateSoumission)}</td>
                  <td>{date(v.dateValidation)}</td>
                  <td>{v.commentaire || "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && !error && (
              <tr>
                <td colSpan="8" className="admin-empty">
                  Aucune validation enregistrée.
                </td>
              </tr>
            )}
            {rows.length > 0 && filteredRows.length === 0 && (
              <tr>
                <td colSpan="8" className="admin-empty">
                  Aucune validation ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
