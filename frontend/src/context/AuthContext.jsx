import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dc_user")) || null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("dc_token", data.token);
    localStorage.setItem("dc_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("dc_token", data.token);
    localStorage.setItem("dc_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post("/auth/reset-password", { token, password });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("dc_token");
    localStorage.removeItem("dc_user");
    localStorage.removeItem("dc_active_branch");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, register, forgotPassword, resetPassword, logout, isAuthed: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
