import type { PropsWithChildren, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useGetIdentity } from "@refinedev/core";
import { authProvider, type AdminIdentity } from "@/admin/core";

function navClass(isActive: boolean) {
  return [
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
    isActive
      ? "bg-primary text-white shadow-[0_16px_32px_-22px_rgba(12,90,86,0.9)]"
      : "text-gray-600 hover:bg-[#F8F5EC] hover:text-primary",
  ].join(" ");
}

export function AdminLayout() {
  const navigate = useNavigate();
  const { data } = useGetIdentity<AdminIdentity>();

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#f6f8f7_0%,#fcfaf5_100%)] text-gray-800">
      <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr] lg:px-6">
        <aside className="overflow-hidden rounded-[28px] border border-[#DCE7E4] bg-white/90 p-5 shadow-[0_30px_60px_-40px_rgba(12,90,86,0.5)] backdrop-blur-sm">
          <Link to="/admin/pets" className="mb-8 flex items-center gap-3">
            <div className="rounded-2xl bg-primary p-3 text-cream">
              <Icon icon="solar:shield-user-linear" className="text-2xl" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-primary">Лучший друг</div>
              <div className="text-xs uppercase tracking-[0.18em] text-gray-400">Admin panel</div>
            </div>
          </Link>

          <nav className="space-y-2">
            <NavLink to="/admin/pets" className={({ isActive }) => navClass(isActive)}>
              <Icon icon="solar:paw-linear" className="text-lg" />
              Питомцы
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => navClass(isActive)}>
              <Icon icon="solar:users-group-rounded-linear" className="text-lg" />
              Пользователи
            </NavLink>
          </nav>

          <div className="mt-8 rounded-3xl border border-[#E8DDC7] bg-[#FAF5EA] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-gray-400">Текущий пользователь</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">{data?.name ?? "Администратор"}</div>
            <div className="text-sm text-gray-500">{data?.email ?? ""}</div>
            <button
              type="button"
              onClick={async () => {
                await authProvider.logout?.({});
                navigate("/admin/login", { replace: true });
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#E7D7BD] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Icon icon="solar:logout-2-linear" className="text-base" />
              Выйти
            </button>
          </div>
        </aside>

        <section className="min-w-0 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

export function AdminCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={`rounded-[28px] border border-[#E3EAE7] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(12,90,86,0.35)] ${className}`}>
      {children}
    </section>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminPrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-xl border border-[#E24F36] bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_26px_-18px_rgba(244,86,60,1)] transition-all hover:-translate-y-0.5 hover:bg-[#E24F36]"
    >
      {children}
    </Link>
  );
}

export function AdminGhostLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-xl border border-[#D9E6E3] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-[#F3F8F7] hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Не указано";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Не указано";
  return date.toLocaleString("ru-RU");
}
