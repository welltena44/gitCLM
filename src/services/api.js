import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? `${window.location.origin}/api`
    : "http://localhost:8080/api");

let sessionEndReported = false;

export const reportSessionEnd = () => {
  const token = sessionStorage.getItem("token");
  if (!token || sessionEndReported) return Promise.resolve();
  sessionEndReported = true;
  return fetch(`${API_BASE_URL}/auth/session-end`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => {});
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.startsWith("/login") &&
      window.location.pathname !== "/forgot-password"
    ) {
      reportSessionEnd();
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("utilisateur");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
