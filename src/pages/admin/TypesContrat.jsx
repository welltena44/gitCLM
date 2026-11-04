import { useState, useEffect, useCallback } from "react";
import api from "../../services/api.js";
import { getApiErrorMessage } from "../../services/apiError.js";
import Pagination from "../../composants/Pagination.jsx";
import { useFeedback } from "../../composants/FeedbackContext.jsx";
import "./DashboardAdmin.css";

export default function TypesContrat() {
  const { confirm, toast } = useFeedback();
  const [types, setTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState = {
    id: null,
    nom: "",
    description: "",
    actif: true,
  };

  const [form, setForm] = useState(initialFormState);

  const fetchTypes = useCallback(async () => {
    try {
      const { data } = await api.get("/types-contrat");
      setTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur lors du chargement des types de contrats :", e);
      toast(
        "Impossible de charger les types de contrats.",
        "error",
      );
    }
  }, [toast]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleOpenCreate = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      id: item.id,
      nom: item.nom,
      description: item.description || "",
      actif: item.actif,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.nom?.trim()) throw new Error("Le nom du type de contrat est obligatoire.");
      const payload = { ...form, nom: form.nom.trim(), description: form.description?.trim() || "" };
      if (isEditing) await api.put(`/types-contrat/${form.id}`, payload);
      else await api.post("/types-contrat", payload);

      setShowModal(false);
      setForm(initialFormState);
      await fetchTypes();
      toast(isEditing ? "Type de contrat mis à jour." : "Type de contrat créé.");
    } catch (err) {
      toast(getApiErrorMessage(err, "Échec de l’enregistrement du type de contrat."), "error");
    }
  };

  const handleDelete = async (id) => {
    const accepted = await confirm({
      title: "Supprimer ce type de contrat ?",
      message: "La suppression peut être refusée si ce type est utilisé par des contrats ou des règles. Si possible, désactivez-le plutôt.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!accepted) return;
    try {
      await api.delete(`/types-contrat/${id}`);
      await fetchTypes();
      toast("Type de contrat supprimé.");
    } catch (err) {
      toast(getApiErrorMessage(err, "Échec de la suppression du type de contrat."), "error");
    }
  };

  return (
    <div className="admin-home">
      <div className="admin-page-header">
        <div>
          <h2>
            <i
              className="fa-solid fa-file-contract page-title-icon"
              aria-hidden="true"
            />
            Gestion des types de contrats
          </h2>
          <p className="subtitle">
            Administrez les catégories et descriptions des contrats de
            l'entreprise
          </p>
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
            <i className="fa-solid fa-plus"></i> Créer un type
          </button>
        </div>
      </div>

      <div
        className="stat-card admin-table-surface"
        style={{ marginTop: "20px", padding: "0", overflowX: "auto" }}
      >
        <Pagination items={types}>
          {(visibleTypes) => (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "700px",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Nom du Type</th>
              <th>Description</th>
              <th>Statut</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#64748b",
                  }}
                >
                  Aucun type de contrat trouvé dans la base de données.
                </td>
              </tr>
            ) : (
              visibleTypes.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>
                    {t.id}
                  </td>
                  <td style={{ padding: "12px" }}>{t.nom}</td>
                  <td style={{ color: "#64748b" }}>{t.description || "-"}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        background: t.actif ? "#dcfce7" : "#fee2e2",
                        color: t.actif ? "#166534" : "#991b1b",
                      }}
                    >
                      {t.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "12px",
                    }}
                  >
                    <button
                      onClick={() => handleOpenEdit(t)}
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
                      onClick={() => handleDelete(t.id)}
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
              width: "450px",
              maxWidth: "100%",
            }}
          >
            <h3 style={{ marginBottom: "16px" }}>
              {isEditing
                ? "Modifier le type de contrat"
                : "Créer un type de contrat"}
            </h3>

            <label
              style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}
            >
              Nom du type
            </label>
            <input
              placeholder="Ex: Prestation de services"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
              style={{
                width: "100%",
                margin: "4px 0 12px 0",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />

            <label
              style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}
            >
              Description
            </label>
            <textarea
              placeholder="Description détaillée..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows="3"
              style={{
                width: "100%",
                margin: "4px 0 12px 0",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "8px 0 16px 0",
              }}
            >
              <input
                type="checkbox"
                id="actifTypeCheck"
                checked={form.actif}
                onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label
                htmlFor="actifTypeCheck"
                style={{ fontSize: "14px", cursor: "pointer" }}
              >
                Type actif
              </label>
            </div>

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
