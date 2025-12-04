import { AuthState } from "../types"; // if you want types later, but we'll just use plain values for now

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Invalid login");
  }

  return res.json() as Promise<{
    access_token: string;
    role: "admin" | "operator" | "viewer";
    email?: string;
  }>;
}


