import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { fetchPetList } from "@/api/pets";
import { Hero } from "@/components/Hero";
import { PetCard } from "@/components/PetCard";
import type { Pet, PetListParams, PetListResponse } from "@/types/pet";
import { PET_GROUPS } from "@/types/pet";

const LIMIT = 9;
const SORT_OPTIONS = [
  { value: "-created_at", label: "Сначала новые" },
  { value: "created_at", label: "Сначала старые" },
  { value: "name", label: "По имени (А—Я)" },
  { value: "-name", label: "По имени (Я—А)" },
] as const;

export function PetsPage() {
  const [data, setData] = useState<PetListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [skip, setSkip] = useState(0);
  const [animalType, setAnimalType] = useState<"dog" | "cat" | "">("");
  const [groups, setGroups] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<string>(SORT_OPTIONS[0].value);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ type?: string; groups: string[] }>({ groups: [] });

  const loadPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: PetListParams = {
      skip,
      limit: LIMIT,
      order_by: orderBy,
    };
    if (animalType) params.animal_type = animalType;
    if (groups.length) params.groups = groups;
    try {
      const res = await fetchPetList(params);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [skip, animalType, groups, orderBy]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  useEffect(() => {
    if (!sortOpen) return;
    const close = () => setSortOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [sortOpen]);

  useEffect(() => {
    setActiveFilters({
      type: animalType ? (animalType === "dog" ? "Собаки" : "Кошки") : undefined,
      groups: [...groups],
    });
  }, [animalType, groups]);

  const clearFilters = () => {
    setAnimalType("");
    setGroups([]);
    setSkip(0);
  };

  const removeGroup = (g: string) => setGroups((prev) => prev.filter((x) => x !== g));
  const removeTypeFilter = () => setAnimalType("");

  const hasActiveFilters = activeFilters.type || activeFilters.groups.length > 0;
  const totalPages = data ? Math.ceil(data.total_count / LIMIT) : 0;
  const currentPage = totalPages > 0 ? Math.floor(skip / LIMIT) + 1 : 0;
  const pageWindow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
  const endPage = Math.min(totalPages, startPage + pageWindow - 1);
  const pagesToShow = totalPages > 0 ? Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i) : [];

  return (
    <>
      <Hero totalCount={data?.total_count} />
      <main className="flex-grow sm:px-6 lg:px-8 flex flex-col md:flex-row w-full max-w-7xl mr-auto ml-auto pt-12 pr-4 pb-12 pl-4 gap-x-10 gap-y-10">
        <aside className="w-full md:w-64 shrink-0 space-y-10">
          {/* Сортировка */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Сортировка</h3>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOpen((o) => !o);
                }}
                className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm"
              >
                <span className="text-base font-medium text-gray-700">
                  {SORT_OPTIONS.find((s) => s.value === orderBy)?.label ?? orderBy}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`text-xl text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                />
              </button>
              {sortOpen && (
                <div
                  className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setOrderBy(opt.value);
                        setSortOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-base font-medium transition-colors hover:bg-gray-50 ${
                        orderBy === opt.value ? "bg-gray-50/50 text-primary" : "text-gray-600"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        {opt.label}
                        {orderBy === opt.value && (
                          <Icon icon="solar:check-read-linear" className="text-base" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Вид */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold tracking-tight text-gray-900">Вид</h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Сбросить
                </button>
              )}
            </div>
            <div className="space-y-3">
              {[
                { value: "dog" as const, label: "Собаки" },
                { value: "cat" as const, label: "Кошки" },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={animalType === value}
                      onChange={(e) => setAnimalType(e.target.checked ? value : "")}
                    />
                    <div className="w-5 h-5 border border-gray-300 rounded peer-checked:bg-primary peer-checked:border-primary group-hover:border-gray-400 transition-colors" />
                    <Icon
                      icon="solar:check-read-linear"
                      className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity pointer-events-none"
                    />
                  </div>
                  <span className="text-base text-gray-600 group-hover:text-gray-900 transition-colors flex-grow">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Группы */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Группы</h3>
            <div className="space-y-3">
              {PET_GROUPS.map((g) => (
                <label key={g} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={groups.includes(g)}
                      onChange={(e) =>
                        setGroups((prev) =>
                          e.target.checked ? [...prev, g] : prev.filter((x) => x !== g)
                        )
                      }
                    />
                    <div className="w-5 h-5 border border-gray-300 rounded peer-checked:bg-primary peer-checked:border-primary group-hover:border-gray-400 transition-colors" />
                    <Icon
                      icon="solar:check-read-linear"
                      className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity pointer-events-none"
                    />
                  </div>
                  <span className="text-base text-gray-600 group-hover:text-gray-900 transition-colors">
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-grow">
          {/* Активные фильтры */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500 mr-2">Фильтры:</span>
              {activeFilters.type && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {activeFilters.type}
                  <button
                    type="button"
                    onClick={removeTypeFilter}
                    className="hover:text-gray-900 focus:outline-none flex items-center justify-center"
                    aria-label="Убрать"
                  >
                    <Icon icon="solar:close-circle-linear" className="text-sm" />
                  </button>
                </span>
              )}
              {activeFilters.groups.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                >
                  {g}
                  <button
                    type="button"
                    onClick={() => removeGroup(g)}
                    className="hover:text-gray-900 focus:outline-none flex items-center justify-center"
                    aria-label="Убрать"
                  >
                    <Icon icon="solar:close-circle-linear" className="text-sm" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 ml-auto transition-colors"
              >
                Сбросить все
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(data?.items ?? []).map((pet: Pet) => (
                  <PetCard key={pet.id ?? pet.name} pet={pet} />
                ))}
              </div>
              {data && data.items.length === 0 && (
                <p className="text-center text-gray-500 py-12">По выбранным фильтрам никого не найдено.</p>
              )}

              {/* Пагинация */}
              {data && data.total_count > LIMIT && (
                <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6 flex-wrap gap-4">
                  <p className="text-sm text-gray-500">
                    Показано{" "}
                    <span className="font-medium text-gray-900">{skip + 1}</span>
                    {" – "}
                    <span className="font-medium text-gray-900">
                      {Math.min(skip + LIMIT, data.total_count)}
                    </span>
                    {" из "}
                    <span className="font-medium text-gray-900">{data.total_count}</span> питомцев
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={skip === 0}
                      onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
                      className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <Icon icon="solar:alt-arrow-left-linear" className="text-xl" />
                    </button>
                    {pagesToShow.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setSkip((page - 1) * LIMIT)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-base font-medium transition-colors ${
                          currentPage === page
                            ? "border border-primary bg-primary text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={skip + LIMIT >= data.total_count}
                      onClick={() => setSkip((s) => s + LIMIT)}
                      className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <Icon icon="solar:alt-arrow-right-linear" className="text-xl" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
