import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {name, email, role}
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false); // no state rehydration on reload
  const navigate = useNavigate();

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    // Expect backend to return { token, user: {name, email, role, department} }
    setToken(data.token);
    setUser(data.user);
    // Store in localStorage so API calls include Authorization header via axiosClient.
    // We intentionally do NOT rehydrate from this on reload, so a full reload logs the user out.
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify(data.user));
    navigate("/");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
     // Clear stored credentials so future API calls are unauthenticated
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
