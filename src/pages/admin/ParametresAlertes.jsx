import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import "./DashboardAdmin.css";

const empty = { joursAvant: "", actif: true };
export default function ParametresAlertesPage() {
  const [rows, setRows] = useState([]),
    [form, setForm] = useState(empty),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/parametres-alertes");
      setRows(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Impossible de charger les paramètres d’alertes.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        joursAvant: Number(form.joursAvant),
        actif: form.actif,
      };
      if (!Number.isInteger(payload.joursAvant) || payload.joursAvant < 1)
        throw new Error(
          "Le délai doit être un nombre entier supérieur à zéro.",
        );
      if (editing) await api.put(`/parametres-alertes/${editing}`, payload);
      else await api.post("/parametres-alertes", payload);
      setForm(empty);
      setEditing(null);
      await load();
    } catch (err) {
      setError(
        err.message ||
          err.response?.data?.message ||
          "Enregistrement impossible. Vérifiez que ce délai n’existe pas déjà.",
      );
    } finally {
      setSaving(false);
    }
  };
  const edit = (row) => {
    setEditing(row.id);
    setForm({ joursAvant: row.joursAvant, actif: row.actif });
  };
  const remove = async (id) => {
    if (!window.confirm("Supprimer ce délai d’alerte ?")) return;
    try {
      await api.delete(`/parametres-alertes/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Suppression impossible.");
    }
  };
  return (
    <div className="admin-data-page">
      <div className="admin-data-toolbar">
        <div>
          <h2>
            <i
              className="fa-solid fa-bell page-title-icon"
              aria-hidden="true"
            />
            Paramètres des alertes d’échéance
          </h2>
          <p>
            Configurez à combien de jours avant l’échéance une alerte est
            déclenchée.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <form className="alert-setting-form" onSubmit={submit}>
        <label>
          Délai avant échéance (jours)
          <input
            type="number"
            min="1"
            required
            value={form.joursAvant}
            onChange={(e) => setForm({ ...form, joursAvant: e.target.value })}
          />
        </label>
        <label className="alert-checkbox">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={(e) => setForm({ ...form, actif: e.target.checked })}
          />{" "}
          Actif
        </label>
        <button disabled={saving}>
          {saving
            ? "Enregistrement…"
            : editing
              ? "Enregistrer"
              : "Ajouter le délai"}
        </button>
        {editing && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setForm(empty);
              setEditing(null);
            }}
          >
            Annuler
          </button>
        )}
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Délai</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .sort((a, b) => a.joursAvant - b.joursAvant)
              .map((row) => (
                <tr key={row.id}>
                  <td>J-{row.joursAvant}</td>
                  <td>{row.actif ? "Actif" : "Désactivé"}</td>
                  <td>
                    <button onClick={() => edit(row)}>Modifier</button>{" "}
                    <button onClick={() => remove(row.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="3" className="admin-empty">
                  Aucun délai configuré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
