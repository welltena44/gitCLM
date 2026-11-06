import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import "./feedback.css";
import "./feedback-info.css";
const FeedbackContext = createContext(null);
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const toast = useCallback((message, type = "success", title = "") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type, title }]);
    window.setTimeout(
      () => setToasts((items) => items.filter((item) => item.id !== id)),
      4500,
    );
    return id;
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);
  const confirm = useCallback(
    ({
      title = "Confirmer cette action",
      message = "Voulez-vous continuer ?",
      confirmLabel = "Confirmer",
      danger = false,
    } = {}) =>
      new Promise((resolve) =>
        setDialog({ title, message, confirmLabel, danger, resolve }),
      ),
    [],
  );
  const closeDialog = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };
  const value = useMemo(
    () => ({ toast, confirm, dismissToast }),
    [toast, confirm, dismissToast],
  );
  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="clm-toast-stack" aria-live="polite">
        {toasts.map((item) => (
          <div className={`clm-toast ${item.type}`} key={item.id} role="status">
            <span className="clm-toast-symbol">
              <i
                className={`fa-solid ${item.type === "error" ? "fa-circle-exclamation" : item.type === "warning" ? "fa-triangle-exclamation" : item.type === "info" ? "fa-circle-info" : "fa-circle-check"}`}
              />
            </span>
            <span>
              <strong>
                {item.title ||
                  (item.type === "error"
                    ? "Une erreur est survenue"
                    : item.type === "warning"
                      ? "Attention"
                      : item.type === "info"
                        ? "Traitement en cours"
                        : "Opération réussie")}
              </strong>
              <small>{item.message}</small>
            </span>
            <button
              onClick={() =>
                setToasts((items) => items.filter((t) => t.id !== item.id))
              }
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {dialog && (
        <div
          className="clm-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDialog(false);
          }}
        >
          <section
            className="clm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clm-modal-title"
          >
            <div className={`clm-modal-icon ${dialog.danger ? "danger" : ""}`}>
              <i
                className={`fa-solid ${dialog.danger ? "fa-triangle-exclamation" : "fa-circle-question"}`}
              />
            </div>
            <h2 id="clm-modal-title">{dialog.title}</h2>
            <p>{dialog.message}</p>
            <div className="clm-modal-actions">
              <button
                className="clm-btn secondary"
                onClick={() => closeDialog(false)}
              >
                Annuler
              </button>
              <button
                className={`clm-btn ${dialog.danger ? "danger" : "primary"}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx)
    throw new Error("useFeedback doit être utilisé dans FeedbackProvider");
  return ctx;
}
