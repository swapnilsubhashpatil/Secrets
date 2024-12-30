import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
// const API_BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const authService = {
  checkAuth: () => api.get("/api/check-auth"),
  login: (credentials) => api.post("/api/login", credentials),
  register: (userData) => api.post("/api/register", userData),
  logout: () => api.get("/api/logout"),
  googleAuth: () => window.location.assign(`${API_BASE_URL}/api/auth/google`),
};

export const secretService = {
  fetchSecrets: () => api.get("/api/secrets"),
  addSecret: (secret) => api.post("/api/submit", { secret }),
  updateSecret: (secretId, secret) =>
    api.post("/api/submit", { secretId, secret }),
  deleteSecret: (secretId) => api.post("/api/secrets/delete", { secretId }),
};
