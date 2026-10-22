import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../services/api.js";
import "./DashboardAdmin.css";

export default function ReglesValidation() {
  const [regles, setRegles] = useState([]);
  const [typesContrat, setTypesContrat] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState = {
    id: null,
    niveau: 1,
    roleRequis: "VALIDEUR",
    valideurId: ""
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchRegles();
    fetchTypesContrat();
    fetch(`${API_BASE_URL}/utilisateurs`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } })
      .then(r => r.ok ? r.json() : []).then(data => setUtilisateurs(Array.isArray(data) ? data.filter(u => u.role === "VALIDEUR" && u.actif !== false) : [])).catch(() => setUtilisateurs([]));
  }, []);

  const fetchRegles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/regles-validation`, {
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Échec du chargement des règles de validation");
      const data = await res.json();
      setRegles(data);
    } catch (e) {
      console.error("Erreur chargement règles :", e);
    }
  };

  const fetchTypesContrat = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/types-contrat`, {
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTypesContrat(data);
      }
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
      roleRequis: item.roleRequis
      ,valideurId: item.valideurId ?? ""
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `${API_BASE_URL}/regles-validation/${form.id}`
        : `${API_BASE_URL}/regles-validation`;
      
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...form,
        typeContratId: null,
        montantMinimum: 0,
        montantMaximum: null,
        niveau: Number(form.niveau)
        ,valideurId: form.valideurId === "" ? null : Number(form.valideurId), roleRequis: "VALIDEUR"
      };

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Échec de l'enregistrement");
      }

      setShowModal(false);
      setForm(initialFormState);
      fetchRegles();
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette règle de validation ?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/regles-validation/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`
        }
      });
      if (!res.ok) throw new Error("Échec de la suppression");
      fetchRegles();
    } catch (err) {
      alert("Erreur suppression: " + err.message);
    }
  };

  // Résout le nom du type de contrat lié à partir de son ID (ou affiche Global si null)
  const getValideurName = (id) => { const user = utilisateurs.find(u => String(u.id) === String(id)); return user ? ([user.prenom, user.nom].filter(Boolean).join(" ") || user.email) : (id ? `Compte #${id}` : "Tout valideur actif"); };

  const getTypeName = (typeContratId) => {
    if (typeContratId === null || typeContratId === undefined || typeContratId === "") {
      return "🌍 Global (Tous types)";
    }
    const found = typesContrat.find(t => t.id === Number(typeContratId));
    return found ? found.nom : `Type ID #${typeContratId}`;
  };

  return (
    <div className="admin-home">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2><i className="fa-solid fa-list-check"></i> Configuration des circuits de validation</h2>
          <p className="subtitle">Configurez les étapes des circuits : niveau et rôle chargé de valider. Les seuils relèvent de l’espace Juridique.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          style={{ background: "#2563eb", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fa-solid fa-plus"></i> Ajouter une règle
        </button>
      </div>

      <div className="stat-card" style={{ marginTop: "20px", padding: "0", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Type de Contrat (Relation)</th>
              <th>Montant Min (MGA)</th>
              <th>Montant Max (MGA)</th>
              <th>Niveau</th>
              <th>Rôle requis</th>
              <th>Valideur ciblé</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {regles.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                  Aucune règle de validation configurée pour l'instant.
                </td>
              </tr>
            ) : (
              regles.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>{r.id}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "500",
                      background: r.typeContratId ? "#f1f5f9" : "#e0f2fe",
                      color: r.typeContratId ? "#334155" : "#0369a1"
                    }}>
                      {getTypeName(r.typeContratId)}
                    </span>
                  </td>
                  <td>{Number(r.montantMinimum).toLocaleString()} Ar</td>
                  <td>{r.montantMaximum ? `${Number(r.montantMaximum).toLocaleString()} Ar` : "Illimité (∞)"}</td>
                  <td>
                    <span style={{ padding: "3px 8px", background: "#fef3c7", color: "#92400e", borderRadius: "6px", fontWeight: "bold" }}>
                      Niveau {r.niveau}
                    </span>
                  </td>
                  <td>
                    <span style={{ padding: "3px 8px", background: "#f1f5f9", color: "#1e293b", borderRadius: "6px", fontWeight: "600" }}>
                      VALIDEUR
                    </span>
                  </td>
                  <td>{getValideurName(r.valideurId)}</td>
                  <td style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: "12px", padding: "12px" }}>
                    <button 
                      onClick={() => handleOpenEdit(r)} 
                      style={{ color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                      title="Modifier"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id)} 
                      style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
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
      </div>

      {/* Modal Création / Modification */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <form onSubmit={handleSubmit} style={{ background: "white", padding: "24px", borderRadius: "16px", width: "480px", maxWidth: "100%" }}>
            <h3 style={{ marginBottom: "16px" }}>{isEditing ? "Modifier la règle" : "Ajouter une règle de validation"}</h3>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Niveau de validation</label>
                <input 
                  type="number" 
                  min="1" 
                  value={form.niveau} 
                  onChange={e => setForm({...form, niveau: e.target.value})} 
                  required 
                  style={{ width: "100%", margin: "4px 0 12px 0", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Rôle Requis</label>
                <select 
                  value={form.roleRequis} 
                  onChange={e => setForm({...form, roleRequis: e.target.value})}
                  style={{ width: "100%", margin: "4px 0 12px 0", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white" }}
                >
                  <option value="VALIDEUR">VALIDEUR</option>
                </select>
              </div>
            </div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569" }}>Valideur ciblé (facultatif)</label>
            <select value={form.valideurId} onChange={e => setForm({...form,valideurId:e.target.value})} style={{ width: "100%", margin: "4px 0 12px", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white" }}>
              <option value="">Tout valideur disponible</option>{utilisateurs.map(u => <option key={u.id} value={u.id}>{[u.prenom,u.nom].filter(Boolean).join(" ") || u.email || `Compte #${u.id}`}</option>)}
            </select>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#2563eb", color: "white", border: "none", cursor: "pointer", fontWeight: "500" }}
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
