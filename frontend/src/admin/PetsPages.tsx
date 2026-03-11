import { useEffect, useState, type PropsWithChildren } from "react";
import { Icon } from "@iconify/react";
import { useDelete, useOne, useTable } from "@refinedev/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import { imageUrl } from "@/config";
import {
  PET_GROUPS,
  type AnimalType,
  type Gender,
  type Pet,
  type PetStatus,
} from "@/types/pet";
import { dataProvider } from "@/admin/core";
import {
  AdminCard,
  AdminGhostLink,
  AdminPageHeader,
  AdminPrimaryLink,
  formatDateTime,
} from "@/admin/ui";
import { useToast } from "@/components/ToastProvider";

const PET_STATUS_OPTIONS: Array<{ value: PetStatus; label: string }> = [
  { value: "available", label: "Ищет дом" },
  { value: "reserved", label: "Забронирован" },
  { value: "adopted", label: "Уже дома" },
  { value: "under_treatment", label: "На лечении" },
  { value: "temporarily_unavailable", label: "Временно недоступен" },
];

const ANIMAL_TYPE_OPTIONS: Array<{ value: AnimalType; label: string }> = [
  { value: "dog", label: "Собака" },
  { value: "cat", label: "Кошка" },
];

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Мальчик" },
  { value: "female", label: "Девочка" },
];

type AdminPet = Omit<Pet, "id"> & { id?: string };

