import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useDelete, useOne, useTable } from "@refinedev/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import { type AdminUser, dataProvider } from "@/admin/core";
import { useToast } from "@/components/ToastProvider";
import {
  AdminCard,
  AdminGhostLink,
  AdminPageHeader,
  AdminPrimaryLink,
  formatDateTime,
} from "@/admin/ui";

function SortButton({
  label,
  field,
  sorters,
  onSort,
}: {
  label: string;
  field: string;
  sorters: Array<{ field: string; order: "asc" | "desc" }>;
  onSort: (field: string) => void;
}) {
  const active = sorters[0]?.field === field ? sorters[0].order : null;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 transition-colors hover:text-primary"
    >
      {label}
      <Icon
        icon={
          active === "asc"
            ? "solar:sort-from-top-to-bottom-linear"
            : active === "desc"
              ? "solar:sort-from-bottom-to-top-linear"
              : "solar:sort-linear"
        }
        className="text-sm"
      />
    </button>
  );
}

export function AdminUsersListPage() {
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
  } = useTable<AdminUser>({
    resource: "users",
    syncWithLocation: false,
    pagination: { mode: "server", pageSize: 10 },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });
  const { mutateAsync: deleteUser } = useDelete();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextFilters = [
        { field: "search_query", operator: "eq" as const, value: searchQuery || undefined },
        { field: "is_admin", operator: "eq" as const, value: adminFilter === "" ? undefined : adminFilter === "true" },
        { field: "is_active", operator: "eq" as const, value: activeFilter === "" ? undefined : activeFilter === "true" },
      ];
      setFilters(nextFilters, "replace");
      setCurrentPage(1);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, adminFilter, activeFilter, setCurrentPage, setFilters]);

  const rows = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminCard>
      <AdminPageHeader
        title="Пользователи"
        description="Администраторы и сотрудники системы с фильтрацией, поиском и управлением ролями."
        action={
          <AdminPrimaryLink to="/admin/users/create">
            <Icon icon="solar:add-circle-linear" className="text-base" />
            Создать пользователя
          </AdminPrimaryLink>
        }
      />

      <div className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_220px_220px]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-600">Поиск</span>
          <div className="relative">
            <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Имя или email"
              className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-600">Роль</span>
          <select
            value={adminFilter}
            onChange={(event) => setAdminFilter(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="">Все</option>
            <option value="true">Администраторы</option>
            <option value="false">Обычные</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-600">Статус</span>
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="">Все</option>
            <option value="true">Активные</option>
            <option value="false">Отключенные</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#E4ECE9]">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-[#F5F8F7]">
              <tr>
                <th className="px-4 py-3 text-center"><SortButton label="Имя" field="name" sorters={sorters as Array<{ field: string; order: "asc" | "desc" }>} onSort={(field) => setSorters([{ field, order: sorters[0]?.field === field && sorters[0]?.order === "asc" ? "desc" : "asc" }])} /></th>
                <th className="px-4 py-3 text-center"><SortButton label="Email" field="email" sorters={sorters as Array<{ field: string; order: "asc" | "desc" }>} onSort={(field) => setSorters([{ field, order: sorters[0]?.field === field && sorters[0]?.order === "asc" ? "desc" : "asc" }])} /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Роль</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Статус</th>
                <th className="px-4 py-3 text-center"><SortButton label="Создан" field="created_at" sorters={sorters as Array<{ field: string; order: "asc" | "desc" }>} onSort={(field) => setSorters([{ field, order: sorters[0]?.field === field && sorters[0]?.order === "asc" ? "desc" : "asc" }])} /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {tableQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Загрузка пользователей...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Ничего не найдено.</td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr key={user.id} className="border-t border-[#EEF3F1]">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_admin ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"}`}>
                        {user.is_admin ? "Администратор" : "Пользователь"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {user.is_active ? "Активен" : "Отключен"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatDateTime(user.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/users/${user.id}`} className="rounded-xl border border-[#DCE7E4] p-2 text-gray-600 transition hover:bg-[#F2F8F7] hover:text-primary">
                          <Icon icon="solar:eye-linear" className="text-lg" />
                        </Link>
                        <Link to={`/admin/users/${user.id}/edit`} className="rounded-xl border border-[#DCE7E4] p-2 text-gray-600 transition hover:bg-[#FFF3ED] hover:text-accent">
                          <Icon icon="solar:pen-linear" className="text-lg" />
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Удалить пользователя ${user.name}?`)) return;
                            try {
                              await deleteUser({ resource: "users", id: user.id });
                              showToast("Пользователь удален", "success");
                            } catch (cause) {
                              showToast(cause instanceof Error ? cause.message : "Не удалось удалить пользователя", "error");
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

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500">Всего: {total}</div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Показывать
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-sm text-gray-600">Стр. {currentPage} из {pageCount}</span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

export function AdminUserShowPage() {
  const { id = "" } = useParams();
  const userQuery = useOne<AdminUser>({ resource: "users", id });
  const user = userQuery.result;

  return (
    <AdminCard>
      <AdminPageHeader
        title={user?.name ?? "Пользователь"}
        description="Просмотр карточки пользователя."
        action={
          <div className="flex gap-2">
            <AdminGhostLink to="/admin/users">
              <Icon icon="solar:arrow-left-linear" className="text-base" />
              К списку
            </AdminGhostLink>
            {id && (
              <AdminPrimaryLink to={`/admin/users/${id}/edit`}>
                <Icon icon="solar:pen-linear" className="text-base" />
                Редактировать
              </AdminPrimaryLink>
            )}
          </div>
        }
      />

      {userQuery.query.isLoading || !user ? (
        <div className="text-sm text-gray-500">Загрузка...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Имя", user.name],
            ["Email", user.email],
            ["Роль", user.is_admin ? "Администратор" : "Пользователь"],
            ["Статус", user.is_active ? "Активен" : "Отключен"],
            ["Создан", formatDateTime(user.created_at)],
            ["Обновлен", formatDateTime(user.updated_at)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#E4ECE9] bg-[#F7FAF9] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-gray-400">{label}</div>
              <div className="mt-2 text-sm font-medium text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}

export function AdminUserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const userQuery = useOne<AdminUser>({
    resource: "users",
    id: id ?? "",
    queryOptions: { enabled: isEdit },
  });
  const user = userQuery.result;
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    is_admin: false,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    setForm({
      email: user.email,
      password: "",
      name: user.name,
      is_admin: user.is_admin,
      is_active: user.is_active,
    });
  }, [user]);

  return (
    <AdminCard>
      <AdminPageHeader
        title={isEdit ? "Редактирование пользователя" : "Создание пользователя"}
        description={isEdit ? "Обновление данных и прав доступа." : "Создание нового администратора или сотрудника."}
        action={
          <AdminGhostLink to="/admin/users">
            <Icon icon="solar:arrow-left-linear" className="text-base" />
            К списку
          </AdminGhostLink>
        }
      />

      {isEdit && userQuery.query.isLoading ? (
        <div className="text-sm text-gray-500">Загрузка...</div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            try {
              if (isEdit && id) {
                const payload: Record<string, unknown> = {
                  email: form.email,
                  name: form.name,
                  is_admin: form.is_admin,
                  is_active: form.is_active,
                };
                if (form.password.trim()) payload.password = form.password;
                await dataProvider.update({ resource: "users", id, variables: payload });
              } else {
                await dataProvider.create({
                  resource: "users",
                  variables: {
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    is_admin: form.is_admin,
                    is_active: form.is_active,
                  },
                });
              }
              showToast(isEdit ? "Пользователь обновлен" : "Пользователь создан", "success");
              navigate("/admin/users", { replace: true });
            } catch (cause) {
              showToast(cause instanceof Error ? cause.message : "Не удалось сохранить пользователя", "error");
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
              <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" required />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">{isEdit ? "Новый пароль" : "Пароль"}</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-[#FBFBFB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder={isEdit ? "Оставьте пустым, если менять не нужно" : "Минимум 6 символов"} required={!isEdit} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-[#E4ECE9] bg-[#F7FAF9] px-4 py-3 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.is_admin} onChange={(event) => setForm((current) => ({ ...current, is_admin: event.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              Администратор
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#E4ECE9] bg-[#F7FAF9] px-4 py-3 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              Активный аккаунт
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-[#E24F36] bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E24F36] disabled:opacity-70">
              <Icon icon={saving ? "solar:refresh-linear" : "solar:diskette-linear"} className={saving ? "animate-spin text-base" : "text-base"} />
              {isEdit ? "Сохранить изменения" : "Создать пользователя"}
            </button>
            <AdminGhostLink to="/admin/users">Отмена</AdminGhostLink>
          </div>
        </form>
      )}
    </AdminCard>
  );
}
