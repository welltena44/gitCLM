import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE_URL } from "../services/api.js";
import "./ChangePassword.css";

export default function ChangePassword() {
  const { user, loginUser, logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (next.length < 8)
      return setError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      );
    if (next !== confirm)
      return setError("Les deux nouveaux mots de passe ne correspondent pas.");
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          userId: String(user.id),
          motDePasseActuel: current,
          nouveauMotDePasse: next,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Échec du changement de mot de passe.");
      const updated = { ...user, changementMotDePasseRequis: false };
      loginUser(updated);
      const paths = {
        ADMIN: "/admin",
        GESTIONNAIRE: "/gestionnaire",
        VALIDEUR: "/valideur",
        JURIDIQUE: "/juridique",
      };
      navigate(paths[user.role] || "/login", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const passwordsMatch = confirm.length > 0 && next === confirm;

  return (
    <main className="password-change-page">
      <div className="password-change-shell">
        <aside className="password-change-brand">
          <span className="password-change-logo">
            <img src="/LogoSPAT.jpeg" alt="Logo SPAT" />
          </span>
          <div>
            <small>SPAT</small>
            <strong>Société du Port Autonome de Toamasina</strong>
            <p>Contract Lifecycle Management</p>
          </div>
        </aside>
        <section className="password-change-content">
          <div className="password-change-card">
            <div className="password-change-icon">
              <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            </div>
            <span className="password-change-eyebrow">
              Sécurisation du compte
            </span>
            <h1>Choisissez votre mot de passe</h1>
            <p className="password-change-intro">
              Votre mot de passe provisoire doit être remplacé avant de
              continuer.
            </p>
            <form className="password-change-form" onSubmit={submit}>
              <label>
                <span>Mot de passe provisoire</span>
                <div className="password-change-input">
                  <i className="fa-solid fa-lock" aria-hidden="true" />
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder="Saisissez le code reçu"
                  />
                </div>
              </label>
              <label>
                <span>Nouveau mot de passe</span>
                <div className="password-change-input">
                  <i className="fa-solid fa-key" aria-hidden="true" />
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    placeholder="8 caractères minimum"
                  />
                </div>
              </label>
              <label>
                <span>Confirmer le nouveau mot de passe</span>
                <div
                  className={`password-change-input ${confirm.length ? (passwordsMatch ? "is-valid" : "is-invalid") : ""}`}
                >
                  <i className="fa-solid fa-check-double" aria-hidden="true" />
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Saisissez-le une seconde fois"
                  />
                </div>
                {confirm.length > 0 && (
                  <small
                    className={
                      passwordsMatch
                        ? "password-match valid"
                        : "password-match invalid"
                    }
                  >
                    {passwordsMatch
                      ? "Les mots de passe correspondent."
                      : "Les mots de passe ne correspondent pas encore."}
                  </small>
                )}
              </label>
              {error && (
                <p className="password-change-error" role="alert">
                  <i
                    className="fa-solid fa-circle-exclamation"
                    aria-hidden="true"
                  />
                  {error}
                </p>
              )}
              <button className="password-change-submit" disabled={saving}>
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />{" "}
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check" /> Enregistrer le nouveau
                    mot de passe
                  </>
                )}
              </button>
              <button
                className="password-change-logout"
                type="button"
                disabled={saving}
                onClick={logout}
              >
                Se déconnecter
              </button>
            </form>
            <div className="password-change-note">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />{" "}
              Choisissez un mot de passe d’au moins 8 caractères.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
