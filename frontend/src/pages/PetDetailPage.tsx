import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useParams } from "react-router-dom";
import { fetchPetDetail } from "@/api/pets";
import { imageUrl } from "@/config";
import type { Pet } from "@/types/pet";

function usePetDetail(petId: string | undefined) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setPet(null);

      if (!petId) {
        if (!isCancelled) {
          setError("Не указан идентификатор питомца");
          setLoading(false);
        }
        return;
      }

      try {
        const data = await fetchPetDetail(petId);
        if (!isCancelled) setPet(data);
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить данные питомца");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      isCancelled = true;
    };
  }, [petId]);

  return { pet, loading, error };
}

function ageLabel(birthYear: number | null): string {
  if (birthYear == null) return "Возраст не указан";
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age <= 0) return "Малыш";
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

function genderLabel(gender: Pet["gender"]): string {
  if (gender === "male") return "Мальчик";
  if (gender === "female") return "Девочка";
  return "Пол не указан";
}

function statusLabel(status: Pet["status"]): string {
  switch (status) {
    case "available":
      return "Ищет дом";
    case "reserved":
      return "Забронирован";
    case "adopted":
      return "Уже дома";
    case "under_treatment":
      return "На лечении";
    case "temporarily_unavailable":
      return "Временно недоступен";
    default:
      return "Статус не указан";
  }
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "Не указано";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Не указано";
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function boolLabel(value: boolean, positive: string, negative: string): string {
  return value ? positive : negative;
}

function fallbackByAnimalType(animalType: Pet["animal_type"]): string {
  return animalType === "dog"
    ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1400"
    : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1400";
}

function StatBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#E6DCC6] bg-white/80 px-3 py-1.5 text-sm text-gray-700">
      <Icon icon={icon} className="text-base text-primary" />
      {label}
    </div>
  );
}

