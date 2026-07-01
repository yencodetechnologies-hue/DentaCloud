import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
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
