import { useCallback, useEffect, useState } from "react";
import api from "../services/api.js";
import { useFeedback } from "./FeedbackContext.jsx";

export default function PasswordResetRequestsPopup({
  adminId,
  open,
  onClose,
  onCountChange,
}) {
  const [requests, setRequests] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [snoozed, setSnoozed] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { toast, confirm } = useFeedback();

  const load = useCallback(async () => {
    if (!adminId) return;
    try {
      const { data } = await api.get("/admin/password-reset-requests");
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
      onCountChange?.(list.length);
      setActiveId((current) =>
        list.some((r) => String(r.id) === String(current))
          ? current
          : (list.find((r) => !snoozed.has(String(r.id)))?.id ?? null),
      );
      return list;
    } catch {
      /* L'alerte ne doit pas bloquer l'espace administrateur. */
    }
  }, [adminId, snoozed, onCountChange]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, [load]);

  const traiter = async (action) => {
    if (!activeId || busy) return;
    const accepted = await confirm({
      title:
        action === "approve"
          ? "Réinitialiser ce mot de passe ?"
          : "Rejeter cette demande ?",
      message:
        action === "approve"
          ? "Un mot de passe provisoire sera généré et envoyé à l’adresse e-mail du compte."
          : "La demande de réinitialisation sera rejetée.",
      confirmLabel: action === "approve" ? "Réinitialiser" : "Rejeter",
      danger: action === "reject",
    });
    if (!accepted) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(
        `/admin/password-reset-requests/${activeId}/${action}`,
        {},
      );
      toast(data.message, "success", "Demande traitée");
      setActiveId(null);
      const remaining = await load();
      if (remaining?.length === 0) onClose?.();
    } catch (e) {
      setError(
        e.response?.data?.message || "Impossible de traiter cette demande.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open || !activeId) return null;
  const request = requests.find((r) => String(r.id) === String(activeId));
  if (!request) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#0f172a88",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-request-title"
        style={{
          width: "min(480px, 100%)",
          background: "white",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 20px 60px #0004",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <i
            className="fa-solid fa-key"
            style={{ color: "#168bd2", fontSize: 24 }}
          />
          <div>
            <h2 id="reset-request-title" style={{ margin: 0 }}>
              Demande de mot de passe oublié
            </h2>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>
              Un utilisateur demande une réinitialisation.
            </p>
          </div>
        </div>
        <dl
          style={{
            margin: "22px 0",
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 10,
          }}
        >
          <dt>Matricule</dt>
          <dd style={{ margin: 0 }}>{request.matricule}</dd>
          <dt>Utilisateur</dt>
          <dd style={{ margin: 0 }}>{request.nom}</dd>
          <dt>Demande reçue</dt>
          <dd style={{ margin: 0 }}>
            {request.dateCreation
              ? new Date(request.dateCreation).toLocaleString()
              : ""}
          </dd>
        </dl>
        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}
        <p style={{ color: "#475569", fontSize: 13 }}>
          La réinitialisation générera un code provisoire et l’enverra à
          l’adresse e-mail déjà enregistrée pour ce compte.
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setSnoozed((current) => new Set([...current, String(activeId)]));
              setActiveId(
                requests.find(
                  (r) =>
                    String(r.id) !== String(activeId) &&
                    !snoozed.has(String(r.id)),
                )?.id ?? null,
              );
              if (requests.length <= 1) onClose?.();
            }}
          >
            Plus tard
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => traiter("reject")}
          >
            Rejeter
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => traiter("approve")}
            style={{
              background: "#168bd2",
              color: "white",
              border: 0,
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            {busy ? "Envoi…" : "Réinitialiser et envoyer"}
          </button>
        </div>
      </section>
    </div>
  );
}
