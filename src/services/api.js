import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !window.location.pathname.startsWith("/login") && window.location.pathname !== "/forgot-password") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("utilisateur");
    window.location.assign("/login");
  }
  return Promise.reject(error);
});

export default api
