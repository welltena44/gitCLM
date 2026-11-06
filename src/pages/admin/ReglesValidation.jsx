import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api.js";
import { getApiErrorMessage } from "../../services/apiError.js";
import Pagination from "../../composants/Pagination.jsx";
import { useFeedback } from "../../composants/FeedbackContext.jsx";
import "./DashboardAdmin.css";

export default function ReglesValidation() {
  const [searchParams] = useSearchParams();
  const targetRuleId = searchParams.get("regleId");
  const [regles, setRegles] = useState([]);
  const [typesContrat, setTypesContrat] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const { confirm, toast } = useFeedback();

  const initialFormState = {
    id: null,
    niveau: 1,
    roleRequis: "VALIDEUR",
    valideurId: "",
    typeContratId: "",
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchRegles();
    fetchTypesContrat();
    api.get("/utilisateurs")
      .then(({ data }) => setUtilisateurs(Array.isArray(data) ? data.filter((u) => ["VALIDEUR", "JURIDIQUE"].includes(u.role) && u.actif !== false) : []))
      .catch(() => setUtilisateurs([]));
  }, []);

  const fetchRegles = async () => {
    try {
      const { data } = await api.get("/regles-validation");
      setRegles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement règles :", e);
    }
  };

  const fetchTypesContrat = async () => {
    try {
      const { data } = await api.get("/types-contrat");
      setTypesContrat(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement types de contrat :", e);
    }
  };

  const handleOpenCreate = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      id: item.id,
      niveau: item.niveau,
      roleRequis: item.roleRequis,
      valideurId: item.valideurId ?? "",
      typeContratId: item.typeContratId ?? "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        niveau: Number(form.niveau),
        roleRequis: form.roleRequis,
        typeContratId:
          form.typeContratId === "" ? null : Number(form.typeContratId),
        valideurId: form.valideurId === "" ? null : Number(form.valideurId),
      };

      if (isEditing) await api.put(`/regles-validation/${form.id}`, payload);
      else await api.post("/regles-validation", payload);

      setShowModal(false);
      setForm(initialFormState);
      await fetchRegles();
      toast(isEditing ? "Règle mise à jour." : "Règle créée.");
    } catch (err) {
      toast(getApiErrorMessage(err, "Échec de l’enregistrement de la règle."), "error");
    }
  };

  const handleConfirm = async (id) => {
    const accepted = await confirm({
      title: "Activer cette règle de validation ?",
      message:
        "Le seuil défini par le Juridique sera activé et pourra s’appliquer aux contrats concernés.",
      confirmLabel: "Activer la règle",
    });
    if (!accepted) return;
    setConfirmingId(id);
    try {
      await api.post(`/regles-validation/${id}/confirmer`);
      await fetchRegles();
      toast("Le seuil est confirmé et la règle est active.");
    } catch (err) {
      toast(getApiErrorMessage(err, "Impossible de confirmer ce seuil."), "error");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDelete = async (id) => {
    const accepted = await confirm({
      title: "Supprimer cette règle ?",
      message: "Cette règle de validation sera supprimée définitivement.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!accepted) return;
    try {
      await api.delete(`/regles-validation/${id}`);
      await fetchRegles();
      toast("Règle de validation supprimée.");
    } catch (err) {
      toast(getApiErrorMessage(err, "Échec de la suppression de la règle."), "error");
    }
  };

  // Résout le nom du type de contrat lié à partir de son ID (ou affiche Global si null)
  const getValideurName = (id, role) => {
    const user = utilisateurs.find((u) => String(u.id) === String(id));
    return user
      ? [user.prenom, user.nom].filter(Boolean).join(" ") || user.email
      : id
        ? `Compte #${id}`
        : role === "VALIDEUR_ET_JURIDIQUE"
          ? "Tous les valideurs et juridiques actifs"
          : `Tout utilisateur actif avec le rôle ${role || "VALIDEUR"}`;
  };

  const getTypeName = (typeContratId) => {
    if (
      typeContratId === null ||
      typeContratId === undefined ||
      typeContratId === ""
    ) {
      return "🌍 Global (Tous types)";
    }
    const found = typesContrat.find((t) => t.id === Number(typeContratId));
    return found ? found.nom : `Type ID #${typeContratId}`;
  };

  return (
    <div className="admin-home">
      <div className="admin-page-header">
        <div>
          <span className="admin-home-eyebrow">ESPACE ADMINISTRATEUR</span>
          <h2>
            <i className="fa-solid fa-list-check page-title-icon" aria-hidden="true" />
            Configuration des circuits de validation
          </h2>
          <p>Créez les étapes, niveaux et responsables du circuit. Le Juridique définit ensuite les seuils; vous confirmez leur activation.</p>
        </div>
        <div className="admin-page-actions">
          <button
            onClick={handleOpenCreate}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className="fa-solid fa-plus"></i> Ajouter une règle
          </button>
        </div>
      </div>

      <div
        className="stat-card admin-table-surface"
        style={{ marginTop: "20px", padding: "0", overflowX: "auto" }}
      >
        <Pagination items={regles} resetKey={targetRuleId}>
          {(visibleRules) => (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "850px",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Type de Contrat (Relation)</th>
              <th>État du seuil</th>
              <th>Niveau</th>
              <th>Rôle requis</th>
              <th>Valideur ciblé</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {regles.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#64748b",
                  }}
                >
                  Aucune règle de validation configurée pour l'instant.
                </td>
              </tr>
            ) : (
              visibleRules.map((r) => (
                <tr
                  key={r.id}
                  className={
                    String(r.id) === targetRuleId ? "notification-target" : ""
                  }
                  style={{ borderTop: "1px solid #eee" }}
                >
                  <td style={{ padding: "12px", fontWeight: "bold" }}>
                    {r.id}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                        background: r.typeContratId ? "#f1f5f9" : "#e0f2fe",
                        color: r.typeContratId ? "#334155" : "#0369a1",
                      }}
                    >
                      {getTypeName(r.typeContratId)}
                    </span>
                  </td>
                  <td>
                    {r.statut === "ACTIVE"
                      ? "Confirmé"
                      : r.statut === "EN_ATTENTE_CONFIRMATION"
                        ? "À confirmer"
                        : "À définir par le Juridique"}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "3px 8px",
                        background: "#fef3c7",
                        color: "#92400e",
                        borderRadius: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      Niveau {r.niveau}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "3px 8px",
                        background: "#f1f5f9",
                        color: "#1e293b",
                        borderRadius: "6px",
                        fontWeight: "600",
                      }}
                    >
                      {r.roleRequis}
                    </span>
                  </td>
                  <td>{getValideurName(r.valideurId, r.roleRequis)}</td>
                  <td
                    style={{
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "12px",
                    }}
                  >
                    {r.statut === "EN_ATTENTE_CONFIRMATION" && (
                      <button
                        type="button"
                        disabled={confirmingId === r.id}
                        onClick={() => handleConfirm(r.id)}
                        style={{
                          color: "#16734a",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                        title="Confirmer le seuil"
                        aria-label={`Confirmer le seuil de la règle ${r.id}`}
                      >
                        <i className="fa-solid fa-check" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(r)}
                      style={{
                        color: "#2563eb",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                      title="Modifier"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        color: "#dc2626",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                      title="Supprimer"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          )}
        </Pagination>
      </div>

      {/* Modal Création / Modification */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              width: "480px",
              maxWidth: "100%",
            }}
          >
            <h3 style={{ marginBottom: "16px" }}>
              {isEditing
                ? "Modifier la règle"
                : "Ajouter une règle de validation"}
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#475569",
                }}
              >
                Type de contrat
              </label>
              <select
                value={form.typeContratId}
                onChange={(e) =>
                  setForm({ ...form, typeContratId: e.target.value })
                }
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "white",
                }}
              >
                <option value="">🌍 Global (Tous types)</option>
                {typesContrat.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Niveau de validation
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.niveau}
                  onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    margin: "4px 0 12px 0",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Rôle Requis
                </label>
                <select
                  value={form.roleRequis}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      roleRequis: e.target.value,
                      valideurId:
                        form.roleRequis === e.target.value
                          ? form.valideurId
                          : "",
                    })
                  }
                  style={{
                    width: "100%",
                    margin: "4px 0 12px 0",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    background: "white",
                  }}
                >
                  <option value="VALIDEUR">VALIDEUR</option>
                  <option value="VALIDEUR_ET_JURIDIQUE">
                    VALIDEUR + JURIDIQUE (les deux accords)
                  </option>
                  <option value="JURIDIQUE">JURIDIQUE</option>
                </select>
              </div>
            </div>
            {form.roleRequis !== "JURIDIQUE" && (
              <>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Valideur chargé de cette étape
                  {form.roleRequis === "VALIDEUR_ET_JURIDIQUE"
                    ? " (obligatoire)"
                    : " (facultatif)"}
                </label>
                <select
                  required={form.roleRequis === "VALIDEUR_ET_JURIDIQUE"}
                  value={form.valideurId}
                  onChange={(e) =>
                    setForm({ ...form, valideurId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    margin: "4px 0 12px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    background: "white",
                  }}
                >
                  <option value="">
                    {form.roleRequis === "VALIDEUR_ET_JURIDIQUE"
                      ? "Choisir le valideur…"
                      : "Tous les utilisateurs actifs avec ce rôle"}
                  </option>
                  {utilisateurs
                    .filter(
                      (u) =>
                        u.role ===
                        (form.roleRequis === "VALIDEUR_ET_JURIDIQUE"
                          ? "VALIDEUR"
                          : form.roleRequis),
                    )
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {[u.prenom, u.nom].filter(Boolean).join(" ") ||
                          u.email ||
                          `Compte #${u.id}`}
                      </option>
                    ))}
                </select>
                {form.roleRequis === "VALIDEUR_ET_JURIDIQUE" && (
                  <small style={{ color: "#64748b" }}>
                    Le valideur choisi et les utilisateurs Juridiques actifs
                    recevront chacun une demande; les deux accords sont requis.
                  </small>
                )}
              </>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {isEditing ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
