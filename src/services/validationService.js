import api from "./api.js";

/** Accès centralisé aux endpoints de validation CLM. */
const validationService = {
  list: () => api.get("/validations"),
  byContract: (contractId) => api.get(`/validations/contrat/${contractId}`),
  decide: (id, payload) => api.post(`/validations/${id}/decider`, payload),
};

export default validationService;
