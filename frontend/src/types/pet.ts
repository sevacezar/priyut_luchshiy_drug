export type AnimalType = "dog" | "cat";
export type Gender = "male" | "female";
export type PetStatus =
  | "available"
  | "adopted"
  | "reserved"
  | "under_treatment"
  | "temporarily_unavailable";

export const PET_GROUPS = [
  "Ищем опекунов",
  "Старички",
  "Самые маленькие",
  "Средние",
  "Крупные",
  "Для опытных владельцев",
  "Трусишки",
] as const;
export type PetGroup = (typeof PET_GROUPS)[number];

export interface Pet {
  id: string | null;
  name: string;
  birth_year: number | null;
  animal_type: AnimalType;
  gender: Gender | null;
  appearance_text: string | null;
  coat_color: string | null;
  coat_type: string | null;
  adult_weight: string | null;
  adult_height: string | null;
  character_and_behavior_text: string | null;
  is_healthy: boolean;
  is_vaccinated: boolean;
  is_sterilized: boolean;
  is_parasite_treated: boolean;
  health_notes: string | null;
  registration_number: string | null;
  tag_number: string | null;
  tag_color: string | null;
  admission_text: string | null;
  admission_date: string | null;
  capture_place: string | null;
  capture_condition: string | null;
  additional_conditions: string | null;
  groups: string[];
  status: PetStatus;
  created_at: string;
  updated_at: string;
  image_urls: string[];
}

export interface PetListResponse {
  items: Pet[];
  total_count: number;
  skip: number;
  limit: number;
}

export interface PetListParams {
  skip?: number;
  limit?: number;
  status?: PetStatus;
  animal_type?: AnimalType;
  gender?: Gender;
  is_healthy?: boolean;
  is_vaccinated?: boolean;
  is_sterilized?: boolean;
  groups?: string[];
  search_query?: string;
  order_by?: string;
}