function petStatusLabel(status: PetStatus) {
  return PET_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

function animalTypeLabel(value: AnimalType) {
  return ANIMAL_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function genderLabel(value: Gender | null) {
  return GENDER_OPTIONS.find((item) => item.value === value)?.label ?? "Не указан";
}

function petPreviewImage(pet: AdminPet) {
  if (pet.image_urls.length > 0) {
    return imageUrl(pet.image_urls[0]);
  }
  return pet.animal_type === "dog"
    ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200"
    : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200";
}

function pageItems(currentPage: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", pageCount];
  }

  if (currentPage >= pageCount - 3) {
    return [1, "...", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", pageCount];
}

function initialPetForm() {
  return {
    name: "",
    birth_year: "",
    animal_type: "dog" as AnimalType,
    gender: "" as Gender | "",
    appearance_text: "",
    coat_color: "",
    coat_type: "",
    adult_weight: "",
    adult_height: "",
    character_and_behavior_text: "",
    is_healthy: true,
    is_vaccinated: false,
    is_sterilized: false,
    is_parasite_treated: false,
    health_notes: "",
    registration_number: "",
    tag_number: "",
    tag_color: "",
    admission_text: "",
    admission_date: "",
    capture_place: "",
    capture_condition: "",
    additional_conditions: "",
    groups: [] as string[],
    status: "available" as PetStatus,
    image_urls: "",
  };
}

function mapPetToForm(pet: AdminPet) {
  return {
    name: pet.name,
    birth_year: pet.birth_year ? String(pet.birth_year) : "",
    animal_type: pet.animal_type,
    gender: (pet.gender ?? "") as Gender | "",
    appearance_text: pet.appearance_text ?? "",
    coat_color: pet.coat_color ?? "",
    coat_type: pet.coat_type ?? "",
    adult_weight: pet.adult_weight ?? "",
    adult_height: pet.adult_height ?? "",
    character_and_behavior_text: pet.character_and_behavior_text ?? "",
    is_healthy: pet.is_healthy,
    is_vaccinated: pet.is_vaccinated,
    is_sterilized: pet.is_sterilized,
    is_parasite_treated: pet.is_parasite_treated,
    health_notes: pet.health_notes ?? "",
    registration_number: pet.registration_number ?? "",
    tag_number: pet.tag_number ?? "",
    tag_color: pet.tag_color ?? "",
    admission_text: pet.admission_text ?? "",
    admission_date: pet.admission_date ? pet.admission_date.slice(0, 10) : "",
    capture_place: pet.capture_place ?? "",
    capture_condition: pet.capture_condition ?? "",
    additional_conditions: pet.additional_conditions ?? "",
    groups: pet.groups,
    status: pet.status,
    image_urls: pet.image_urls.join("\n"),
  };
}

function formToPayload(form: ReturnType<typeof initialPetForm>) {
  return {
    name: form.name,
    birth_year: form.birth_year ? Number(form.birth_year) : null,
    animal_type: form.animal_type,
    gender: form.gender || null,
    appearance_text: form.appearance_text || null,
    coat_color: form.coat_color || null,
    coat_type: form.coat_type || null,
    adult_weight: form.adult_weight || null,
    adult_height: form.adult_height || null,
    character_and_behavior_text: form.character_and_behavior_text || null,
    is_healthy: form.is_healthy,
    is_vaccinated: form.is_vaccinated,
    is_sterilized: form.is_sterilized,
    is_parasite_treated: form.is_parasite_treated,
    health_notes: form.health_notes || null,
    registration_number: form.registration_number || null,
    tag_number: form.tag_number || null,
    tag_color: form.tag_color || null,
    admission_text: form.admission_text || null,
    admission_date: form.admission_date || null,
    capture_place: form.capture_place || null,
    capture_condition: form.capture_condition || null,
    additional_conditions: form.additional_conditions || null,
    groups: form.groups,
    status: form.status,
    image_urls: form.image_urls
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function BooleanBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        value ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${value ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E4ECE9] bg-[#F7FAF9] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-gray-400">{label}</div>
      <div className="mt-2 text-sm font-medium leading-relaxed text-gray-900">{value}</div>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="rounded-[24px] border border-[#E4ECE9] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(12,90,86,0.38)]">
      <h3 className="mb-4 text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

export function AdminPetsListPage() {
  const {
    result,
    tableQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    setFilters,
    sorters,
    setSorters,
  } = useTable<AdminPet>({
    resource: "pets",
    syncWithLocation: false,
    pagination: { mode: "server", pageSize: 10 },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });
  const { mutateAsync: deletePet } = useDelete();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [animalTypeFilter, setAnimalTypeFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [openFilter, setOpenFilter] = useState<"animal_type" | "gender" | "status" | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters(
        [
          { field: "search_query", operator: "eq" as const, value: searchQuery || undefined },
          { field: "status", operator: "eq" as const, value: statusFilter || undefined },
          { field: "animal_type", operator: "eq" as const, value: animalTypeFilter || undefined },
          { field: "gender", operator: "eq" as const, value: genderFilter || undefined },
        ],
        "replace",
      );
      setCurrentPage(1);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, animalTypeFilter, genderFilter, setCurrentPage, setFilters]);

  useEffect(() => {
    const closeOnOutsideClick = () => setOpenFilter(null);
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!previewImage) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [previewImage]);

  const rows = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentSorters = sorters as Array<{ field: string; order: "asc" | "desc" }>;
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);
  const paginationItems = pageItems(currentPage, pageCount);

  const toggleSort = (field: string) => {
    const active = currentSorters[0];
    setSorters([{ field, order: active?.field === field && active.order === "asc" ? "desc" : "asc" }]);
  };

  return (
    <AdminCard className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Поиск по имени, описанию и характеру"
            className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <AdminPrimaryLink to="/admin/pets/create">
          <Icon icon="solar:add-circle-linear" className="text-base" />
          Добавить
        </AdminPrimaryLink>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] border border-[#E4ECE9] bg-white">
        <div className="h-full overflow-auto">
          <table className="min-w-full bg-white">
            <thead className="sticky top-0 z-10 bg-[#F5F8F7] shadow-[inset_0_-1px_0_0_#E4ECE9]">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <div className="flex h-9 items-center justify-center">Фото</div>
                </th>
                {[
                  ["Имя", "name"],
                  ["Возраст", "birth_year"],
                ].map(([label, field]) => (
                  <th key={field} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                    <button type="button" onClick={() => toggleSort(field)} className="inline-flex h-9 items-center justify-center gap-1 hover:text-primary">
                      {label}
                      <Icon
                        icon={
                          currentSorters[0]?.field === field
                            ? currentSorters[0]?.order === "asc"
                              ? "solar:sort-from-top-to-bottom-linear"
                              : "solar:sort-from-bottom-to-top-linear"
                            : "solar:sort-linear"
                        }
                        className="text-sm"
                      />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <div className="relative flex justify-center" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setOpenFilter((current) => current === "animal_type" ? null : "animal_type")}
                      className="inline-flex h-9 items-center justify-center gap-1 hover:text-primary"
                    >
                      Вид
                      <Icon icon="solar:filter-linear" className={`text-sm transition-transform ${animalTypeFilter ? "text-primary" : ""} ${openFilter === "animal_type" ? "rotate-180" : ""}`} />
                    </button>
                    {openFilter === "animal_type" && (
                      <div className="absolute left-1/2 top-11 z-20 min-w-48 -translate-x-1/2 rounded-2xl border border-[#DCE7E4] bg-white p-2 shadow-[0_20px_40px_-24px_rgba(12,90,86,0.35)]">
                        <button type="button" onClick={() => { setAnimalTypeFilter(""); setOpenFilter(null); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${animalTypeFilter === "" ? "bg-[#F2F8F7] text-primary" : "text-gray-700 hover:bg-[#F7FAF9]"}`}>Все</button>
                        {ANIMAL_TYPE_OPTIONS.map((item) => (
                          <button key={item.value} type="button" onClick={() => { setAnimalTypeFilter(item.value); setOpenFilter(null); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${animalTypeFilter === item.value ? "bg-[#F2F8F7] text-primary" : "text-gray-700 hover:bg-[#F7FAF9]"}`}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <div className="relative flex justify-center" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setOpenFilter((current) => current === "gender" ? null : "gender")}
                      className="inline-flex h-9 items-center justify-center gap-1 hover:text-primary"
                    >
                      Пол
                      <Icon icon="solar:filter-linear" className={`text-sm transition-transform ${genderFilter ? "text-primary" : ""} ${openFilter === "gender" ? "rotate-180" : ""}`} />
                    </button>
                    {openFilter === "gender" && (
                      <div className="absolute left-1/2 top-11 z-20 min-w-48 -translate-x-1/2 rounded-2xl border border-[#DCE7E4] bg-white p-2 shadow-[0_20px_40px_-24px_rgba(12,90,86,0.35)]">
                        <button type="button" onClick={() => { setGenderFilter(""); setOpenFilter(null); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${genderFilter === "" ? "bg-[#F2F8F7] text-primary" : "text-gray-700 hover:bg-[#F7FAF9]"}`}>Все</button>
                        {GENDER_OPTIONS.map((item) => (
                          <button key={item.value} type="button" onClick={() => { setGenderFilter(item.value); setOpenFilter(null); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${genderFilter === item.value ? "bg-[#F2F8F7] text-primary" : "text-gray-700 hover:bg-[#F7FAF9]"}`}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <div className="relative flex justify-center" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setOpenFilter((current) => current === "status" ? null : "status")}
                      className="inline-flex h-9 items-center justify-center gap-1 hover:text-primary"
                    >
                      Статус
                      <Icon icon="solar:filter-linear" className={`text-sm transition-transform ${statusFilter ? "text-primary" : ""} ${openFilter === "status" ? "rotate-180" : ""}`} />
                    </button>
                    {openFilter === "status" && (
                      <div className="absolute left-1/2 top-11 z-20 min-w-56 -translate-x-1/2 rounded-2xl border border-[#DCE7E4] bg-white p-2 shadow-[0_20px_40px_-24px_rgba(12,90,86,0.35)]">
                        <button type="button" onClick={() => { setStatusFilter(""); setOpenFilter(null); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${statusFilter === "" ? "bg-[#F2F8F7] text-primary" : "text-gray-700 hover:bg-[#F7FAF9]"}`}>Все</button>
                        {PET_STATUS_OPTIONS.map((item) => (
                          <button key={item.value} type="button" onClick={() => { setStatusFilter(item.value); setOpenFilter(null); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${statusFilter === item.value ? "bg-[#F2F8F7] text-primary" : "text-gray-700 hover:bg-[#F7FAF9]"}`}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <div className="flex h-9 items-center justify-center">Действия</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableQuery.isLoading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">Загрузка питомцев...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">Ничего не найдено.</td></tr>
              ) : (
                rows.map((pet) => (
                  <tr key={pet.id ?? pet.name} className="border-t border-[#EEF3F1]">
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ src: petPreviewImage(pet), alt: pet.name })}
                        className="block overflow-hidden rounded-xl transition hover:opacity-90"
                      >
                        <img
                          src={petPreviewImage(pet)}
                          alt={pet.name}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{pet.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{pet.birth_year ? new Date().getFullYear() - pet.birth_year : "Не указан"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{animalTypeLabel(pet.animal_type)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{genderLabel(pet.gender)}</td>
                    <td className="px-4 py-4 text-sm"><span className="inline-flex whitespace-nowrap rounded-full bg-[#FFF4D0] px-3 py-1 text-xs font-semibold text-[#8D6A00]">{petStatusLabel(pet.status)}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/pets/${pet.id}`} className="rounded-xl border border-[#DCE7E4] p-2 text-gray-600 transition hover:bg-[#F2F8F7] hover:text-primary">
                          <Icon icon="solar:eye-linear" className="text-lg" />
                        </Link>
                        <Link to={`/admin/pets/${pet.id}/edit`} className="rounded-xl border border-[#DCE7E4] p-2 text-gray-600 transition hover:bg-[#FFF3ED] hover:text-accent">
                          <Icon icon="solar:pen-linear" className="text-lg" />
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!pet.id || !window.confirm(`Удалить питомца ${pet.name}?`)) return;
                            try {
                              await deletePet({ resource: "pets", id: pet.id });
                              showToast("Питомец удален", "success");
                            } catch (cause) {
                              showToast(cause instanceof Error ? cause.message : "Не удалось удалить питомца", "error");
                            }
                          }}
                          className="rounded-xl border border-red-100 p-2 text-red-500 transition hover:bg-red-50"
                        >
                          <Icon icon="solar:trash-bin-trash-linear" className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
            className="w-20 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            {["10", "20", "50", "100"].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {total === 0 ? "0 записей" : `${rangeStart}-${rangeEnd} из ${total}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 transition hover:bg-[#F5F8F7] disabled:opacity-40"
          >
            <Icon icon="solar:alt-arrow-left-linear" className="text-base" />
          </button>
          {paginationItems.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-400">...</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(Number(item))}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${
                  currentPage === item
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-[#F5F8F7]"
                }`}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 transition hover:bg-[#F5F8F7] disabled:opacity-40"
          >
            <Icon icon="solar:alt-arrow-right-linear" className="text-base" />
          </button>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white"
              aria-label="Закрыть превью"
            >
              <Icon icon="solar:close-circle-linear" className="text-2xl" />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[82vh] w-auto max-w-[88vw] rounded-[28px] object-contain shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]"
            />
          </div>
        </div>
      )}
    </AdminCard>
  );
}

export function AdminPetShowPage() {
  const { id = "" } = useParams();
  const petQuery = useOne<AdminPet>({ resource: "pets", id });
  const pet = petQuery.result;
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [pet?.id]);

  return (
    <AdminCard>
      <div className="sticky top-0 z-20 -mx-6 -mt-6 mb-5 border-b border-[#E4ECE9] bg-white/95 px-6 py-5 backdrop-blur-sm">
        <AdminPageHeader
          title={pet?.name ?? "Питомец"}
          description="Полная административная карточка питомца."
          action={
            <div className="flex gap-2">
              <AdminGhostLink to="/admin/pets">
                <Icon icon="solar:arrow-left-linear" className="text-base" />
                К списку
              </AdminGhostLink>
              {id && (
                <AdminPrimaryLink to={`/admin/pets/${id}/edit`}>
                  <Icon icon="solar:pen-linear" className="text-base" />
                  Редактировать
                </AdminPrimaryLink>
              )}
            </div>
          }
        />
      </div>
      {petQuery.query.isLoading || !pet ? (
        <div className="text-sm text-gray-500">Загрузка...</div>
      ) : (
        <div className="grid gap-5">
          <DetailBlock title="Фотографии">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_124px]">
              <div className="overflow-hidden rounded-[24px] bg-[#EEF3F1]">
                <img
                  src={pet.image_urls.length ? imageUrl(pet.image_urls[activeImage] ?? pet.image_urls[0]) : petPreviewImage(pet)}
                  alt={pet.name}
                  className="h-[420px] w-full object-cover"
                />
              </div>
              <div className="max-h-[420px] overflow-y-auto rounded-[24px] border border-[#E4ECE9] bg-[#F7FAF9] p-3">
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                {(pet.image_urls.length ? pet.image_urls.map((item) => imageUrl(item)) : [petPreviewImage(pet)]).map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`overflow-hidden rounded-2xl border transition ${
                      activeImage === index ? "border-primary ring-2 ring-primary/15" : "border-[#DCE7E4]"
                    }`}
                  >
                    <img src={src} alt={`${pet.name} ${index + 1}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
                </div>
              </div>
            </div>
          </DetailBlock>

          <div className="grid gap-5">
            <DetailBlock title="Общие сведения">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Имя" value={pet.name} />
                <DetailField label="Статус" value={petStatusLabel(pet.status)} />
                <DetailField label="Вид" value={animalTypeLabel(pet.animal_type)} />
                <DetailField label="Пол" value={genderLabel(pet.gender)} />
                <DetailField label="Год рождения" value={pet.birth_year ? String(pet.birth_year) : "Не указан"} />
                <DetailField label="Возраст" value={pet.birth_year ? `${new Date().getFullYear() - pet.birth_year} лет` : "Не указан"} />
              </div>
              <div className="mt-4">
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-gray-400">Группы</div>
                <div className="flex flex-wrap gap-2">
                  {pet.groups.length > 0 ? (
                    pet.groups.map((group) => (
                      <span
                        key={group}
                        className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                      >
                        {group}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex rounded-full border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
                      Без групп
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-4">
                <DetailField
                  label="Характер и поведение"
                  value={pet.character_and_behavior_text ?? "Не указано"}
                />
                <DetailField
                  label="Дополнительные условия"
                  value={pet.additional_conditions ?? "Не указано"}
                />
              </div>
            </DetailBlock>

            <DetailBlock title="Системная информация">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="ID" value={pet.id ?? "Не указан"} />
                <DetailField label="Создан" value={formatDateTime(pet.created_at)} />
                <DetailField label="Статус карточки" value={petStatusLabel(pet.status)} />
                <DetailField label="Обновлен" value={formatDateTime(pet.updated_at)} />
              </div>
            </DetailBlock>

            <div className="grid gap-5 xl:grid-cols-2">
            <DetailBlock title="Внешность">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <DetailField label="Описание внешности" value={pet.appearance_text ?? "Не указано"} />
                </div>
                <DetailField label="Окрас" value={pet.coat_color ?? "Не указано"} />
                <DetailField label="Тип шерсти" value={pet.coat_type ?? "Не указано"} />
                <DetailField label="Вес" value={pet.adult_weight ?? "Не указано"} />
                <DetailField label="Рост" value={pet.adult_height ?? "Не указано"} />
              </div>
            </DetailBlock>

            <DetailBlock title="Поступление в приют">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Дата поступления" value={pet.admission_date ? formatDateTime(pet.admission_date) : "Не указано"} />
                <DetailField label="Место отлова / нахождения" value={pet.capture_place ?? "Не указано"} />
                <div className="md:col-span-2">
                  <DetailField label="Детали поступления" value={pet.admission_text ?? "Не указано"} />
                </div>
                <DetailField label="Состояние при поступлении" value={pet.capture_condition ?? "Не указано"} />
                <DetailField label="Регистрационный номер" value={pet.registration_number ?? "Не указано"} />
                <DetailField label="Номер бирки" value={pet.tag_number ?? "Не указано"} />
                <DetailField label="Цвет бирки" value={pet.tag_color ?? "Не указано"} />
              </div>
            </DetailBlock>

            <DetailBlock title="Здоровье">
              <div className="flex flex-wrap gap-2">
                <BooleanBadge value={pet.is_healthy} trueLabel="Здоров" falseLabel="Нуждается в наблюдении" />
                <BooleanBadge value={pet.is_vaccinated} trueLabel="Вакцинирован" falseLabel="Не вакцинирован" />
                <BooleanBadge value={pet.is_sterilized} trueLabel="Стерилизован" falseLabel="Не стерилизован" />
                <BooleanBadge value={pet.is_parasite_treated} trueLabel="Обработан от паразитов" falseLabel="Требуется обработка" />
              </div>
              <div className="mt-4 grid gap-4">
                <DetailField label="Примечания по здоровью" value={pet.health_notes ?? "Не указано"} />
              </div>
            </DetailBlock>
            </div>
          </div>
        </div>
      )}
    </AdminCard>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[#E4ECE9] bg-[#F7FAF9] px-4 py-3 text-sm font-medium text-gray-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
      {label}
    </label>
  );
}

export function AdminPetFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const petQuery = useOne<AdminPet>({
    resource: "pets",
    id: id ?? "",
    queryOptions: { enabled: isEdit },
  });
  const pet = petQuery.result;
  const [form, setForm] = useState(initialPetForm);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!pet) return;
    setForm(mapPetToForm(pet));
  }, [pet]);

  return (
    <AdminCard>
      <AdminPageHeader
        title={isEdit ? "Редактирование питомца" : "Создание питомца"}
        description="Полная форма карточки питомца для публичного каталога."
        action={
          <AdminGhostLink to="/admin/pets">
            <Icon icon="solar:arrow-left-linear" className="text-base" />
            К списку
          </AdminGhostLink>
        }
      />

      {isEdit && petQuery.query.isLoading ? (
        <div className="text-sm text-gray-500">Загрузка...</div>
      ) : (
        <form
          className="grid gap-6"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            try {
              const payload = formToPayload(form);
              if (isEdit && id) {
                await dataProvider.update({ resource: "pets", id, variables: payload });
              } else {
                await dataProvider.create({ resource: "pets", variables: payload });
              }
              showToast(isEdit ? "Карточка питомца обновлена" : "Питомец создан", "success");
              navigate("/admin/pets", { replace: true });
            } catch (cause) {
              showToast(cause instanceof Error ? cause.message : "Не удалось сохранить питомца", "error");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Имя</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Год рождения</span>
              <input type="number" min="1900" max={new Date().getFullYear()} value={form.birth_year} onChange={(event) => setForm((current) => ({ ...current, birth_year: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Вид</span>
              <select value={form.animal_type} onChange={(event) => setForm((current) => ({ ...current, animal_type: event.target.value as AnimalType }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                {ANIMAL_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Пол</span>
              <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as Gender | "" }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                <option value="">Не указан</option>
                {GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700">Статус</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PetStatus }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                {PET_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Рост</span>
              <input value={form.adult_height} onChange={(event) => setForm((current) => ({ ...current, adult_height: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Вес</span>
              <input value={form.adult_weight} onChange={(event) => setForm((current) => ({ ...current, adult_weight: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Окрас</span>
              <input value={form.coat_color} onChange={(event) => setForm((current) => ({ ...current, coat_color: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Тип шерсти</span>
              <input value={form.coat_type} onChange={(event) => setForm((current) => ({ ...current, coat_type: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Описание внешности</span>
            <textarea value={form.appearance_text} onChange={(event) => setForm((current) => ({ ...current, appearance_text: event.target.value }))} rows={4} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Характер и поведение</span>
            <textarea value={form.character_and_behavior_text} onChange={(event) => setForm((current) => ({ ...current, character_and_behavior_text: event.target.value }))} rows={4} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CheckboxField label="Здоров" checked={form.is_healthy} onChange={(value) => setForm((current) => ({ ...current, is_healthy: value }))} />
            <CheckboxField label="Вакцинирован" checked={form.is_vaccinated} onChange={(value) => setForm((current) => ({ ...current, is_vaccinated: value }))} />
            <CheckboxField label="Стерилизован" checked={form.is_sterilized} onChange={(value) => setForm((current) => ({ ...current, is_sterilized: value }))} />
            <CheckboxField label="Обработан от паразитов" checked={form.is_parasite_treated} onChange={(value) => setForm((current) => ({ ...current, is_parasite_treated: value }))} />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Примечания по здоровью</span>
            <textarea value={form.health_notes} onChange={(event) => setForm((current) => ({ ...current, health_notes: event.target.value }))} rows={3} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Рег. номер</span>
              <input value={form.registration_number} onChange={(event) => setForm((current) => ({ ...current, registration_number: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Номер бирки</span>
              <input value={form.tag_number} onChange={(event) => setForm((current) => ({ ...current, tag_number: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Цвет бирки</span>
              <input value={form.tag_color} onChange={(event) => setForm((current) => ({ ...current, tag_color: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Дата поступления</span>
              <input type="date" value={form.admission_date} onChange={(event) => setForm((current) => ({ ...current, admission_date: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Место отлова/нахождения</span>
              <input value={form.capture_place} onChange={(event) => setForm((current) => ({ ...current, capture_place: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Состояние при поступлении</span>
            <input value={form.capture_condition} onChange={(event) => setForm((current) => ({ ...current, capture_condition: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Детали поступления</span>
            <textarea value={form.admission_text} onChange={(event) => setForm((current) => ({ ...current, admission_text: event.target.value }))} rows={3} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>

          <fieldset className="rounded-2xl border border-[#E4ECE9] p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700">Группы</legend>
            <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PET_GROUPS.map((group) => (
                <label key={group} className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.groups.includes(group)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        groups: event.target.checked
                          ? [...current.groups, group]
                          : current.groups.filter((item) => item !== group),
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {group}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Дополнительные условия</span>
            <textarea value={form.additional_conditions} onChange={(event) => setForm((current) => ({ ...current, additional_conditions: event.target.value }))} rows={3} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Изображения (по одному URL в строке)</span>
            <textarea value={form.image_urls} onChange={(event) => setForm((current) => ({ ...current, image_urls: event.target.value }))} rows={4} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-[#E24F36] bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E24F36] disabled:opacity-70">
              <Icon icon={saving ? "solar:refresh-linear" : "solar:diskette-linear"} className={saving ? "animate-spin text-base" : "text-base"} />
              {isEdit ? "Сохранить изменения" : "Создать питомца"}
            </button>
            <AdminGhostLink to="/admin/pets">Отмена</AdminGhostLink>
          </div>
        </form>
      )}
    </AdminCard>
  );
}
