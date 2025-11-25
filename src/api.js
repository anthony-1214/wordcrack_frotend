// src/api.js
export const API_BASE =
  import.meta.env.MODE === "production"
    ? "https://wordcrack-max.onrender.com"
    : "http://localhost:5001";