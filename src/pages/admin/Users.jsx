
import { useState, useEffect, useCallback } from "react";
import "./DashboardAdmin.css";

const API_URL = "http://localhost:8080/api/utilisateurs";

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

function getHeaders(json = false) {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function readError(response) {
  const text = await response.text();

  if (!text) {
    return `Erreur HTTP ${response.status}`;
  }

  try {
    const data = JSON.parse(text);
    return data.message || data.error || text;
  } catch {
    return text;
  }
}

export default function Users() {
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
      const response = await fetch(API_URL, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      showNotification(
        "error",
        `Impossible de charger les utilisateurs : ${error.message}`
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
    setFeedback({ type: "", message: "" });
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
    setFeedback({ type: "", message: "" });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const matriculeText = String(form.matricule).trim();
      const nom = form.nom.trim();
      const prenom = form.prenom.trim();
      const email = form.email.trim();
      const motDePasse = form.motDePasse;

      if (!matriculeText || !nom || !prenom || !email) {
        throw new Error(
          "Veuillez remplir tous les champs obligatoires."
        );
      }

      // L'entité Java attend un Integer pour le matricule.
      if (!/^\d+$/.test(matriculeText)) {
        throw new Error(
          "Le matricule doit contenir uniquement des chiffres."
        );
      }

      const matricule = Number(matriculeText);

      if (
        !Number.isSafeInteger(matricule) ||
        matricule <= 0 ||
        matricule > 2147483647
      ) {
        throw new Error(
          "Le matricule doit être un entier positif valide."
        );
      }

      if (!isEditing && !motDePasse.trim()) {
        throw new Error(
          "Le mot de passe est obligatoire pour créer un compte."
        );
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
      const url = isEditing
        ? `${API_URL}/${encodeURIComponent(editingId)}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setShowModal(false);
      setForm({ ...initialFormState });
      setEditingId(null);

      showNotification(
        "success",
        isEditing
          ? "Utilisateur modifié avec succès."
          : "Utilisateur créé avec succès."
      );

      try {
        await fetchUsers();
      } catch {
        // L'erreur de rechargement est déjà affichée.
      }
    } catch (error) {
      showNotification(
        "error",
        error.message || "Échec de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, matricule) => {
    if (deletingId !== null || saving) return;

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer l'utilisateur de matricule ${matricule} ?`
    );

    if (!confirmation) return;

    setDeletingId(id);
    setFeedback({ type: "", message: "" });

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => String(user.id) !== String(id)
        )
      );

      showNotification(
        "success",
        "Utilisateur supprimé avec succès."
      );

      try {
        await fetchUsers();
      } catch {
        // La suppression a déjà été effectuée.
      }
    } catch (error) {
      showNotification(
        "error",
        error.message || "Erreur lors de la suppression."
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
      String(value ?? "").toLowerCase().includes(query)
    )
  );

  return (
    <div className="admin-home">
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
          <i className="fa-solid fa-users" /> Gestion des utilisateurs
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
        <div
          role="status"
          style={{
            marginTop: "15px",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            background:
              feedback.type === "success" ? "#dcfce7" : "#fee2e2",
            color:
              feedback.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${
              feedback.type === "success" ? "#bbf7d0" : "#fecaca"
            }`,
          }}
        >
          <i
            className={`fa-solid ${
              feedback.type === "success"
                ? "fa-circle-check"
                : "fa-triangle-exclamation"
            }`}
            style={{ marginRight: "8px" }}
          />
          {feedback.message}
        </div>
      )}

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          background: "white",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          gap: "10px",
        }}
      >
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

      <div
        className="stat-card"
        style={{
          marginTop: "20px",
          padding: "0",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "800px",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>Matricule</th>
              <th style={{ padding: "12px" }}>Nom & Prénom</th>
              <th style={{ padding: "12px" }}>Email</th>
              <th style={{ padding: "12px" }}>Rôle</th>
              <th style={{ padding: "12px" }}>Service</th>
              <th style={{ padding: "12px" }}>Statut</th>
              <th style={{ padding: "12px", textAlign: "center" }}>
                Actions
              </th>
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
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  style={{ borderTop: "1px solid #eee" }}
                >
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

                  <td style={{ padding: "12px" }}>
                    {user.service || "-"}
                  </td>

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
                      onClick={() =>
                        handleDelete(user.id, user.matricule)
                      }
                      disabled={deletingId !== null || saving}
                      title="Supprimer"
                      style={{
                        color: "#dc2626",
                        background: "none",
                        border: "none",
                        cursor:
                          deletingId === user.id ? "wait" : "pointer",
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
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              width: "450px",
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ marginBottom: "16px" }}>
              {isEditing
                ? "Modifier l'utilisateur"
                : "Créer un utilisateur"}
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

            <label style={labelStyle}>
              Mot de passe *
              {isEditing &&
                " (laisser vide pour conserver le mot de passe actuel)"}
            </label>
            <input
              type="password"
              placeholder={
                isEditing
                  ? "Nouveau mot de passe (facultatif)"
                  : "Mot de passe provisoire"
              }
              value={form.motDePasse}
              onChange={(event) =>
                setForm({ ...form, motDePasse: event.target.value })
              }
              required={!isEditing}
              disabled={saving}
              autoComplete="new-password"
              style={inputStyle}
            />

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
              <option value="VALIDEUR">
                VALIDEUR - Approuve / Rejette
              </option>
              <option value="JURIDIQUE">
                JURIDIQUE - Service juridique
              </option>
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
