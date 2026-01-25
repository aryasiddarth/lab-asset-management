import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear authentication tokens on 401
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      
      // Optionally redirect to login page
      // This will be caught by individual components for better UX
      console.warn("Unauthorized: Token may be expired or invalid");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
