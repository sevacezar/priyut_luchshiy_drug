const baseUrl = import.meta.env.VITE_API_BASE_URL;
if (!baseUrl) {
  console.warn(
    "VITE_API_BASE_URL is not set. Requests to the backend will fail. Add it to .env (see .env.example)."
  );
}

export const API_BASE_URL = baseUrl ?? "";

export function imageUrl(pathOrFull: string): string {
  const path = pathOrFull.startsWith("uploads/") ? pathOrFull.slice(8) : pathOrFull;
  return `${API_BASE_URL}/api/v1/uploads/${path}`;
}
