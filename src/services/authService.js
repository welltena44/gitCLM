
import api from "./api.js";

export const login = async (matricule, motDePasse) => {
  const res = await api.post("/auth/login", {
    matricule: matricule.trim(),
    motDePasse,
  });

  return res.data;
};
