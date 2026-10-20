
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFeedback } from '../composants/FeedbackContext.jsx';
import { Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const matriculeNettoye = matricule.trim();

    if (!matriculeNettoye) {
      setError('Veuillez saisir votre matricule.');
      return;
    }

    if (!/^\d+$/.test(matriculeNettoye)) {
      setError('Le matricule doit contenir uniquement des chiffres.');
      return;
    }

    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    const proceed = await confirm({ title: 'Confirmer la connexion', message: `Vous allez ouvrir une session CLM avec le matricule ${matriculeNettoye}. Assurez-vous d’utiliser votre propre compte et de ne pas partager vos identifiants.`, confirmLabel: 'Confirmer et se connecter' });
    if (!proceed) return;

    setLoading(true);

    try {
      const data = await login(matriculeNettoye, password);

      if (!data || !data.role || data.actif !== true) {
        throw new Error(
          data?.actif === false
            ? 'Votre compte est désactivé.'
            : 'Les informations retournées par le serveur sont invalides.'
        );
      }

      loginUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast(`Bienvenue ${data.prenom || ''} ${data.nom || ''}.`.trim(), 'success', 'Connexion réussie');

      if (data.changementMotDePasseRequis) {
        navigate('/change-password', { replace: true });
        return;
      }

      switch (data.role) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          break;

        case 'GESTIONNAIRE':
          navigate('/gestionnaire', { replace: true });
          break;

        case 'JURIDIQUE':
          navigate('/juridique', { replace: true });
          break;

        case 'VALIDEUR':
          navigate('/valideur', { replace: true });
          break;

        default:
          localStorage.removeItem('user');
          setError('Votre rôle ne permet pas d’accéder à un espace.');
          break;
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Échec de la connexion. Vérifiez votre matricule et votre mot de passe.';

      setError(message);
      toast(message, 'error', 'Connexion refusée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-light-page">
      <div className="auth-light-shell">
        <aside className="auth-light-left">
          <div className="auth-brand-mini">
            <span className="brand-mark-spat">
              <img src="/LogoSPAT.jpeg" alt="Logo SPAT" />
            </span>

            <div>
              <small>SPAT</small>
              <strong>
                Société du Port Autonome de Toamasina
              </strong>
              <p className="spat-subtitle">
                Contract Lifecycle Management
              </p>
            </div>
          </div>
        </aside>

        <main className="auth-light-right">
          <div className="auth-card-light">
            <div className="auth-topbar-light">
              <span className="status-pill">
                <i
                  className="fa-solid fa-shield-halved"
                  aria-hidden="true"
                />
                Accès sécurisé
              </span>
            </div>

            <div className="auth-header-light">
              <h2>
                <i
                  className="fa-solid fa-right-to-bracket"
                  aria-hidden="true"
                />{' '}
                Connexion
              </h2>
              <p>Accédez à votre espace CLM</p>
            </div>

            <form
              className="auth-form-light"
              onSubmit={handleSubmit}
            >
              <label className="auth-field">
                <span>Matricule</span>

                <div className="auth-input-box">
                  <i
                    className="fa-solid fa-id-card"
                    aria-hidden="true"
                  />

                  <input
                    type="text"
                    name="matricule"
                    placeholder="Entrez votre matricule"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    autoComplete="username"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    required
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>Mot de passe</span>

                <div className="auth-input-box">
                  <i
                    className="fa-solid fa-lock"
                    aria-hidden="true"
                  />

                  <input
                    type="password"
                    name="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                </div>
              </label>

              {error && (
                <div className="error-msg" role="alert">
                  <i
                    className="fa-solid fa-triangle-exclamation"
                    aria-hidden="true"
                  />{' '}
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                <i
                  className={
                    loading
                      ? 'fa-solid fa-spinner fa-spin'
                      : 'fa-solid fa-arrow-right-to-bracket'
                  }
                  aria-hidden="true"
                />{' '}
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
              <p style={{ textAlign: 'right', margin: 0 }}>
                <Link to="/forgot-password" style={{ color: '#002395', fontSize: 13 }}>Mot de passe oublié ?</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
