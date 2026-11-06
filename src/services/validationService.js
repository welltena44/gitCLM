import api from "./api.js";

/** Accès centralisé aux endpoints de validation CLM. */
export const getValidations = () => api.get("/validations").then((r) => r.data);
export const getValidationsByContract = (contractId) =>
  api.get(`/validations/contrat/${contractId}`).then((r) => r.data);
export const decideValidation = (id, payload) =>
  api.post(`/validations/${id}/decider`, payload).then((r) => r.data);

const validationService = {
  list: () => api.get("/validations"),
  byContract: (contractId) => api.get(`/validations/contrat/${contractId}`),
  decide: (id, payload) => api.post(`/validations/${id}/decider`, payload),
  getValidations,
  getValidationsByContract,
  decideValidation,
};

export default validationService;
