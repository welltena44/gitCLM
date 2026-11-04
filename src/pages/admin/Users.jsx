import { useState, useEffect, useCallback } from "react";
import api from "../../services/api.js";
import { getApiErrorMessage } from "../../services/apiError.js";
import Pagination from "../../composants/Pagination.jsx";
import { useFeedback } from "../../composants/FeedbackContext.jsx";
import "./DashboardAdmin.css";
import "./Users.css";


const initialFormState = {
  matricule: "",
  nom: "",
  prenom: "",
  email: "",
  motDePasse: "",
  role: "GESTIONNAIRE",
  service: "",
  actif: true,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  margin: "4px 0 12px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#475569",
};

export default function Users() {
  const { confirm } = useFeedback();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...initialFormState });
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const { data } = await api.get("/utilisateurs");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      showNotification(
        "error",
        `Impossible de charger les utilisateurs : ${getApiErrorMessage(error)}`,
      );
      throw error;
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers().catch(() => {});
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setForm({ ...initialFormState });
    setEditingId(null);
    setIsEditing(false);
    showNotification(
      "info",
      "Création utilisateur : renseignez les informations du compte.",
    );
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingId(user.id);

    setForm({
      matricule: user.matricule == null ? "" : String(user.matricule),
      nom: user.nom ?? "",
      prenom: user.prenom ?? "",
      email: user.email ?? "",
      motDePasse: "",
      role: user.role ?? "GESTIONNAIRE",
      service: user.service ?? "",
      actif: user.actif ?? true,
    });

    setIsEditing(true);
    showNotification(
      "info",
      "Modification utilisateur : vérifiez les informations avant d’enregistrer.",
    );
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setFeedback({
      type: "info",
      message: isEditing
        ? "Modification en cours, notification e-mail en préparation…"
        : "Création en cours, e-mail de bienvenue en préparation…",
    });

    try {
      const matriculeText = String(form.matricule).trim();
      const nom = form.nom.trim();
      const prenom = form.prenom.trim();
      const email = form.email.trim();
      const motDePasse = form.motDePasse;

      if (!matriculeText || !nom || !prenom || !email) {
        throw new Error("Veuillez remplir tous les champs obligatoires.");
      }

      // L'entité Java attend un Integer pour le matricule.
      if (!/^\d+$/.test(matriculeText)) {
        throw new Error("Le matricule doit contenir uniquement des chiffres.");
      }

      const matricule = Number(matriculeText);

      if (
        !Number.isSafeInteger(matricule) ||
        matricule <= 0 ||
        matricule > 2147483647
      ) {
        throw new Error("Le matricule doit être un entier positif valide.");
      }

      const payload = {
        matricule,
        nom,
        prenom,
        email,
        role: form.role,
        service: form.service.trim() || null,
        actif: form.actif,
      };

      // Le mot de passe est envoyé uniquement s'il est renseigné.
      if (motDePasse.trim()) {
        payload.motDePasse = motDePasse;
      }

      // IMPORTANT :
      // - POST : l'id est généré par la base de données.
      // - PUT : l'id technique est transmis dans l'URL.
      if (isEditing) await api.put(`/utilisateurs/${encodeURIComponent(editingId)}`, payload);
      else await api.post("/utilisateurs", payload);

      setShowModal(false);
      setForm({ ...initialFormState });
      setEditingId(null);

      showNotification(
        "success",
        isEditing
          ? "Utilisateur modifié. La notification e-mail est envoyée si le serveur mail est disponible."
          : "Utilisateur créé. L’e-mail de bienvenue est envoyé si le serveur mail est disponible.",
      );

      try {
        await fetchUsers();
      } catch {
        // L'erreur de rechargement est déjà affichée.
      }
    } catch (error) {
      showNotification("error", getApiErrorMessage(error, "Échec de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, matricule) => {
    if (deletingId !== null || saving) return;

    const confirmation = await confirm({
      title: "Supprimer cet utilisateur ?",
      message: `Le compte de matricule ${matricule} sera supprimé.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!confirmation) return;

    setDeletingId(id);
    setFeedback({
      type: "info",
      message: "Suppression en cours, e-mail de notification en préparation…",
    });

    try {
      await api.delete(`/utilisateurs/${encodeURIComponent(id)}`);

      setUsers((currentUsers) =>
        currentUsers.filter((user) => String(user.id) !== String(id)),
      );

      showNotification(
        "success",
        "Utilisateur supprimé et e-mail de notification envoyé.",
      );

      try {
        await fetchUsers();
      } catch {
        // La suppression a déjà été effectuée.
      }
    } catch (error) {
      showNotification(
        "error",
        getApiErrorMessage(error, "Erreur lors de la suppression."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const query = searchTerm.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    [
      user.matricule,
      user.nom,
      user.prenom,
      user.email,
      user.service,
      user.role,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(query),
    ),
  );

  return (
    <div className="admin-home users-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2>
          <i
            className="fa-solid fa-users page-title-icon"
            aria-hidden="true"
          />
          Gestion des utilisateurs
        </h2>

        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={saving || deletingId !== null}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          <i className="fa-solid fa-plus" /> Créer un utilisateur
        </button>
      </div>

      {feedback.message && (
        <div role="status" className={`users-feedback ${feedback.type}`}>
          <i
            className={`fa-solid ${
              feedback.type === "success"
                ? "fa-circle-check"
                : feedback.type === "info"
                  ? "fa-circle-info"
                  : "fa-triangle-exclamation"
            }`}
            style={{ marginRight: "8px" }}
          />
          {feedback.message}
        </div>
      )}

      <div className="users-search">
        <i
          className="fa-solid fa-magnifying-glass"
          style={{ color: "#94a3b8" }}
        />

        <input
          type="text"
          placeholder="Rechercher par matricule, nom, prénom, email ou service..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: "14px",
            background: "transparent",
          }}
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            title="Effacer la recherche"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      <div className="stat-card users-table-card">
        <Pagination items={filteredUsers} resetKey={searchTerm}>
          {(visibleUsers) => (
        <table className="users-table">
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>Matricule</th>
              <th style={{ padding: "12px" }}>Nom & Prénom</th>
              <th style={{ padding: "12px" }}>Email</th>
              <th style={{ padding: "12px" }}>Rôle</th>
              <th style={{ padding: "12px" }}>Service</th>
              <th style={{ padding: "12px" }}>Statut</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loadingUsers ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Chargement des utilisateurs...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#64748b",
                  }}
                >
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>
                    {user.matricule}
                  </td>

                  <td style={{ padding: "12px" }}>
                    {user.nom} {user.prenom}
                  </td>

                  <td style={{ padding: "12px" }}>{user.email}</td>

                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background:
                          user.role === "ADMIN"
                            ? "#fee2e2"
                            : user.role === "VALIDEUR"
                              ? "#fef3c7"
                              : user.role === "JURIDIQUE"
                                ? "#e0e7ff"
                                : "#dcfce7",
                        color:
                          user.role === "ADMIN"
                            ? "#991b1b"
                            : user.role === "VALIDEUR"
                              ? "#92400e"
                              : user.role === "JURIDIQUE"
                                ? "#3730a3"
                                : "#166534",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td style={{ padding: "12px" }}>{user.service || "-"}</td>

                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        background: user.actif ? "#dcfce7" : "#fee2e2",
                        color: user.actif ? "#166534" : "#991b1b",
                      }}
                    >
                      {user.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  <td
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      disabled={deletingId !== null || saving}
                      title="Modifier"
                      style={{
                        color: "#2563eb",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        marginRight: "12px",
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(user.id, user.matricule)}
                      disabled={deletingId !== null || saving}
                      title="Supprimer"
                      style={{
                        color: "#dc2626",
                        background: "none",
                        border: "none",
                        cursor: deletingId === user.id ? "wait" : "pointer",
                        fontSize: "16px",
                      }}
                    >
                      <i
                        className={
                          deletingId === user.id
                            ? "fa-solid fa-spinner fa-spin"
                            : "fa-solid fa-trash"
                        }
                      />
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

      {showModal && (
        <div className="users-modal-backdrop">
          <form onSubmit={handleSubmit} className="users-modal">
            <h3 style={{ marginBottom: "16px" }}>
              {isEditing ? "Modifier l'utilisateur" : "Créer un utilisateur"}
            </h3>

            <label style={labelStyle}>Matricule *</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ex. : 1001"
              value={form.matricule}
              onChange={(event) =>
                setForm({ ...form, matricule: event.target.value })
              }
              required
              disabled={saving}
              style={inputStyle}
            />

            <label style={labelStyle}>Nom *</label>
            <input
              placeholder="Nom"
              value={form.nom}
              onChange={(event) =>
                setForm({ ...form, nom: event.target.value })
              }
              required
              disabled={saving}
              style={inputStyle}
            />

            <label style={labelStyle}>Prénom *</label>
            <input
              placeholder="Prénom"
              value={form.prenom}
              onChange={(event) =>
                setForm({ ...form, prenom: event.target.value })
              }
              required
              disabled={saving}
              style={inputStyle}
            />

            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              placeholder="Email professionnel"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
              disabled={saving}
              style={inputStyle}
            />

            {isEditing ? (
              <>
                <label style={labelStyle}>Réinitialiser le mot de passe</label>
                <input
                  type="checkbox"
                  checked={Boolean(form.motDePasse)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      motDePasse: event.target.checked ? "reset" : "",
                    })
                  }
                  disabled={saving}
                  style={{ ...inputStyle, width: "18px" }}
                />
                <small style={{ display: "block", marginBottom: 12 }}>
                  Un mot de passe provisoire de 8 caractères sera envoyé par
                  e-mail.
                </small>
              </>
            ) : (
              <p>
                Un mot de passe provisoire de 8 caractères sera généré et envoyé
                par e-mail.
              </p>
            )}

            <label style={labelStyle}>Rôle *</label>
            <select
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
              disabled={saving}
              style={inputStyle}
            >
              <option value="ADMIN">ADMIN - Accès complet</option>
              <option value="GESTIONNAIRE">
                GESTIONNAIRE - Crée les contrats
              </option>
              <option value="VALIDEUR">VALIDEUR - Approuve / Rejette</option>
              <option value="JURIDIQUE">JURIDIQUE - Service juridique</option>
            </select>

            <label style={labelStyle}>Service</label>
            <input
              placeholder="Ex. : Ressources humaines"
              value={form.service}
              onChange={(event) =>
                setForm({ ...form, service: event.target.value })
              }
              disabled={saving}
              style={inputStyle}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "8px 0 16px",
              }}
            >
              <input
                type="checkbox"
                id="actifCheck"
                checked={form.actif}
                onChange={(event) =>
                  setForm({ ...form, actif: event.target.checked })
                }
                disabled={saving}
                style={{ width: "18px", height: "18px" }}
              />
              <label htmlFor="actifCheck" style={{ fontSize: "14px" }}>
                Utilisateur actif
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setShowModal(false);
                    setForm({ ...initialFormState });
                    setEditingId(null);
                  }
                }}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  background: saving ? "#94a3b8" : "#2563eb",
                  color: "white",
                  border: "none",
                  cursor: saving ? "wait" : "pointer",
                  fontWeight: "500",
                }}
              >
                {saving
                  ? "Traitement en cours..."
                  : isEditing
                    ? "Enregistrer"
                    : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
