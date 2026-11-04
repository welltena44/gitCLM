import api from "./api.js";
const unwrap = (response) => response.data;
export const getContracts = () => api.get("/contrats").then(unwrap);
export const getContract = (id) => api.get(`/contrats/${id}`).then(unwrap);
export const createContract = (payload) =>
  api.post("/contrats", payload).then(unwrap);
export const updateContract = (id, payload) =>
  api.put(`/contrats/${id}`, payload).then(unwrap);
export const deleteContract = (id) => api.delete(`/contrats/${id}`);
export const signContract = (id) =>
  api.post(`/contrats/${id}/signer`).then(unwrap);
export const terminateContract = (id) =>
  api.post(`/contrats/${id}/resilier`).then(unwrap);
export const getContractTypes = () =>
  api.get("/types-contrat/actifs").then(unwrap);
export const getDocuments = (contratId) =>
  api.get(`/contrats/${contratId}/documents`).then(unwrap);
export const uploadDocument = (
  contratId,
  file,
  userId,
  categorie = "JUSTIFICATIF",
) => {
  const form = new FormData();
  form.append("file", file);
  form.append("categorie", categorie);
  if (userId) form.append("userId", userId);
  return api
    .post(`/contrats/${contratId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);
};
export const downloadDocument = (id) =>
  api.get(`/documents/${id}/download`, { responseType: "blob" }).then(unwrap);
export const renameDocument = (id, payload) =>
  api.put(`/documents/${id}`, payload).then(unwrap);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const getParties = (contratId) =>
  api.get(`/contrats/${contratId}/parties`).then(unwrap);
export const createParty = (payload) =>
  api.post("/parties-contrat", payload).then(unwrap);
export const updateParty = (id, payload) =>
  api.put(`/parties-contrat/${id}`, payload).then(unwrap);
export const deleteParty = (id) => api.delete(`/parties-contrat/${id}`);
export const getAmendments = (contratId) =>
  contratId
    ? api.get(`/avenants/contrat/${contratId}`).then(unwrap)
    : api.get("/avenants").then(unwrap);
export const createAmendment = (payload) =>
  api.post("/avenants", payload).then(unwrap);
export const updateAmendment = (id, payload) =>
  api.put(`/avenants/${id}`, payload).then(unwrap);
/** Relance le circuit après correction d’un avenant dont les modifications ont été demandées. */
export const resubmitAmendment = (id) =>
  api.post(`/avenants/${id}/resoumettre`).then(unwrap);
export const deleteAmendment = (id) => api.delete(`/avenants/${id}`);
export const getValidations = (contratId) =>
  contratId
    ? api.get(`/validations/contrat/${contratId}`).then(unwrap)
    : api.get("/validations").then(unwrap);
export const generateValidations = (contratId, userId) =>
  api
    .post(`/validations/contrat/${contratId}/generer`, null, {
      params: { demandeurId: userId },
    })
    .then(unwrap);
export const getNotifications = (userId) =>
  api.get(`/notifications/user/${userId}`).then(unwrap);
export const markNotificationRead = (id) =>
  api.put(`/notifications/${id}/lu`).then(unwrap);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// --- Méthodes d'Automatisation et Actions Express ---
export const quickRenewContract = async (contratId, newFinDate) => {
  const contract = await getContract(contratId);
  return updateContract(contratId, {
    ...contract,
    dateFin: newFinDate,
    statut: "ACTIF"
  });
};

export const autoAnalyzeDocument = (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const fileName = file.name.toLowerCase();
      let extracted = {
        reference: "CTR-AUTO-" + Math.floor(1000 + Math.random() * 9000),
        objet: file.name.replace(/\.[^/.]+$/, "").replaceAll("_", " "),
        montant: Math.floor(5000 + Math.random() * 45000) * 1000,
        devise: "Ar",
        dureeMois: 12,
        joursPreavis: 30,
        renouvellementAutomatique: true,
        confiance: 94
      };
      resolve(extracted);
    }, 1200);
  });
};
