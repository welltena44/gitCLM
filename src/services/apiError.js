/** Extrait un message lisible depuis une erreur Axios ou JavaScript. */
export function getApiErrorMessage(error, fallback = "Une erreur est survenue.") {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const message = data.message || data.detail || data.error;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  if (!error?.response && typeof error?.message === "string" && error.message.trim()) return error.message.trim();
  const status = error?.response?.status;
  if (status === 401) return "Votre session a expiré. Veuillez vous reconnecter.";
  if (status === 403) return "Vous n'êtes pas autorisé à effectuer cette opération.";
  if (status === 404) return "La ressource demandée est introuvable.";
  if (status >= 500) return "Le serveur n'a pas pu traiter la demande. Réessayez plus tard.";
  return fallback;
}
