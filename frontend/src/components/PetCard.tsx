import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { imageUrl } from "@/config";
import type { Pet } from "@/types/pet";

const GENDER_LABELS: Record<string, string> = {
  male: "Мальчик",
  female: "Девочка",
};

function ageLabel(birthYear: number | null): string {
  if (birthYear == null) return "Возраст не указан";
  const year = new Date().getFullYear();
  const age = year - birthYear;
  if (age <= 0) return "Малыш";
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

function animalTypeLabel(type: string): string {
  return type === "dog" ? "Собака" : "Кошка";
}

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  const imgSrc =
    pet.image_urls?.length > 0
      ? imageUrl(pet.image_urls[0])
      : pet.animal_type === "dog"
        ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800"
        : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800";
  const breedOrAppearance =
    pet.coat_type || pet.appearance_text?.slice(0, 50) || animalTypeLabel(pet.animal_type);

  return (
    <article className="animal-card group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imgSrc}
          alt={pet.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {pet.groups?.slice(0, 2).map((g) => (
            <span key={g} className="bg-gold text-gray-900 text-sm font-medium px-2.5 py-1 rounded-lg shadow-sm">
              {g}
            </span>
          ))}
          {pet.gender && (
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-medium px-2.5 py-1 rounded-lg shadow-sm">
              {GENDER_LABELS[pet.gender] ?? pet.gender}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col flex-grow pt-5 pr-5 pb-5 pl-5">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 group-hover:text-primary transition-colors mb-2">
          {pet.name}
        </h2>
        <div className="space-y-2 mb-6">
          <p className="text-base text-gray-600 flex items-center gap-2">
            <Icon icon="solar:calendar-linear" className="text-base text-gray-400 shrink-0" />
            {ageLabel(pet.birth_year)}
          </p>
          <p className="text-base text-gray-600 flex items-center gap-2">
            <Icon icon="solar:info-circle-linear" className="text-base text-gray-400 shrink-0" />
            {breedOrAppearance}
          </p>
          {pet.additional_conditions && (
            <p className="text-base text-gray-600 flex items-center gap-2">
              <Icon icon="solar:hand-heart-linear" className="text-base text-accent shrink-0" />
              <span className="text-accent">{pet.additional_conditions.slice(0, 40)}</span>
            </p>
          )}
        </div>
        <Link
          to={pet.id ? `/pets/${pet.id}` : "#"}
          className="mt-auto w-full py-3 px-4 bg-gray-50 border border-gray-100 text-gray-800 text-base font-medium rounded-xl group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
        >
          Знакомство с {pet.name}
          <Icon icon="solar:arrow-right-linear" className="text-base" />
        </Link>
      </div>
    </article>
  );
}
