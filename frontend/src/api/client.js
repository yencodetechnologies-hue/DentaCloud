import axios from "axios";

const PROD_API_BASE = "https://evident.octosofttechnologies.in/api";

function computeBaseURL() {
  // No frontend .env: choose based on runtime host.
  // - Local dev: use same-origin `/api` so Vite proxy routes to backend
  // - Hosted: call the deployed backend directly
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  return isLocal ? "/api" : PROD_API_BASE;
}

const api = axios.create({
  baseURL: computeBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ed_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/login")) {
      localStorage.removeItem("ed_token");
      localStorage.removeItem("ed_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export function apiError(err) {
  if (!err.response) {
    return "Cannot reach the API server. Check your connection or backend deployment.";
  }
  if (err.response.status === 404) {
    return "API not found (404). Set VITE_API_URL (or API_URL for Vercel proxy) and redeploy.";
  }
  return err.response?.data?.message || err.message || "Something went wrong";
}
