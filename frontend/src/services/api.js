import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;