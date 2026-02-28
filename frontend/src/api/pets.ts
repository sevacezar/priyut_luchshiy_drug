import { API_BASE_URL } from "@/config";
import type { PetListParams, PetListResponse } from "@/types/pet";

function buildQuery(params: PetListParams): string {
  const search = new URLSearchParams();
  if (params.skip != null) search.set("skip", String(params.skip));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);
  if (params.animal_type) search.set("animal_type", params.animal_type);
  if (params.gender) search.set("gender", params.gender);
  if (params.is_healthy != null) search.set("is_healthy", String(params.is_healthy));
  if (params.is_vaccinated != null) search.set("is_vaccinated", String(params.is_vaccinated));
  if (params.is_sterilized != null) search.set("is_sterilized", String(params.is_sterilized));
  if (params.search_query) search.set("search_query", params.search_query);
  if (params.order_by) search.set("order_by", params.order_by);
  if (params.groups?.length) params.groups.forEach((g) => search.append("groups", g));
  return search.toString();
}

export async function fetchPetList(params: PetListParams = {}): Promise<PetListResponse> {
  const query = buildQuery(params);
  const url = `${API_BASE_URL}/api/pets${query ? `?${query}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка загрузки списка: ${res.status} ${text}`);
  }
  return res.json();
}
