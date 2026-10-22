import axios from "axios"

export const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === "production" ? `${window.location.origin}/api` : "http://localhost:8080/api"
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
})

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !window.location.pathname.startsWith("/login") && window.location.pathname !== "/forgot-password") {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("utilisateur");
    window.location.assign("/login");
  }
  return Promise.reject(error);
});

export default api
