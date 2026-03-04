import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { imageUrl } from "@/config";
import type { Pet } from "@/types/pet";

function ageLabel(birthYear: number | null): string {
  if (birthYear == null) return "Возраст не указан";
  const year = new Date().getFullYear();
  const age = year - birthYear;
  if (age <= 0) return "Малыш";
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  const fallbackImg =
    pet.animal_type === "dog"
      ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800"
      : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800";
  const images = pet.image_urls?.length ? pet.image_urls.map((url) => imageUrl(url)) : [fallbackImg];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const showControls = images.length > 1;
  const goPrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const goNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <article className="animal-card group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03] origin-center">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {images.map((src, idx) => (
              <img
                key={`${pet.id ?? pet.name}-${idx}`}
                src={src}
                alt={pet.name}
                className="w-full h-full object-cover shrink-0"
              />
            ))}
          </div>
        </div>
        {showControls && (
          <>
            <button
              type="button"
              onClick={goPrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/35 backdrop-blur-sm border border-white/20 text-gray-500 flex items-center justify-center opacity-0 group-hover:opacity-35 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 hover:opacity-55 hover:bg-white/45"
              aria-label="Предыдущее фото"
            >
              <Icon icon="solar:alt-arrow-left-linear" className="text-xs" />
            </button>
            <button
              type="button"
              onClick={goNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/35 backdrop-blur-sm border border-white/20 text-gray-500 flex items-center justify-center opacity-0 group-hover:opacity-35 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 hover:opacity-55 hover:bg-white/45"
              aria-label="Следующее фото"
            >
              <Icon icon="solar:alt-arrow-right-linear" className="text-xs" />
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col flex-grow p-3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 group-hover:text-primary transition-colors mb-1">
          {pet.name}
        </h2>
        <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-2.5">
          <Icon icon="solar:calendar-linear" className="text-xs text-gray-400 shrink-0" />
          {ageLabel(pet.birth_year)}
        </p>
        <Link
          to={pet.id ? `/pets/${pet.id}` : "#"}
          className="mt-auto w-full py-1.5 px-2.5 bg-gray-50 border border-gray-100 text-gray-800 text-xs font-medium rounded-lg group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5"
        >
          Узнать поближе
          <Icon icon="solar:arrow-right-linear" className="text-xs" />
        </Link>
      </div>
    </article>
  );
}
