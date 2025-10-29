import axios from "axios";

const API = axios.create({
  baseURL: "/api", // proxy handles localhost:5000 automatically
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
