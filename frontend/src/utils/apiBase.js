const rawApiBase = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const trimmedApiBase = rawApiBase.replace(/\/+$/, "");

export const API_BASE = trimmedApiBase.endsWith("/api")
  ? trimmedApiBase
  : `${trimmedApiBase}/api`;
