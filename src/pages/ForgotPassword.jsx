import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import "./Login.css";

export default function ForgotPassword() {
  const [matricule, setMatricule] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d+$/.test(matricule.trim())) {
      setError("Saisissez un matricule composé uniquement de chiffres.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/password-reset-requests", { matricule: matricule.trim() });
      setMessage(data.message);
    } catch (e) {
      setError(e.response?.data?.message || "La demande n’a pas pu être envoyée. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="auth-light-page"><div className="auth-light-shell">
    <aside className="auth-light-left"><div className="auth-brand-mini"><span className="brand-mark-spat"><img src="/LogoSPAT.jpeg" alt="Logo SPAT" /></span><div><small>SPAT</small><strong>Société du Port Autonome de Toamasina</strong><p className="spat-subtitle">Contract Lifecycle Management</p></div></div></aside>
    <main className="auth-light-right"><div className="auth-card-light">
      <div className="auth-header-light"><h2>Mot de passe oublié</h2><p>Envoyez une demande à l’administrateur de la plateforme.</p></div>
      {message ? <div role="status" className="error-msg" style={{ color: "#166534", background: "#f0fdf4" }}>{message}</div> : <form className="auth-form-light" onSubmit={submit}>
        <label className="auth-field"><span>Matricule</span><div className="auth-input-box"><i className="fa-solid fa-id-card" aria-hidden="true" /><input type="text" value={matricule} onChange={e => setMatricule(e.target.value)} inputMode="numeric" pattern="[0-9]+" required disabled={loading} placeholder="Entrez votre matricule" /></div></label>
        {error && <div className="error-msg" role="alert">{error}</div>}
        <button type="submit" className="auth-submit-button" disabled={loading}>{loading ? "Envoi en cours…" : "Envoyer la demande"}</button>
      </form>}
      <p style={{ marginTop: 18 }}><Link to="/login">Retour à la connexion</Link></p>
    </div></main>
  </div></div>;
}
