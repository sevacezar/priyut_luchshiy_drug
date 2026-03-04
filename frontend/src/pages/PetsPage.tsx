import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { fetchPetList } from "@/api/pets";
import { PetCard } from "@/components/PetCard";
import type { Gender, Pet, PetListParams } from "@/types/pet";
import { PET_GROUPS } from "@/types/pet";

const LIMIT = 6;
const SORT_OPTIONS = [
  { value: "-created_at", label: "Сначала новые" },
  { value: "created_at", label: "Сначала старые" },
  { value: "name", label: "По имени (А—Я)" },
  { value: "-name", label: "По имени (Я—А)" },
] as const;

export function PetsPage() {
  const [items, setItems] = useState<Pet[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [animalType, setAnimalType] = useState<"dog" | "cat" | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [groups, setGroups] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState<string>(SORT_OPTIONS[0].value);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ type?: string; gender?: string; groups: string[] }>({ groups: [] });
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const loadPetsPage = useCallback(async (nextSkip: number, append: boolean) => {
    if (isFetchingRef.current) return;
    if (append && !hasMoreRef.current) return;

    isFetchingRef.current = true;
    if (append) setLoadingMore(true);
    else setLoadingInitial(true);
    setError(null);

    const params: PetListParams = {
      skip: nextSkip,
      limit: LIMIT,
      order_by: orderBy,
    };
    if (animalType) params.animal_type = animalType;
    if (gender) params.gender = gender;
    if (groups.length) params.groups = groups;
    if (debouncedSearchQuery.trim()) params.search_query = debouncedSearchQuery.trim();

    try {
      const res = await fetchPetList(params);
      setTotalCount(res.total_count);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      const loadedCount = nextSkip + res.items.length;
      const nextHasMore = loadedCount < res.total_count;
      setHasMore(nextHasMore);
      hasMoreRef.current = nextHasMore;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      if (append) setLoadingMore(false);
      else setLoadingInitial(false);
      isFetchingRef.current = false;
    }
  }, [animalType, gender, groups, orderBy, debouncedSearchQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    setItems([]);
    setTotalCount(0);
    setHasMore(true);
    hasMoreRef.current = true;
    void loadPetsPage(0, false);
  }, [animalType, gender, groups, orderBy, debouncedSearchQuery, loadPetsPage]);

  useEffect(() => {
    if (!sortOpen) return;
    const close = () => setSortOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [sortOpen]);

  useEffect(() => {
    setActiveFilters({
      type: animalType ? (animalType === "dog" ? "Собаки" : "Кошки") : undefined,
      gender: gender ? (gender === "male" ? "Мальчики" : "Девочки") : undefined,
      groups: [...groups],
    });
  }, [animalType, gender, groups]);

  const clearFilters = () => {
    setAnimalType("");
    setGender("");
    setGroups([]);
    setSearchQuery("");
  };

  const removeGroup = (g: string) => setGroups((prev) => prev.filter((x) => x !== g));
  const removeTypeFilter = () => setAnimalType("");
  const removeGenderFilter = () => setGender("");

  const hasActiveFilters = activeFilters.type || activeFilters.gender || activeFilters.groups.length > 0;

  useEffect(() => {
    const target = loadMoreTriggerRef.current;
    if (!target || loadingInitial || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        void loadPetsPage(items.length, true);
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [items.length, hasMore, loadingInitial, loadingMore, loadPetsPage]);

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full" data-testid="pets-page">
      <section className="flex-1 flex flex-col min-h-0 md:bg-[#F7F8FA] overflow-x-hidden">
        <main className="flex-1 flex flex-col md:flex-row min-h-0 w-full max-w-7xl mr-auto ml-auto sm:pr-6 sm:pl-2 lg:pr-8 lg:pl-0 pr-4 pl-2 gap-x-10 gap-y-10">
          <aside className="w-full md:w-64 shrink-0 md:relative" data-testid="sidebar">
            <div className="space-y-7 bg-[#F8F5EC] border border-[#E9DFC8] rounded-2xl p-5 md:fixed md:top-20 md:bottom-0 md:w-64 md:py-5 md:pr-6 md:pl-0 md:z-30 md:-ml-10 lg:-ml-16 md:rounded-none md:border-l-0 md:border-y-0 md:before:content-[''] md:before:absolute md:before:inset-y-0 md:before:-left-[100vw] md:before:w-[100vw] md:before:bg-[#F8F5EC] md:before:border-y md:before:border-l md:before:border-[#E9DFC8] md:before:-z-10">
          {/* Порядок показа */}
          <div>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOpen((o) => !o);
                }}
                className="flex items-center justify-between w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors shadow-sm"
              >
                <span className="text-sm font-medium text-gray-700">
                  {SORT_OPTIONS.find((s) => s.value === orderBy)?.label ?? orderBy}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`text-lg text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`}
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
                      className={`w-full px-3.5 py-2 text-left text-sm font-medium transition-colors hover:bg-gray-50 ${
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
              <h3 className="text-base font-semibold tracking-tight text-gray-900">Вид</h3>
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
            <div className="space-y-2.5">
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
                    <div className="w-5 h-5 bg-white border border-gray-300 rounded peer-checked:bg-primary peer-checked:border-primary group-hover:border-gray-400 transition-colors" />
                    <Icon
                      icon="solar:check-read-linear"
                      className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity pointer-events-none"
                    />
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-grow">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Пол */}
          <div>
            <h3 className="text-base font-semibold tracking-tight text-gray-900 mb-3">Пол</h3>
            <div className="space-y-2.5">
              {[
                { value: "male" as const, label: "Мальчики" },
                { value: "female" as const, label: "Девочки" },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={gender === value}
                      onChange={(e) => setGender(e.target.checked ? value : "")}
                    />
                    <div className="w-5 h-5 bg-white border border-gray-300 rounded peer-checked:bg-primary peer-checked:border-primary group-hover:border-gray-400 transition-colors" />
                    <Icon
                      icon="solar:check-read-linear"
                      className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity pointer-events-none"
                    />
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-grow">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Группы */}
          <div>
            <h3 className="text-base font-semibold tracking-tight text-gray-900 mb-3">Группы</h3>
            <div className="space-y-2.5">
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
                    <div className="w-5 h-5 bg-white border border-gray-300 rounded peer-checked:bg-primary peer-checked:border-primary group-hover:border-gray-400 transition-colors" />
                    <Icon
                      icon="solar:check-read-linear"
                      className="absolute text-white opacity-0 peer-checked:opacity-100 text-sm transition-opacity pointer-events-none"
                    />
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </div>
            </div>
          </aside>

          <div className="flex-grow pt-6 pb-6 px-4 md:px-5 lg:px-6">
          <div className="mb-4">
            <div className="relative">
              <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени и описанию"
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Очистить поиск"
                >
                  <Icon icon="solar:close-circle-linear" className="text-lg" />
                </button>
              )}
            </div>
          </div>

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
              {activeFilters.gender && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {activeFilters.gender}
                  <button
                    type="button"
                    onClick={removeGenderFilter}
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

          {loadingInitial ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((pet: Pet) => (
                  <PetCard key={pet.id ?? pet.name} pet={pet} />
                ))}
              </div>
              {items.length === 0 && (
                <p className="text-center text-gray-500 py-12">По выбранным фильтрам никого не найдено.</p>
              )}
              {loadingMore && (
                <div className="py-6 flex items-center justify-center text-gray-500 gap-2">
                  <Icon icon="solar:refresh-linear" className="text-lg animate-spin" />
                  <span className="text-sm">Подгружаем питомцев…</span>
                </div>
              )}
              {hasMore && <div ref={loadMoreTriggerRef} className="h-1" aria-hidden="true" />}
              {!hasMore && items.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-6">Показаны все {totalCount} питомцев</p>
              )}
            </>
          )}
          </div>
        </main>
      </section>
    </div>
  );
}