export function PetDetailPage() {
  const { petId } = useParams<{ petId: string }>();
  const { pet, loading, error } = usePetDetail(petId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [pet?.id]);

  const images = useMemo(() => {
    if (!pet) return [];
    if (!pet.image_urls.length) return [fallbackByAnimalType(pet.animal_type)];
    return pet.image_urls.map((url) => imageUrl(url));
  }, [pet]);

  const activeImage = images[activeImageIndex] ?? "";
  const showControls = images.length > 1;

  const goPrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <section className="flex-1 px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl animate-pulse space-y-6">
          <div className="h-9 w-48 rounded-xl bg-gray-200" />
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="aspect-[4/3] rounded-3xl bg-gray-200" />
            <div className="space-y-4 rounded-3xl bg-gray-100 p-6">
              <div className="h-8 w-2/3 rounded-lg bg-gray-200" />
              <div className="h-5 w-full rounded-lg bg-gray-200" />
              <div className="h-5 w-5/6 rounded-lg bg-gray-200" />
              <div className="h-28 w-full rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !pet) {
    return (
      <section className="flex-1 px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="mb-2 text-xl font-semibold">Не удалось открыть страницу питомца</h1>
          <p className="mb-4 text-sm">{error ?? "Питомец не найден"}</p>
          <Link
            to="/pets"
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-red-100"
          >
            <Icon icon="solar:arrow-left-linear" className="text-base" />
            Вернуться к списку
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pet-detail-bg flex-1 overflow-x-hidden px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          to="/pets"
          className="pet-detail-fade-up inline-flex items-center gap-2 rounded-xl border border-[#E6DCC6] bg-[#F8F5EC] px-4 py-2 text-sm font-medium text-primary transition-all hover:-translate-y-0.5 hover:bg-white"
        >
          <Icon icon="solar:arrow-left-linear" className="text-base" />
          К списку питомцев
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="pet-detail-fade-up pet-detail-delay-1 rounded-3xl border border-[#E9DFC8] bg-white/70 p-3 shadow-[0_15px_35px_-28px_rgba(12,90,86,0.55)] backdrop-blur-sm">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={activeImage}
                alt={pet.name}
                className="pet-detail-image w-full aspect-[4/3] object-cover"
              />
              {showControls && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/35 backdrop-blur-sm border border-white/20 text-gray-500 flex items-center justify-center opacity-90 transition-opacity duration-300 hover:opacity-100 hover:bg-white/45"
                    aria-label="Предыдущее фото"
                  >
                    <Icon icon="solar:alt-arrow-left-linear" className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/35 backdrop-blur-sm border border-white/20 text-gray-500 flex items-center justify-center opacity-90 transition-opacity duration-300 hover:opacity-100 hover:bg-white/45"
                    aria-label="Следующее фото"
                  >
                    <Icon icon="solar:alt-arrow-right-linear" className="text-xs" />
                  </button>
                </>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
                {statusLabel(pet.status)}
              </span>
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`overflow-hidden rounded-xl border transition-all ${
                      index === activeImageIndex
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-[#D8CCAF]"
                    }`}
                    aria-label={`Открыть фото ${index + 1}`}
                  >
                    <img src={src} alt={`${pet.name} ${index + 1}`} className="h-16 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <article className="pet-detail-fade-up pet-detail-delay-2 rounded-3xl border border-[#E9DFC8] bg-[#F8F5EC] p-6 shadow-[0_15px_35px_-28px_rgba(244,86,60,0.5)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{pet.name}</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {pet.animal_type === "dog" ? "Собака" : "Кошка"}
              </span>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <StatBadge icon="solar:calendar-linear" label={ageLabel(pet.birth_year)} />
              <StatBadge icon="solar:user-rounded-linear" label={genderLabel(pet.gender)} />
              <StatBadge
                icon="solar:star-shine-linear"
                label={pet.groups.length ? pet.groups.join(" • ") : "Без группы"}
              />
            </div>

            <p className="text-sm leading-relaxed text-gray-700">
              {pet.character_and_behavior_text ??
                pet.appearance_text ??
                "Этот питомец ждет человека, который подарит ему заботу и дом."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E6DCC6] bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-gray-900">Здоровье</h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>{boolLabel(pet.is_healthy, "Здоров", "Нуждается в наблюдении")}</li>
                  <li>{boolLabel(pet.is_vaccinated, "Вакцинирован", "Без вакцинации")}</li>
                  <li>{boolLabel(pet.is_sterilized, "Стерилизован", "Не стерилизован")}</li>
                  <li>{boolLabel(pet.is_parasite_treated, "Обработан от паразитов", "Требуется обработка")}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E6DCC6] bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-gray-900">Поступление</h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>Дата: {formatDate(pet.admission_date)}</li>
                  <li>Место: {pet.capture_place ?? "Не указано"}</li>
                  <li>Состояние: {pet.capture_condition ?? "Не указано"}</li>
                </ul>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="pet-detail-fade-up pet-detail-delay-3 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold tracking-tight text-gray-900">Внешность</h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {pet.appearance_text ?? "Подробное описание внешности пока не добавлено."}
            </p>
            <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <div>Окрас: {pet.coat_color ?? "Не указано"}</div>
              <div>Тип шерсти: {pet.coat_type ?? "Не указано"}</div>
              <div>Вес: {pet.adult_weight ?? "Не указано"}</div>
              <div>Рост: {pet.adult_height ?? "Не указано"}</div>
            </div>
          </article>

          <article className="pet-detail-fade-up pet-detail-delay-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold tracking-tight text-gray-900">Дополнительно</h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {pet.additional_conditions ?? "Особых условий пока не указано."}
            </p>
            {pet.health_notes && (
              <p className="mt-4 rounded-2xl bg-[#F8F5EC] p-3 text-sm text-gray-700">
                <span className="font-semibold">Примечания по здоровью:</span> {pet.health_notes}
              </p>
            )}
            {pet.admission_text && (
              <p className="mt-4 rounded-2xl bg-[#F2F8F7] p-3 text-sm text-gray-700">
                <span className="font-semibold">История поступления:</span> {pet.admission_text}
              </p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
