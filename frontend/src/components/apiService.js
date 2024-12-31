import axios from "axios";
const API_BASE_URL = "https://secret-xb7x.onrender.com";
// const API_BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  // Add this to ensure cookies are sent with every request
  withCredentials: true,
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authService = {
  checkAuth: () => api.get("/api/check-auth"),
  login: (credentials) => api.post("/api/login", credentials),
  register: (userData) => api.post("/api/register", userData),
  logout: () => api.get("/api/logout"),
  googleAuth: () => {
    // For Google OAuth, we need to handle it differently
    const googleAuthUrl = `${API_BASE_URL}/auth/google`;
    window.location.href = googleAuthUrl;
  },
};

export const secretService = {
  fetchSecrets: () => api.get("/api/secrets"),
  addSecret: (secret) => api.post("/api/submit", { secret }),
  updateSecret: (secretId, secret) =>
    api.post("/api/submit", { secretId, secret }),
  deleteSecret: (secretId) => api.post("/api/secrets/delete", { secretId }),
};
